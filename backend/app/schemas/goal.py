"""Goal schemas"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class GoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    target_amount: float = Field(..., gt=0)
    category: Optional[str] = None
    description: Optional[str] = None
    priority: str = "medium"  # low, medium, high
    deadline: Optional[datetime] = None

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None

class GoalResponse(GoalBase):
    id: int
    user_id: int
    current_amount: float
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
