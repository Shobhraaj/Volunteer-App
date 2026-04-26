"""
Badge ORM model — gamification badges earned by volunteers.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from database import Base


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    badge_type = Column(String(100), nullable=False)  # e.g. "first_task", "streak_5", "top_volunteer"
    badge_name = Column(String(255), nullable=False)   # Human-readable display name
    earned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
