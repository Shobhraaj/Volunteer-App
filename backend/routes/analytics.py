"""
Analytics routes — serves the dashboard data.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.analytics import DashboardData
from services.auth_service import get_current_user
from services.analytics_service import get_dashboard_data

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardData)
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_dashboard_data(db)
