"""
Pydantic schemas for Participation records.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ParticipationCreate(BaseModel):
    task_id: int


class ParticipationOut(BaseModel):
    id: int
    volunteer_id: int
    task_id: int
    status: str
    match_score: float | None = None
    status_history: str | None = None
    applied_at: datetime | None = None
    completed_at: datetime | None = None
    task_title: str | None = None

    class Config:

        from_attributes = True

class StatusUpdateRequest(BaseModel):
    status: str  # assigned | accepted | active | completed | cancelled



class AssignRequest(BaseModel):
    volunteer_ids: list[int]


class AutoAssignResponse(BaseModel):
    assigned_count: int
    assignments: list[ParticipationOut]
