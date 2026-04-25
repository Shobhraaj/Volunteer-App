"""
User ORM model — covers volunteers, organizers, and admins.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="volunteer")  # volunteer | organizer | admin

    # Volunteer-specific profile fields
    skills = Column(JSON, default=list)          # e.g. ["teaching", "cooking", "medical"]
    interests = Column(JSON, default=list)       # e.g. ["education", "environment"]
    availability = Column(JSON, default=dict)    # e.g. {"monday": ["09:00-17:00"], ...}

    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(255), nullable=True)

    # Gamification & reliability
    points = Column(Integer, default=0)
    reliability_score = Column(Float, default=1.0)  # 0.0 – 1.0

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
