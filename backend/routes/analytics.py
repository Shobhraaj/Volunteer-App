"""
Analytics routes — serves the dashboard data and leaderboard.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
import csv
import io
from fastapi.responses import StreamingResponse

from database import get_db
from models.user import User
from models.badge import Badge
from schemas.analytics import DashboardData
from services.auth_service import get_current_user
from services.analytics_service import get_dashboard_data

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardData)
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_dashboard_data(db)


@router.get("/export")
def export_csv(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Export task and participation data as CSV for admins."""
    if user.role not in ("organizer", "admin"):
        raise HTTPException(403, "Only admins can export reports")

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow(["Task ID", "Title", "Status", "Volunteer ID", "Volunteer Name", "Match Score", "Applied At", "Completed At"])

    from models.participation import Participation
    from models.task import Task
    
    # Join query
    results = (
        db.query(Participation, Task, User)
        .join(Task, Participation.task_id == Task.id)
        .join(User, Participation.volunteer_id == User.id)
        .all()
    )

    for part, task, vol in results:
        writer.writerow([
            task.id, task.title, part.status, 
            vol.id, vol.full_name, 
            part.match_score, part.applied_at, part.completed_at
        ])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=volunteer_report.csv"}
    )


@router.get("/leaderboard")
def leaderboard(
    limit: int = 20,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return top volunteers ranked by points with badge info."""
    volunteers = (
        db.query(User)
        .filter(User.role == "volunteer")
        .order_by(desc(User.points))
        .limit(limit)
        .all()
    )

    from models.participation import Participation
    result = []
    for i, vol in enumerate(volunteers):
        badges = db.query(Badge).filter(Badge.user_id == vol.id).all()
        completed = (
            db.query(Participation)
            .filter(
                Participation.volunteer_id == vol.id,
                Participation.status == "completed",
            )
            .count()
        )
        result.append({
            "rank":            i + 1,
            "id":              vol.id,
            "full_name":       vol.full_name,
            "points":          vol.points or 0,
            "tasks_completed": vol.tasks_completed_count or 0,
            "reliability":     round((vol.reliability_score or 0) * 100, 1),
            "performance":     round(vol.performance_score or 0, 1),
            "badges":          [b.badge_name for b in badges],
        })

    return result
