"""Budget routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.schemas import BudgetCreate, BudgetResponse, BudgetUpdate
from app.models import User, Budget
from app.utils import get_current_user
from typing import List

router = APIRouter(prefix="/api/budgets", tags=["Budgets"])

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
