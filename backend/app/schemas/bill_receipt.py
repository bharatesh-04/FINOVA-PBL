"""Bill receipt schemas"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class BillReceiptUpdate(BaseModel):
    merchant_name: Optional[str] = None
    amount: Optional[float] = None
    transaction_date: Optional[datetime] = None
    is_verified: Optional[bool] = None


class BillReceiptResponse(BaseModel):
    id: int
    user_id: int
    file_path: str
    file_name: str
    file_type: str
    merchant_name: Optional[str]
    amount: Optional[float]
    transaction_date: Optional[datetime]
    raw_text: Optional[str]
    ocr_confidence: float
    processing_status: str
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
