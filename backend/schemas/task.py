"""
Pydantic schemas for Task-related requests / responses.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    required_skills: list[str] = []
    urgency: str = "medium"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    max_volunteers: int = 5


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[list[str]] = None
    urgency: Optional[str] = None
    status: Optional[str] = None
    max_volunteers: Optional[int] = None


class TaskOut(BaseModel):
    id: int
    title: str
    description: str | None = None
    organizer_id: int
    required_skills: list[str] | None = []
    urgency: str
    latitude: float | None = None
    longitude: float | None = None
    location_name: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    max_volunteers: int
    current_volunteers: int
    status: str
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class TaskRecommendation(BaseModel):
    """A recommended task for a volunteer, with a relevance score."""
    task: TaskOut
    relevance_score: float
    reasons: list[str]
