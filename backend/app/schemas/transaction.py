"""Transaction schemas"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class TransactionBase(BaseModel):
    account_id: int
    category_id: int
    amount: float = Field(..., gt=0)
    transaction_type: str  # income or expense
    merchant: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    date: Optional[datetime] = None

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    merchant: Optional[str] = None
    notes: Optional[str] = None
    date: Optional[datetime] = None

class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    date: datetime
    ai_category_confidence: float
    is_anomaly: bool
    anomaly_score: Optional[float]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TransactionFilter(BaseModel):
    """Query parameters for filtering transactions"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    category_id: Optional[int] = None
    account_id: Optional[int] = None
    transaction_type: Optional[str] = None
    merchant: Optional[str] = None
    skip: int = 0
    limit: int = 100
