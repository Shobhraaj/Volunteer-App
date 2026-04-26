"""
Volunteer-facing routes — profile, recommendations, participation history, badges.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.task import Task
from models.participation import Participation
from models.badge import Badge
from schemas.user import UserOut, UserProfileUpdate
from schemas.task import TaskRecommendation, TaskOut
from schemas.participation import ParticipationCreate, ParticipationOut
from services.auth_service import get_current_user
from services.recommendation_service import recommend_tasks_for_volunteer
from services.gamification_service import award_points, check_and_award_badges, update_reliability

router = APIRouter(prefix="/api/volunteers", tags=["Volunteers"])


# ── Profile ──────────────────────────────────────────────────────────
@router.get("/me", response_model=UserOut)
def get_profile(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserOut)
def update_profile(
    body: UserProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


# ── Badges ───────────────────────────────────────────────────────────
@router.get("/me/badges")
def get_badges(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    badges = db.query(Badge).filter(Badge.user_id == user.id).all()
    return [{"badge_type": b.badge_type, "badge_name": b.badge_name, "earned_at": b.earned_at} for b in badges]


# ── Task recommendations ────────────────────────────────────────────
@router.get("/recommendations", response_model=list[TaskRecommendation])
def get_recommendations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 10,
):
    recs = recommend_tasks_for_volunteer(db, user, limit=limit)
    return [
        TaskRecommendation(
            task=TaskOut.model_validate(r["task"]),
            relevance_score=r["relevance_score"],
            reasons=r["reasons"],
        )
        for r in recs
    ]


# ── Apply to a task ─────────────────────────────────────────────────
@router.post("/apply", response_model=ParticipationOut)
def apply_to_task(
    body: ParticipationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check task exists and is open
    task = db.query(Task).filter(Task.id == body.task_id).first()
    if not task:
        from fastapi import HTTPException
        raise HTTPException(404, "Task not found")
    if task.status != "open":
        from fastapi import HTTPException
        raise HTTPException(400, "Task is not open for applications")

    # Prevent duplicate applications
    existing = (
        db.query(Participation)
        .filter(
            Participation.volunteer_id == user.id,
            Participation.task_id == body.task_id,
            Participation.status.in_(["applied", "assigned"]),
        )
        .first()
    )
    if existing:
        from fastapi import HTTPException
        raise HTTPException(400, "Already applied/assigned to this task")

    part = Participation(volunteer_id=user.id, task_id=body.task_id, status="applied")
    db.add(part)
    db.commit()
    db.refresh(part)
    return part


# ── Participation history ────────────────────────────────────────────
@router.get("/history", response_model=list[ParticipationOut])
def participation_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Join with Task to get title
    results = (
        db.query(Participation, Task)
        .join(Task, Participation.task_id == Task.id)
        .filter(Participation.volunteer_id == user.id)
        .order_by(Participation.applied_at.desc())
        .all()
    )

    return [
        {
            **ParticipationOut.model_validate(p).model_dump(),
            "task_title": t.title
        }
        for p, t in results
    ]


# ── Complete a task (volunteer marks done) ───────────────────────────
@router.post("/complete/{participation_id}")
def complete_task(
    participation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    part = (
        db.query(Participation)
        .filter(Participation.id == participation_id, Participation.volunteer_id == user.id)
        .first()
    )
    if not part:
        from fastapi import HTTPException
        raise HTTPException(404, "Participation not found")

    part.status = "completed"
    part.completed_at = datetime.now(timezone.utc)
    db.commit()

    # Award points & check badges
    task = db.query(Task).filter(Task.id == part.task_id).first()
    pts = award_points(db, user, task.urgency if task else "medium")
    new_badges = check_and_award_badges(db, user)
    reliability = update_reliability(db, user)

    # Update task volunteer count
    if task:
        completed_count = (
            db.query(Participation)
            .filter(Participation.task_id == task.id, Participation.status == "completed")
            .count()
        )
        task.current_volunteers = completed_count
        if completed_count >= task.max_volunteers:
            task.status = "completed"
        db.commit()

    return {
        "message": "Task completed!",
        "points_awarded": pts,
        "new_badges": new_badges,
        "reliability_score": reliability,
    }


# ── Cancel / withdraw from a task ────────────────────────────────────
@router.delete("/cancel/{participation_id}")
def cancel_participation(
    participation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    part = (
        db.query(Participation)
        .filter(
            Participation.id == participation_id,
            Participation.volunteer_id == user.id,
        )
        .first()
    )
    if not part:
        from fastapi import HTTPException
        raise HTTPException(404, "Participation not found")
    if part.status == "completed":
        from fastapi import HTTPException
        raise HTTPException(400, "Cannot cancel a completed participation")

    part.status = "cancelled"
    db.commit()

    # Update task volunteer count
    task = db.query(Task).filter(Task.id == part.task_id).first()
    if task and task.current_volunteers > 0:
        task.current_volunteers = max(0, task.current_volunteers - 1)
        if task.status != "open":
            task.status = "open"
        db.commit()

    return {"message": "Participation cancelled successfully", "task_id": part.task_id}


# ── Certificates ─────────────────────────────────────────────────────
@router.get("/certificates")
def get_certificates(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns certificate data. Primary source is Firebase Firestore (handled client-side).
    This endpoint provides a local fallback based on completed tasks.
    """
    records = (
        db.query(Participation)
        .filter(
            Participation.volunteer_id == user.id,
            Participation.status == "completed",
        )
        .order_by(Participation.completed_at.desc())
        .all()
    )

    certs = []
    for r in records:
        task = db.query(Task).filter(Task.id == r.task_id).first()
        if not task:
            continue
        certs.append({
            "id":         f"cert-{r.id}",
            "title":      f"Certificate of Participation — {task.title}",
            "issuer":     "VolunteerAI Platform",
            "date":       (r.completed_at or r.applied_at).isoformat() if (r.completed_at or r.applied_at) else "",
            "category":   "Participation",
            "task_id":    task.id,
            "storageRef": None,  # Populate from Firebase Storage
        })

    return certs
