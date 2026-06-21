"""Budget routes"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.database import get_db
from app.schemas import BudgetCreate, BudgetResponse, BudgetUpdate
from app.models import User, Budget, Category, Transaction
from app.utils import get_current_user

router = APIRouter(prefix="/api/budgets", tags=["Budgets"])


class SmartBudgetApplyRequest(BaseModel):
    month: Optional[str] = None
    lookback_months: int = Field(3, ge=1, le=12)
    savings_target_percent: float = Field(20, ge=0, le=90)
    buffer_percent: float = Field(10, ge=0, le=50)
    alert_threshold: float = Field(0.8, ge=0.5, le=1)
    overwrite: bool = True
    category_ids: Optional[List[int]] = None


def _current_month() -> str:
    return datetime.utcnow().strftime("%Y-%m")


def _month_start(month: str) -> datetime:
    try:
        year, month_num = map(int, month.split("-"))
        return datetime(year, month_num, 1)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="month must use YYYY-MM format",
        ) from exc


def _shift_month(date_value: datetime, offset: int) -> datetime:
    month_index = (date_value.month - 1) + offset
    year = date_value.year + month_index // 12
    month = month_index % 12 + 1
    return datetime(year, month, 1)


def _round_money(value: float) -> float:
    return round(float(value or 0), 2)


def _build_smart_budget_plan(
    db: Session,
    user_id: int,
    month: Optional[str],
    lookback_months: int,
    savings_target_percent: float,
    buffer_percent: float,
) -> Dict:
    target_month = month or _current_month()
    target_start = _month_start(target_month)
    history_start = _shift_month(target_start, -lookback_months)
    history_end = target_start

    expense_transactions = db.query(Transaction).filter(
        and_(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "expense",
            Transaction.date >= history_start,
            Transaction.date < history_end,
        )
    ).all()

    source_note = f"previous {lookback_months} full month(s)"
    if not expense_transactions:
        history_start = datetime.utcnow() - timedelta(days=90)
        history_end = datetime.utcnow()
        source_note = "latest 90 days because prior full-month history is limited"
        expense_transactions = db.query(Transaction).filter(
            and_(
                Transaction.user_id == user_id,
                Transaction.transaction_type == "expense",
                Transaction.date >= history_start,
                Transaction.date <= history_end,
            )
        ).all()

    income_total = db.query(func.sum(Transaction.amount)).filter(
        and_(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "income",
            Transaction.date >= history_start,
            Transaction.date <= history_end,
        )
    ).scalar() or 0

    active_expense_categories = db.query(Category).filter(
        and_(Category.user_id == user_id, Category.category_type == "expense")
    ).all()
    categories_by_id = {category.id: category for category in active_expense_categories}

    months_observed = {
        transaction.date.strftime("%Y-%m")
        for transaction in expense_transactions
        if transaction.date
    }
    divisor = max(len(months_observed), 1)

    category_totals: Dict[int, float] = {}
    for transaction in expense_transactions:
        category_totals[transaction.category_id] = (
            category_totals.get(transaction.category_id, 0) + transaction.amount
        )

    raw_recommendations = []
    for category_id, total in category_totals.items():
        category = categories_by_id.get(category_id)
        if not category:
            continue

        average_monthly = float(total) / divisor
        recommended_limit = average_monthly * (1 + buffer_percent / 100)
        raw_recommendations.append({
            "category_id": category.id,
            "category_name": category.name,
            "category_color": category.color,
            "average_monthly": average_monthly,
            "recommended_limit": recommended_limit,
            "historical_total": float(total),
        })

    total_recommended = sum(item["recommended_limit"] for item in raw_recommendations)
    monthly_income = float(income_total) / max(divisor, 1)
    spending_cap = monthly_income * (1 - savings_target_percent / 100) if monthly_income > 0 else None
    scale = min(1, spending_cap / total_recommended) if spending_cap and total_recommended > spending_cap else 1

    existing_budgets = db.query(Budget).filter(
        and_(Budget.user_id == user_id, Budget.month == target_month)
    ).all()
    existing_by_category = {budget.category_id: budget for budget in existing_budgets}

    recommendations = []
    for item in sorted(raw_recommendations, key=lambda value: value["recommended_limit"], reverse=True):
        existing = existing_by_category.get(item["category_id"])
        recommended_limit = item["recommended_limit"] * scale
        recommendations.append({
            "category_id": item["category_id"],
            "category_name": item["category_name"],
            "category_color": item["category_color"],
            "average_monthly": _round_money(item["average_monthly"]),
            "recommended_limit": _round_money(recommended_limit),
            "historical_total": _round_money(item["historical_total"]),
            "existing_limit": _round_money(existing.limit_amount) if existing else None,
            "has_existing_budget": existing is not None,
            "reason": (
                f"Based on {source_note}; includes a {buffer_percent:.0f}% buffer"
                + (" and income-based savings cap." if scale < 1 else ".")
            ),
        })

    return {
        "month": target_month,
        "lookback_months": lookback_months,
        "history_start": history_start.date().isoformat(),
        "history_end": history_end.date().isoformat(),
        "source_note": source_note,
        "savings_target_percent": savings_target_percent,
        "buffer_percent": buffer_percent,
        "monthly_income": _round_money(monthly_income),
        "spending_cap": _round_money(spending_cap) if spending_cap is not None else None,
        "total_recommended": _round_money(sum(item["recommended_limit"] for item in recommendations)),
        "confidence": round(min(0.95, 0.25 + min(len(expense_transactions) / 40, 1) * 0.45 + min(divisor / 3, 1) * 0.25), 2),
        "recommendations": recommendations,
        "message": (
            "Add expense transactions for stronger recommendations."
            if not recommendations else
            "Smart budget generated from your spending patterns."
        ),
    }

@router.post("", response_model=BudgetResponse)
def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new budget"""
    new_budget = Budget(user_id=current_user.id, **budget.dict())
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    return new_budget

