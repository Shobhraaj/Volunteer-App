"""
Task Recommendation Service — recommends tasks to a given volunteer.

Uses content-based filtering:
  1. Skill overlap with the task's required skills
  2. Interest alignment (task description / category matching)
  3. Past engagement bonus (volunteers who completed similar tasks get boosted)
  4. Location proximity bonus
"""

from sqlalchemy.orm import Session
from models.user import User
from models.task import Task
from models.participation import Participation
from services.matching_service import _skill_score, _location_score


def recommend_tasks_for_volunteer(
    db: Session, volunteer: User, limit: int = 10
) -> list[dict]:
    """
    Return a ranked list of open tasks with relevance scores and human-readable reasons.
    """
    open_tasks = db.query(Task).filter(Task.status == "open").all()

    # Collect task IDs the volunteer already applied / assigned to
    existing_ids = set(
        row.task_id
        for row in db.query(Participation.task_id)
        .filter(Participation.volunteer_id == volunteer.id)
        .all()
    )

    # Past completed task skill sets — for "engagement bonus"
    completed_task_ids = [
        row.task_id
        for row in db.query(Participation.task_id)
        .filter(
            Participation.volunteer_id == volunteer.id,
            Participation.status == "completed",
        )
        .all()
    ]
    past_skills: set[str] = set()
    if completed_task_ids:
        past_tasks = db.query(Task).filter(Task.id.in_(completed_task_ids)).all()
        for t in past_tasks:
            past_skills.update(s.lower() for s in (t.required_skills or []))

    recommendations = []
    for task in open_tasks:
        if task.id in existing_ids:
            continue  # already participating
        if task.current_volunteers >= task.max_volunteers:
            continue  # full

        reasons: list[str] = []
        score = 0.0

        # ── Skill match (40%) ────────────────────────────────────
        s = _skill_score(volunteer.skills, task.required_skills)
        score += 0.40 * s
        if s > 0.5:
            matched = set(sk.lower() for sk in (volunteer.skills or [])) & set(
                sk.lower() for sk in (task.required_skills or [])
            )
            reasons.append(f"Your skills match: {', '.join(matched)}")

        # ── Interest match (20%) ─────────────────────────────────
        interest_score = 0.0
        if volunteer.interests and task.required_skills:
            vol_interests = set(i.lower() for i in volunteer.interests)
            task_tags = set(s.lower() for s in task.required_skills)
            overlap = vol_interests & task_tags
            if overlap:
                interest_score = len(overlap) / len(vol_interests)
                reasons.append(f"Matches your interests: {', '.join(overlap)}")
        score += 0.20 * interest_score

        # ── Past engagement bonus (20%) ──────────────────────────
        engagement_score = 0.0
        if past_skills and task.required_skills:
            task_sk = set(s.lower() for s in task.required_skills)
            overlap = past_skills & task_sk
            if overlap:
                engagement_score = len(overlap) / len(task_sk)
                reasons.append("Similar to tasks you've completed before")
        score += 0.20 * engagement_score

        # ── Location proximity (20%) ─────────────────────────────
        loc = _location_score(volunteer, task)
        score += 0.20 * loc
        if loc > 0.7 and task.location_name:
            reasons.append(f"Near you: {task.location_name}")

        # ── Urgency nudge (small bonus, not in main score) ───────
        urgency_bonus = {"critical": 0.05, "high": 0.03, "medium": 0.01, "low": 0.0}
        score += urgency_bonus.get(task.urgency, 0.0)
        if task.urgency in ("critical", "high"):
            reasons.append(f"⚡ Urgency: {task.urgency}")

        if not reasons:
            reasons.append("Explore something new!")

        recommendations.append({
            "task": task,
            "relevance_score": round(score * 100, 2),
            "reasons": reasons,
        })

    recommendations.sort(key=lambda x: x["relevance_score"], reverse=True)
    return recommendations[:limit]
