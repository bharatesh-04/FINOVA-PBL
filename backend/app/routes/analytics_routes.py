"""Analytics and insights routes"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import AnalyticsService
from app.models import User
from app.utils import get_current_user
from datetime import datetime
from typing import List, Dict

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/dashboard/summary")
def get_dashboard_summary(
    month: str = Query(None, description="YYYY-MM format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard summary for a month"""
    return AnalyticsService.get_dashboard_summary(db, current_user.id, month)

@router.get("/category/{category_id}/trends")
def get_category_trends(
    category_id: int,
    months: int = Query(12, ge=1, le=60),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get category spending trends"""
    return AnalyticsService.get_category_trends(db, current_user.id, category_id, months)

@router.get("/anomalies")
def get_anomalies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detected spending anomalies"""
    return AnalyticsService.get_anomalies(db, current_user.id)

@router.get("/insights")
def get_insights(
    month: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[str]:
    """Get AI-generated financial insights"""
    return AnalyticsService.get_insights(db, current_user.id, month)

@router.get("/budget/status")
def get_budget_status(
    month: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get budget vs actual spending for a month"""
    return AnalyticsService.get_budget_status(db, current_user.id, month)

@router.get("/forecast")
def forecast_expenses(
    days_ahead: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Forecast expenses for coming period"""
    return AnalyticsService.forecast_expenses(db, current_user.id, days_ahead)

@router.get("/net-worth")
def get_net_worth(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculate total net worth from all accounts"""
    from app.models import Account
    
    accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
    total_balance = sum(a.balance for a in accounts)
    
    return {
        "net_worth": total_balance,
        "accounts_count": len(accounts),
        "accounts": [
            {
                "id": a.id,
                "name": a.name,
                "type": a.account_type,
                "balance": a.balance
            }
            for a in accounts
        ]
    }
