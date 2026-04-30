"""Transaction routes"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import TransactionCreate, TransactionResponse, TransactionUpdate, TransactionFilter
from app.services import TransactionService
from app.models import User
from app.utils import get_current_user
from typing import List
from datetime import datetime

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.post("", response_model=TransactionResponse)
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new transaction"""
    return TransactionService.create_transaction(db, current_user.id, transaction)

@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: datetime = Query(None),
    end_date: datetime = Query(None),
    category_id: int = Query(None),
    account_id: int = Query(None),
    transaction_type: str = Query(None),
    merchant: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get transactions with filtering"""
    filters = TransactionFilter(
        skip=skip,
        limit=limit,
        start_date=start_date,
        end_date=end_date,
        category_id=category_id,
        account_id=account_id,
        transaction_type=transaction_type,
        merchant=merchant
    )
    
    return TransactionService.filter_transactions(db, current_user.id, filters)

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific transaction"""
    return TransactionService.get_transaction(db, transaction_id, current_user.id)

@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update transaction"""
    return TransactionService.update_transaction(db, transaction_id, current_user.id, transaction_update)

@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete transaction"""
    TransactionService.delete_transaction(db, transaction_id, current_user.id)
    return {"message": "Transaction deleted successfully"}
