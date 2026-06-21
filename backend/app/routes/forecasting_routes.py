"""Forecasting and analytics routes"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.services.forecasting_service import ForecastingService

router = APIRouter(prefix="/api/forecasting", tags=["forecasting"])

@router.get("/monthly-forecast")
async def get_monthly_forecast(
    months: int = 3,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get monthly expense forecast"""
    return ForecastingService.get_monthly_forecast(db, current_user.id, months)

@router.get("/category-trends")
async def get_category_trends(
    months: int = 6,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get spending trends by category"""
    return ForecastingService.get_category_trends(db, current_user.id, months)

@router.get("/anomalies")
async def get_spending_anomalies(
    threshold: float = 1.5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Detect unusual spending patterns"""
    return ForecastingService.get_spending_anomalies(db, current_user.id, threshold)

@router.get("/savings-projection")
async def get_savings_projection(
    months: int = 12,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get savings projection for future months"""
    return ForecastingService.get_savings_projection(db, current_user.id, months)
