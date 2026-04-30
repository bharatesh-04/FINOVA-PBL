"""Recurring Transaction model"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class RecurringTransaction(Base):
    """Recurring transactions - salary, rent, subscriptions, etc."""
    __tablename__ = "recurring_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    name = Column(String(255), nullable=False)  # e.g., "Monthly Rent"
    amount = Column(Float, nullable=False)
    frequency = Column(String(20), nullable=False)  # daily, weekly, monthly, yearly
    transaction_type = Column(String(20), nullable=False)  # income or expense
    due_day = Column(Integer, nullable=True)  # day of month for monthly recurrence
    next_due_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    last_executed = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="recurring_transactions")
    transactions = relationship("Transaction", back_populates="recurring")
    
    __table_args__ = (
        Index('ix_recurring_user_id', 'user_id'),
        Index('ix_recurring_next_due', 'next_due_date'),
    )
