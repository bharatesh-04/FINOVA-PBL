"""Subscription model for tracking recurring subscriptions"""
from sqlalchemy import Column, String, Float, Integer, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class SubscriptionFrequency(str, enum.Enum):
    """Subscription frequency options"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class SubscriptionStatus(str, enum.Enum):
    """Subscription status"""
    ACTIVE = "active"
    CANCELLED = "cancelled"
    PAUSED = "paused"
    EXPIRED = "expired"

class Subscription(Base):
    """Model for tracking subscriptions"""
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Subscription details
    name = Column(String(255), nullable=False)
    description = Column(String(500))
    category = Column(String(100), default="Services")
    cost = Column(Float, nullable=False)
    currency = Column(String(3), default="INR")
    
    # Frequency
    frequency = Column(Enum(SubscriptionFrequency), default=SubscriptionFrequency.MONTHLY)
    
    # Dates
    start_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    renewal_date = Column(DateTime, nullable=False)
    cancellation_date = Column(DateTime, nullable=True)
    next_billing_date = Column(DateTime, nullable=False)
    
    # Status
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    
    # Tracking
    is_used = Column(Boolean, default=True)
    notes = Column(String(500))
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="subscriptions")
    
    class Config:
        from_attributes = True