@router.get("", response_model=List[BudgetResponse])
def get_budgets(
    month: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get budgets for a month"""
    query = db.query(Budget).filter(Budget.user_id == current_user.id)
    
    if month:
        query = query.filter(Budget.month == month)
    
    return query.all()

@router.get("/smart/recommendations")
def get_smart_budget_recommendations(
    month: str = Query(None, description="YYYY-MM format"),
    lookback_months: int = Query(3, ge=1, le=12),
    savings_target_percent: float = Query(20, ge=0, le=90),
    buffer_percent: float = Query(10, ge=0, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate smart monthly budget recommendations from recent spending."""
    return _build_smart_budget_plan(
        db,
        current_user.id,
        month,
        lookback_months,
        savings_target_percent,
        buffer_percent,
    )

@router.post("/smart/apply")
def apply_smart_budget(
    request: SmartBudgetApplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create or update budgets from smart recommendations."""
    plan = _build_smart_budget_plan(
        db,
        current_user.id,
        request.month,
        request.lookback_months,
        request.savings_target_percent,
        request.buffer_percent,
    )

    selected_ids = set(request.category_ids or [])
    applied = []
    skipped = []

    for recommendation in plan["recommendations"]:
        category_id = recommendation["category_id"]
        if selected_ids and category_id not in selected_ids:
            continue

        existing = db.query(Budget).filter(
            and_(
                Budget.user_id == current_user.id,
                Budget.category_id == category_id,
                Budget.month == plan["month"],
            )
        ).first()

        if existing and not request.overwrite:
            skipped.append({
                "category_id": category_id,
                "category_name": recommendation["category_name"],
                "reason": "existing budget kept",
            })
            continue

        if existing:
            existing.limit_amount = recommendation["recommended_limit"]
            existing.alert_threshold = request.alert_threshold
            existing.is_active = 1
            budget = existing
            action = "updated"
        else:
            budget = Budget(
                user_id=current_user.id,
                category_id=category_id,
                limit_amount=recommendation["recommended_limit"],
                month=plan["month"],
                alert_threshold=request.alert_threshold,
                is_active=1,
            )
            db.add(budget)
            action = "created"

        applied.append({
            "category_id": category_id,
            "category_name": recommendation["category_name"],
            "limit_amount": recommendation["recommended_limit"],
            "action": action,
        })

    db.commit()

    return {
        "month": plan["month"],
        "applied_count": len(applied),
        "skipped_count": len(skipped),
        "applied": applied,
        "skipped": skipped,
    }

@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific budget"""
    budget = db.query(Budget).filter(
        and_(Budget.id == budget_id, Budget.user_id == current_user.id)
    ).first()
    
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    
    return budget

@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    budget_update: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update budget"""
    budget = db.query(Budget).filter(
        and_(Budget.id == budget_id, Budget.user_id == current_user.id)
    ).first()
    
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    
    update_data = budget_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(budget, key, value)
    
    db.commit()
    db.refresh(budget)
    return budget

@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete budget"""
    budget = db.query(Budget).filter(
        and_(Budget.id == budget_id, Budget.user_id == current_user.id)
    ).first()
    
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    
    db.delete(budget)
    db.commit()
    return {"message": "Budget deleted successfully"}
