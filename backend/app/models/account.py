"""Account model for multi-account support"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Account(Base):
    """Account model - users can have multiple accounts (bank, cash, UPI, etc)"""
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)  # e.g., "SBI Bank", "My Wallet"
    account_type = Column(String(50), nullable=False)  # bank, cash, credit_card, upi, etc.
    balance = Column(Float, default=0.0)
    currency = Column(String(3), default="INR")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('ix_accounts_user_id', 'user_id'),
    )
