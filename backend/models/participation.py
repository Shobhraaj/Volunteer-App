"""
Participation ORM model — tracks the relationship between volunteers and tasks.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from database import Base


class Participation(Base):
    __tablename__ = "participations"

    id = Column(Integer, primary_key=True, index=True)
    volunteer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)

    # Status tracks the lifecycle: created | assigned | accepted | active | completed | cancelled
    status = Column(String(50), default="created") 
    match_score = Column(Float, nullable=True)       # AI-computed match score when assigned
    
    # Stores detailed history of transitions: [{"status": "...", "timestamp": "..."}]
    status_history = Column(String, default="[]") 

    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

