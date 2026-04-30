"""Category schemas"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    icon: Optional[str] = None
    color: str = "#000000"
    category_type: str = "expense"  # expense or income

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: int
    user_id: int
    is_default: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
