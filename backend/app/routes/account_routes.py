"""Account routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.schemas import AccountCreate, AccountResponse, AccountUpdate
from app.models import User, Account
from app.utils import get_current_user
from typing import List

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])

@router.post("", response_model=AccountResponse)
def create_account(
    account: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new account"""
    new_account = Account(
        user_id=current_user.id,
        **account.dict()
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account

@router.get("", response_model=List[AccountResponse])
def get_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all accounts for current user"""
    accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
    return accounts

@router.get("/{account_id}", response_model=AccountResponse)
def get_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific account"""
    account = db.query(Account).filter(
        and_(Account.id == account_id, Account.user_id == current_user.id)
    ).first()
    
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    
    return account

@router.put("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: int,
    account_update: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update account"""
    account = db.query(Account).filter(
        and_(Account.id == account_id, Account.user_id == current_user.id)
    ).first()
    
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    
    update_data = account_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(account, key, value)
    
    db.commit()
    db.refresh(account)
    return account

@router.delete("/{account_id}")
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete account"""
    account = db.query(Account).filter(
        and_(Account.id == account_id, Account.user_id == current_user.id)
    ).first()
    
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    
    db.delete(account)
    db.commit()
    return {"message": "Account deleted successfully"}
