"""
Task CRUD routes — listing, creation, updates, deletion.
Also hosts the AI-matching & auto-assign endpoints.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.task import Task
from models.participation import Participation
from schemas.task import TaskCreate, TaskUpdate, TaskOut
from schemas.user import VolunteerMatch, UserOut
from schemas.participation import AssignRequest, AutoAssignResponse, ParticipationOut
from services.auth_service import get_current_user
from services.matching_service import rank_volunteers_for_task, compute_match

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


# ── List tasks ───────────────────────────────────────────────────────
@router.get("/", response_model=list[TaskOut])
def list_tasks(
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Task)
    if status:
        q = q.filter(Task.status == status)
    return q.order_by(Task.created_at.desc()).all()


# ── Get single task ──────────────────────────────────────────────────
@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    return task


# ── Create task (organizer) ──────────────────────────────────────────
@router.post("/", response_model=TaskOut)
def create_task(
    body: TaskCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role not in ("organizer", "admin"):
        raise HTTPException(403, "Only organizers can create tasks")
    task = Task(**body.model_dump(), organizer_id=user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


# ── Update task ──────────────────────────────────────────────────────
@router.put("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    body: TaskUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.organizer_id == user.id).first()
    if not task:
        raise HTTPException(404, "Task not found or you don't own it")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


# ── Delete task ──────────────────────────────────────────────────────
@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.organizer_id == user.id).first()
    if not task:
        raise HTTPException(404, "Task not found or you don't own it")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}


# ── AI-Matched volunteers for a task ─────────────────────────────────
@router.get("/{task_id}/matches", response_model=list[VolunteerMatch])
def get_matches(
    task_id: int,
    top_n: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    ranked = rank_volunteers_for_task(db, task, top_n=top_n)
    return [
        VolunteerMatch(
            volunteer=UserOut.model_validate(r["volunteer"]),
            match_score=r["match_score"],
            skill_score=r["skill_score"],
            location_score=r["location_score"],
            availability_score=r["availability_score"],
            reliability_score=r["reliability_score"],
        )
        for r in ranked
    ]


# ── Manual assign volunteers ─────────────────────────────────────────
@router.post("/{task_id}/assign", response_model=list[ParticipationOut])
def assign_volunteers(
    task_id: int,
    body: AssignRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")

    assignments = []
    for vol_id in body.volunteer_ids:
        volunteer = db.query(User).filter(User.id == vol_id, User.role == "volunteer").first()
        if not volunteer:
            continue
        # Check existing
        existing = (
            db.query(Participation)
            .filter(
                Participation.volunteer_id == vol_id,
                Participation.task_id == task_id,
                Participation.status.in_(["applied", "assigned"]),
            )
            .first()
        )
        if existing:
            existing.status = "assigned"
            match_data = compute_match(volunteer, task)
            existing.match_score = match_data["match_score"]
            assignments.append(existing)
        else:
            match_data = compute_match(volunteer, task)
            part = Participation(
                volunteer_id=vol_id,
                task_id=task_id,
                status="assigned",
                match_score=match_data["match_score"],
            )
            db.add(part)
            assignments.append(part)

    task.current_volunteers = (
        db.query(Participation)
        .filter(Participation.task_id == task_id, Participation.status.in_(["assigned", "completed"]))
        .count()
    ) + len([a for a in assignments if a not in db])  # include new ones

    if task.status == "open":
        task.status = "in_progress"
    db.commit()
    for a in assignments:
        db.refresh(a)
    return assignments


# ── Auto-assign top volunteers ───────────────────────────────────────
@router.post("/{task_id}/auto-assign", response_model=AutoAssignResponse)
def auto_assign(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")

    slots = task.max_volunteers - task.current_volunteers
    if slots <= 0:
        raise HTTPException(400, "Task is already full")

    ranked = rank_volunteers_for_task(db, task, top_n=slots)
    assignments = []
    for r in ranked:
        vol = r["volunteer"]
        existing = (
            db.query(Participation)
            .filter(
                Participation.volunteer_id == vol.id,
                Participation.task_id == task_id,
                Participation.status.in_(["assigned", "completed"]),
            )
            .first()
        )
        if existing:
            continue
        part = Participation(
            volunteer_id=vol.id,
            task_id=task_id,
            status="assigned",
            match_score=r["match_score"],
        )
        db.add(part)
        assignments.append(part)

    task.current_volunteers += len(assignments)
    if task.status == "open":
        task.status = "in_progress"
    db.commit()
    for a in assignments:
        db.refresh(a)

    return AutoAssignResponse(
        assigned_count=len(assignments),
        assignments=[ParticipationOut.model_validate(a) for a in assignments],
    )


# ── Task participants list ───────────────────────────────────────────
@router.get("/{task_id}/participants", response_model=list[ParticipationOut])
def get_participants(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(Participation)
        .filter(Participation.task_id == task_id)
        .order_by(Participation.applied_at.desc())
        .all()
    )
