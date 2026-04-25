"""
Pydantic schemas for Analytics dashboard responses.
"""

from pydantic import BaseModel


class EngagementTrend(BaseModel):
    period: str          # e.g. "2026-01", "Week 12"
    active_volunteers: int
    tasks_created: int
    tasks_completed: int


class CompletionRate(BaseModel):
    status: str
    count: int
    percentage: float


class DemandForecast(BaseModel):
    period: str
    predicted_tasks: float
    predicted_volunteers_needed: float


class DashboardData(BaseModel):
    total_volunteers: int
    total_organizers: int
    total_tasks: int
    active_tasks: int
    completion_rate: float
    avg_reliability: float
    engagement_trends: list[EngagementTrend]
    completion_breakdown: list[CompletionRate]
    top_skills: list[dict]
    demand_forecast: list[DemandForecast]
