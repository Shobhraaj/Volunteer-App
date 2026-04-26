"""
Smart Matching Service — implements the weighted scoring algorithm:

    Match Score = (0.4 × Skill) + (0.2 × Location) + (0.2 × Availability) + (0.2 × Reliability)

Each sub-score is normalised to [0, 1] then the final score is returned as 0–100.
"""

import math
from datetime import datetime
from sqlalchemy.orm import Session

from models.user import User
from models.task import Task
from config import (
    MATCH_WEIGHT_SKILL,
    MATCH_WEIGHT_LOCATION,
    MATCH_WEIGHT_AVAILABILITY,
    MATCH_WEIGHT_RELIABILITY,
)


def _skill_score(volunteer_skills: list[str], required_skills: list[str]) -> float:
    """
    Jaccard-like overlap: |intersection| / |required|.
    If no skills are required, every volunteer scores 1.0.
    """
    if not required_skills:
        return 1.0
    vol_set = set(s.lower() for s in (volunteer_skills or []))
    req_set = set(s.lower() for s in required_skills)
    if not req_set:
        return 1.0
    return len(vol_set & req_set) / len(req_set)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two GPS points in kilometres."""
    R = 6371.0  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _location_score(volunteer: User, task: Task) -> float:
    """
    Score decreases with distance.  ≤5 km → 1.0 , ≥50 km → 0.0, linear in between.
    If either side has no GPS data, return a neutral 0.5.
    """
    if volunteer.latitude is None or task.latitude is None:
        return 0.5
    dist = _haversine_km(volunteer.latitude, volunteer.longitude, task.latitude, task.longitude)
    if dist <= 5:
        return 1.0
    if dist >= 50:
        return 0.0
    return 1.0 - (dist - 5) / 45.0


def _availability_score(volunteer: User, task: Task) -> float:
    """
    Check whether the volunteer's availability covers the task's time slot.
    Simplified: map task.start_time weekday → check if the volunteer has that day listed.
    If no data on either side, return neutral 0.5.
    """
    avail = volunteer.availability
    if not avail or not task.start_time:
        return 0.5

    day_name = task.start_time.strftime("%A").lower()  # e.g. "monday"
    if day_name in avail:
        return 1.0
    # Also try abbreviated forms
    day_short = task.start_time.strftime("%a").lower()  # e.g. "mon"
    if day_short in avail:
        return 1.0
    return 0.0


def _reliability_score(volunteer: User) -> float:
    """Direct passthrough — reliability already lives on the user profile (0–1)."""
    return volunteer.reliability_score if volunteer.reliability_score is not None else 0.5


def compute_match(volunteer: User, task: Task) -> dict:
    """
    Compute the full match breakdown for one volunteer × one task.
    Returns dict with individual sub-scores and the combined weighted score (0–100).
    """
    skill = _skill_score(volunteer.skills, task.required_skills)
    location = _location_score(volunteer, task)
    availability = _availability_score(volunteer, task)
    reliability = _reliability_score(volunteer)

    combined = (
        MATCH_WEIGHT_SKILL * skill
        + MATCH_WEIGHT_LOCATION * location
        + MATCH_WEIGHT_AVAILABILITY * availability
        + MATCH_WEIGHT_RELIABILITY * reliability
    )

    return {
        "volunteer": volunteer,
        "match_score": round(combined * 100, 2),
        "skill_score": round(skill, 3),
        "location_score": round(location, 3),
        "availability_score": round(availability, 3),
        "reliability_score": round(reliability, 3),
    }


def rank_volunteers_for_task(
    db: Session, task: Task, top_n: int = 10
) -> list[dict]:
    """
    Score ALL volunteers against a task, then return the top N sorted descending.
    """
    volunteers = db.query(User).filter(User.role == "volunteer").all()
    scored = [compute_match(v, task) for v in volunteers]
    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return scored[:top_n]
