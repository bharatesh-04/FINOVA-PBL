"""Subscription schemas for API validation"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum

class SubscriptionFrequency(str, Enum):
    """Subscription frequency"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class SubscriptionStatus(str, Enum):
    """Subscription status"""
    ACTIVE = "active"
    CANCELLED = "cancelled"
    PAUSED = "paused"
    EXPIRED = "expired"

class SubscriptionCreate(BaseModel):
    """Create subscription request"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(default="Services", max_length=100)
    cost: float = Field(..., gt=0)
    currency: str = Field(default="INR", max_length=3)
    frequency: SubscriptionFrequency = Field(default=SubscriptionFrequency.MONTHLY)
    start_date: datetime
    renewal_date: datetime
    next_billing_date: datetime
    is_used: bool = Field(default=True)
    notes: Optional[str] = None

class SubscriptionUpdate(BaseModel):
    """Update subscription request"""
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    cost: Optional[float] = None
    currency: Optional[str] = None
    frequency: Optional[SubscriptionFrequency] = None
    renewal_date: Optional[datetime] = None
    next_billing_date: Optional[datetime] = None
    status: Optional[SubscriptionStatus] = None
    is_used: Optional[bool] = None
    notes: Optional[str] = None

class SubscriptionResponse(BaseModel):
    """Subscription response model"""
    id: int
    name: str
    description: Optional[str]
    category: str
    cost: float
    currency: str
    frequency: str
    start_date: datetime
    renewal_date: datetime
    next_billing_date: datetime
    cancellation_date: Optional[datetime]
    status: str
    is_used: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SubscriptionStats(BaseModel):
    """Subscription statistics"""
    total_subscriptions: int
    active_subscriptions: int
    cancelled_subscriptions: int
    monthly_spending: float
    yearly_spending: float
    unused_subscriptions: int
    top_categories: list[dict]
