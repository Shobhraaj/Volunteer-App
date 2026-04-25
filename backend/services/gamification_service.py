"""
Gamification Service — awards points and badges after task completion.
"""

from sqlalchemy.orm import Session
from models.user import User
from models.badge import Badge
from models.participation import Participation


# ── Points table ─────────────────────────────────────────────────────
POINTS_PER_COMPLETION = 10
POINTS_BONUS_HIGH_URGENCY = 5
POINTS_BONUS_CRITICAL = 10


def award_points(db: Session, user: User, task_urgency: str) -> int:
    """Add points after a task completion.  Returns the points awarded."""
    pts = POINTS_PER_COMPLETION
    if task_urgency == "high":
        pts += POINTS_BONUS_HIGH_URGENCY
    elif task_urgency == "critical":
        pts += POINTS_BONUS_CRITICAL
    user.points = (user.points or 0) + pts
    db.commit()
    return pts


# ── Badge definitions ────────────────────────────────────────────────
BADGE_RULES = [
    {"type": "first_task",    "name": "🌱 First Step",       "threshold": 1},
    {"type": "five_tasks",    "name": "⭐ Rising Star",      "threshold": 5},
    {"type": "ten_tasks",     "name": "🔥 Dedicated",        "threshold": 10},
    {"type": "twenty_tasks",  "name": "🏆 Champion",         "threshold": 20},
    {"type": "fifty_tasks",   "name": "💎 Legend",            "threshold": 50},
]


def check_and_award_badges(db: Session, user: User) -> list[dict]:
    """
    Check all badge rules and award any newly qualified badges.
    Returns list of newly awarded badge dicts.
    """
    completed_count = (
        db.query(Participation)
        .filter(Participation.volunteer_id == user.id, Participation.status == "completed")
        .count()
    )

    existing_types = set(
        b.badge_type
        for b in db.query(Badge).filter(Badge.user_id == user.id).all()
    )

    new_badges = []
    for rule in BADGE_RULES:
        if completed_count >= rule["threshold"] and rule["type"] not in existing_types:
            badge = Badge(
                user_id=user.id,
                badge_type=rule["type"],
                badge_name=rule["name"],
            )
            db.add(badge)
            new_badges.append({"badge_type": rule["type"], "badge_name": rule["name"]})

    if new_badges:
        db.commit()
    return new_badges


def update_reliability(db: Session, user: User) -> float:
    """
    Recalculate reliability_score from historical participations.
    reliability = completed / (completed + no_show)
    """
    completed = (
        db.query(Participation)
        .filter(Participation.volunteer_id == user.id, Participation.status == "completed")
        .count()
    )
    no_shows = (
        db.query(Participation)
        .filter(Participation.volunteer_id == user.id, Participation.status == "no_show")
        .count()
    )
    total = completed + no_shows
    if total == 0:
        user.reliability_score = 1.0
    else:
        user.reliability_score = round(completed / total, 3)
    db.commit()
    return user.reliability_score
