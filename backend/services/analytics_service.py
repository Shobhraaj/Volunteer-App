"""
Analytics Service — aggregates data for the dashboard.
"""

from collections import Counter
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from models.user import User
from models.task import Task
from models.participation import Participation


def get_dashboard_data(db: Session) -> dict:
    """Build the full analytics payload consumed by the frontend dashboard."""

    # ── Summary counts ───────────────────────────────────────────
    total_volunteers = db.query(User).filter(User.role == "volunteer").count()
    total_organizers = db.query(User).filter(User.role == "organizer").count()
    total_tasks = db.query(Task).count()
    active_tasks = db.query(Task).filter(Task.status.in_(["open", "in_progress"])).count()

    # ── Completion rate ──────────────────────────────────────────
    total_participations = db.query(Participation).count()
    completed = db.query(Participation).filter(Participation.status == "completed").count()
    completion_rate = round((completed / total_participations * 100) if total_participations else 0, 1)

    # ── Average reliability ──────────────────────────────────────
    avg_rel = db.query(func.avg(User.reliability_score)).filter(User.role == "volunteer").scalar()
    avg_reliability = round(float(avg_rel) if avg_rel else 0, 2)

    # ── Engagement trends (by month) ─────────────────────────────
    engagement_trends = _engagement_trends(db)

    # ── Completion breakdown ─────────────────────────────────────
    completion_breakdown = _completion_breakdown(db, total_participations)

    # ── Top skills demand ────────────────────────────────────────
    top_skills = _top_skills(db)

    # ── Demand forecast (from ML module) ─────────────────────────
    from ml.demand_forecasting import forecast_demand
    demand_forecast = forecast_demand(db)

    return {
        "total_volunteers": total_volunteers,
        "total_organizers": total_organizers,
        "total_tasks": total_tasks,
        "active_tasks": active_tasks,
        "completion_rate": completion_rate,
        "avg_reliability": avg_reliability,
        "engagement_trends": engagement_trends,
        "completion_breakdown": completion_breakdown,
        "top_skills": top_skills,
        "demand_forecast": demand_forecast,
    }


def _engagement_trends(db: Session) -> list[dict]:
    """Monthly counts of active volunteers and tasks."""
    # Active volunteers per month (from participations)
    rows = (
        db.query(
            func.to_char(Participation.applied_at, 'YYYY-MM').label("period"),
            func.count(func.distinct(Participation.volunteer_id)).label("active_volunteers"),
        )
        .group_by("period")
        .order_by("period")
        .all()
    )
    vol_map = {r.period: r.active_volunteers for r in rows}

    # Tasks created per month
    task_rows = (
        db.query(
            func.to_char(Task.created_at, 'YYYY-MM').label("period"),
            func.count(Task.id).label("cnt"),
        )
        .group_by("period")
        .order_by("period")
        .all()
    )
    task_map = {r.period: r.cnt for r in task_rows}

    # Completed tasks per month
    comp_rows = (
        db.query(
            func.to_char(Participation.completed_at, 'YYYY-MM').label("period"),
            func.count(Participation.id).label("cnt"),
        )
        .filter(Participation.status == "completed", Participation.completed_at.isnot(None))
        .group_by("period")
        .order_by("period")
        .all()
    )
    comp_map = {r.period: r.cnt for r in comp_rows}

    all_periods = sorted(set(list(vol_map) + list(task_map) + list(comp_map)))
    return [
        {
            "period": p,
            "active_volunteers": vol_map.get(p, 0),
            "tasks_created": task_map.get(p, 0),
            "tasks_completed": comp_map.get(p, 0),
        }
        for p in all_periods
    ]


def _completion_breakdown(db: Session, total: int) -> list[dict]:
    """Count participations by status."""
    rows = (
        db.query(Participation.status, func.count(Participation.id).label("cnt"))
        .group_by(Participation.status)
        .all()
    )
    return [
        {
            "status": r.status,
            "count": r.cnt,
            "percentage": round(r.cnt / total * 100, 1) if total else 0,
        }
        for r in rows
    ]


def _top_skills(db: Session, limit: int = 10) -> list[dict]:
    """Most-demanded skills across all tasks."""
    tasks = db.query(Task.required_skills).all()
    counter: Counter = Counter()
    for (skills,) in tasks:
        if skills:
            for s in skills:
                counter[s.lower()] += 1
    return [{"skill": sk, "count": ct} for sk, ct in counter.most_common(limit)]
