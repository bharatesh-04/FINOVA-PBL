"""Budget schemas"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class BudgetBase(BaseModel):
    category_id: int
    limit_amount: float = Field(..., gt=0)
    month: str  # YYYY-MM format
    alert_threshold: float = 0.8

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    limit_amount: Optional[float] = None
    alert_threshold: Optional[float] = None
    is_active: Optional[int] = None

class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    spent_amount: float
    is_active: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
