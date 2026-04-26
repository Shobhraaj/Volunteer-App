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
import json
from services.auth_service import get_current_user
from services.matching_service import rank_volunteers_for_task, compute_match
from services.firebase_service import sync_task_status, send_fcm_notification
from services.bigquery_service import stream_task_event

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
            history = [{"status": "assigned", "timestamp": datetime.now(timezone.utc).isoformat()}]
            part = Participation(
                volunteer_id=vol_id,
                task_id=task_id,
                status="assigned",
                match_score=match_data["match_score"],
                status_history=json.dumps(history)
            )
            db.add(part)
            assignments.append(part)
            sync_task_status(task_id, vol_id, "assigned", history)

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
        history = [{"status": "assigned", "timestamp": datetime.now(timezone.utc).isoformat()}]
        part = Participation(
            volunteer_id=vol.id,
            task_id=task_id,
            status="assigned",
            match_score=r["match_score"],
            status_history=json.dumps(history)
        )
        db.add(part)
        assignments.append(part)
        sync_task_status(task_id, vol.id, "assigned", history)


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

# ── Update participation status (real-time lifecycle) ────────────────
from schemas.participation import StatusUpdateRequest

@router.put("/{task_id}/participation/{vol_id}/status", response_model=ParticipationOut)
def update_participation_status(
    task_id: int,
    vol_id: int,
    body: StatusUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    part = db.query(Participation).filter(
        Participation.task_id == task_id, 
        Participation.volunteer_id == vol_id
    ).first()
    
    if not part:
        raise HTTPException(404, "Participation record not found")

    # Authorization: Either the volunteer themselves or the task organizer
    task = db.query(Task).filter(Task.id == task_id).first()
    if user.id != vol_id and user.id != task.organizer_id:
        raise HTTPException(403, "Not authorized to update this status")

    # Update status
    part.status = body.status
    
    # Update history
    history = json.loads(part.status_history or "[]")
    history.append({
        "status": body.status,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    part.status_history = json.dumps(history)

    if body.status == "completed":
        part.completed_at = datetime.now(timezone.utc)
        # Update volunteer score
        volunteer = db.query(User).filter(User.id == vol_id).first()
        if volunteer:
            volunteer.tasks_completed_count += 1
            volunteer.points += 100
            # Timeliness bonus (if completed within 24h of being active)
            active_time = next((h["timestamp"] for h in history if h["status"] == "active"), None)
            if active_time:
                dt_active = datetime.fromisoformat(active_time)
                if (datetime.now(timezone.utc) - dt_active).total_seconds() < 86400:
                    volunteer.points += 50
            # Calculate overall performance
            volunteer.performance_score = (volunteer.tasks_completed_count * 10) + (volunteer.points / 100)
    
    db.commit()
    db.refresh(part)

    # Sync to Firestore
    sync_task_status(task_id, vol_id, part.status, history)

    # Stream to BigQuery
    stream_task_event(task_id, vol_id, body.status)

    # Send Notification (Simulated token fetch)
    # send_fcm_notification(user.fcm_token, "Task Update", f"Task status is now {body.status}")

    return part

# ── Withdraw from task (volunteer) ───────────────────────────────────
@router.post("/{task_id}/withdraw")
def withdraw_from_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    part = db.query(Participation).filter(
        Participation.task_id == task_id, 
        Participation.volunteer_id == user.id
    ).first()
    
    if not part:
        raise HTTPException(404, "Participation record not found")

    if part.status in ("completed", "cancelled"):
        raise HTTPException(400, "Cannot withdraw from a completed or cancelled task")

    part.status = "cancelled"
    history = json.loads(part.status_history or "[]")
    history.append({"status": "cancelled", "timestamp": datetime.now(timezone.utc).isoformat(), "reason": "Volunteer withdrew"})
    part.status_history = json.dumps(history)
    
    # Re-open slot
    task = db.query(Task).filter(Task.id == task_id).first()
    if task:
        task.current_volunteers -= 1
        if task.status == "in_progress" and task.current_volunteers < task.max_volunteers:
            task.status = "open"

    db.commit()
    sync_task_status(task_id, user.id, "cancelled", history)
    return {"message": "Withdrawn successfully"}

# ── Cancel assignment (organizer) ───────────────────────────────────
@router.post("/{task_id}/cancel-assignment/{vol_id}")
def cancel_assignment(
    task_id: int,
    vol_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task or task.organizer_id != user.id:
        raise HTTPException(403, "Not authorized to manage this task")

    part = db.query(Participation).filter(
        Participation.task_id == task_id, 
        Participation.volunteer_id == vol_id
    ).first()
    
    if not part:
        raise HTTPException(404, "Participation record not found")

    part.status = "cancelled"
    history = json.loads(part.status_history or "[]")
    history.append({"status": "cancelled", "timestamp": datetime.now(timezone.utc).isoformat(), "reason": "Organizer cancelled"})
    part.status_history = json.dumps(history)
    
    # Update count
    task.current_volunteers -= 1
    if task.status == "in_progress" and task.current_volunteers < task.max_volunteers:
        task.status = "open"

    db.commit()
    sync_task_status(task_id, vol_id, "cancelled", history)
    return {"message": "Assignment cancelled"}

