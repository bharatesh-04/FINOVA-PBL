"""Account schemas"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    account_type: str  # bank, cash, credit_card, upi
    currency: str = "INR"

class AccountCreate(AccountBase):
    balance: float = 0.0

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    balance: Optional[float] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None

class AccountResponse(AccountBase):
    id: int
    user_id: int
    balance: float
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
