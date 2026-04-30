"""Recurring transaction routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.schemas import RecurringCreate, RecurringResponse, RecurringUpdate
from app.models import User, RecurringTransaction, Account, Category
from app.utils import get_current_user
from typing import List

router = APIRouter(prefix="/api/recurring", tags=["Recurring Transactions"])

@router.post("", response_model=RecurringResponse)
def create_recurring_transaction(
    recurring: RecurringCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new recurring transaction"""
    # Validate account and category
    account = db.query(Account).filter(
        and_(Account.id == recurring.account_id, Account.user_id == current_user.id)
    ).first()
    
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    
    category = db.query(Category).filter(
        and_(Category.id == recurring.category_id, Category.user_id == current_user.id)
    ).first()
    
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    new_recurring = RecurringTransaction(
        user_id=current_user.id,
        **recurring.dict()
    )
    db.add(new_recurring)
    db.commit()
    db.refresh(new_recurring)
    return new_recurring

@router.get("", response_model=List[RecurringResponse])
def get_recurring_transactions(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all recurring transactions"""
    query = db.query(RecurringTransaction).filter(RecurringTransaction.user_id == current_user.id)
    
    if active_only:
        query = query.filter(RecurringTransaction.is_active == True)
    
    return query.all()

@router.get("/{recurring_id}", response_model=RecurringResponse)
def get_recurring_transaction(
    recurring_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific recurring transaction"""
    recurring = db.query(RecurringTransaction).filter(
        and_(RecurringTransaction.id == recurring_id, RecurringTransaction.user_id == current_user.id)
    ).first()
    
    if not recurring:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring transaction not found")
    
    return recurring

@router.put("/{recurring_id}", response_model=RecurringResponse)
def update_recurring_transaction(
    recurring_id: int,
    recurring_update: RecurringUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update recurring transaction"""
    recurring = db.query(RecurringTransaction).filter(
        and_(RecurringTransaction.id == recurring_id, RecurringTransaction.user_id == current_user.id)
    ).first()
    
    if not recurring:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring transaction not found")
    
    update_data = recurring_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(recurring, key, value)
    
    db.commit()
    db.refresh(recurring)
    return recurring

@router.delete("/{recurring_id}")
def delete_recurring_transaction(
    recurring_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete recurring transaction"""
    recurring = db.query(RecurringTransaction).filter(
        and_(RecurringTransaction.id == recurring_id, RecurringTransaction.user_id == current_user.id)
    ).first()
    
    if not recurring:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring transaction not found")
    
    db.delete(recurring)
    db.commit()
    return {"message": "Recurring transaction deleted successfully"}
