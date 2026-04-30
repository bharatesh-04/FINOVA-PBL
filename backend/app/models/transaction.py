"""Transaction model"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Transaction(Base):
    """Transaction model for income and expense tracking"""
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String(20), nullable=False)  # income or expense
    description = Column(String(255), nullable=True)
    merchant = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    recurring_id = Column(Integer, ForeignKey("recurring_transactions.id"), nullable=True)
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, nullable=True)
    ai_category_confidence = Column(Float, default=1.0)  # 0-1, for ML categorization
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    recurring = relationship("RecurringTransaction", back_populates="transactions")
    
    __table_args__ = (
        Index('ix_transactions_user_id', 'user_id'),
        Index('ix_transactions_date', 'date'),
        Index('ix_transactions_category_id', 'category_id'),
        Index('ix_transactions_account_id', 'account_id'),
    )
