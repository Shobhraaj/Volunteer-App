"""
Pydantic schemas for User-related requests / responses.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


# ── Auth ────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "volunteer"  # volunteer | organizer


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int


# ── Profile ─────────────────────────────────────────────────────────
class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    skills: Optional[list[str]] = None
    interests: Optional[list[str]] = None
    availability: Optional[dict] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    skills: list[str] | None = []
    interests: list[str] | None = []
    availability: dict | None = {}
    latitude: float | None = None
    longitude: float | None = None
    location_name: str | None = None
    points: int = 0
    reliability_score: float = 1.0
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class VolunteerMatch(BaseModel):
    """Returned when the AI ranks a volunteer for a task."""
    volunteer: UserOut
    match_score: float
    skill_score: float
    location_score: float
    availability_score: float
    reliability_score: float
