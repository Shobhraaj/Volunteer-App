"""
Organizer-specific routes — stats, volunteer management.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.task import Task
from models.participation import Participation
from schemas.task import TaskOut
from services.auth_service import get_current_user
from ml.reliability_model import predict_show_up_probability, train_reliability_model

router = APIRouter(prefix="/api/organizers", tags=["Organizers"])


@router.get("/my-tasks", response_model=list[TaskOut])
def my_tasks(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Task).filter(Task.organizer_id == user.id).order_by(Task.created_at.desc()).all()


@router.get("/volunteer/{volunteer_id}/reliability")
def volunteer_reliability(
    volunteer_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the ML-predicted probability of a volunteer showing up."""
    proba = predict_show_up_probability(db, volunteer_id)
    return {"volunteer_id": volunteer_id, "predicted_show_up_probability": proba}


@router.post("/train-model")
def retrain_model(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrain the reliability ML model on current data."""
    if user.role not in ("organizer", "admin"):
        from fastapi import HTTPException
        raise HTTPException(403, "Only organizers/admins can retrain models")
    result = train_reliability_model(db)
    return result


@router.get("/stats")
def organizer_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Quick stats for the current organizer."""
    tasks = db.query(Task).filter(Task.organizer_id == user.id).all()
    task_ids = [t.id for t in tasks]

    total_tasks = len(tasks)
    active_tasks = sum(1 for t in tasks if t.status in ("open", "in_progress"))
    completed_tasks = sum(1 for t in tasks if t.status == "completed")

    total_participations = (
        db.query(Participation).filter(Participation.task_id.in_(task_ids)).count() if task_ids else 0
    )
    completed_participations = (
        db.query(Participation)
        .filter(Participation.task_id.in_(task_ids), Participation.status == "completed")
        .count()
        if task_ids
        else 0
    )

    return {
        "total_tasks": total_tasks,
        "active_tasks": active_tasks,
        "completed_tasks": completed_tasks,
        "total_volunteers_engaged": total_participations,
        "completed_participations": completed_participations,
    }
