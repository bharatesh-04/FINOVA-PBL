"""Recurring transaction schemas"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class RecurringBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., gt=0)
    frequency: str  # daily, weekly, monthly, yearly
    transaction_type: str  # income or expense
    account_id: int
    category_id: int
    due_day: Optional[int] = None
    start_date: datetime
    end_date: Optional[datetime] = None

class RecurringCreate(RecurringBase):
    pass

class RecurringResponse(RecurringBase):
    id: int
    user_id: int
    is_active: bool
    next_due_date: datetime
    last_executed: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
