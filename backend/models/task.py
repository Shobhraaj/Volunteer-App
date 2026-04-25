"""
Task ORM model — represents volunteer opportunities created by organizers.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Text, ForeignKey
from database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Requirements
    required_skills = Column(JSON, default=list)   # e.g. ["teaching", "first_aid"]
    urgency = Column(String(50), default="medium")  # low | medium | high | critical

    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(255), nullable=True)

    # Scheduling
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)

    # Capacity
    max_volunteers = Column(Integer, default=5)
    current_volunteers = Column(Integer, default=0)

    # Status
    status = Column(String(50), default="open")  # open | in_progress | completed | cancelled

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
