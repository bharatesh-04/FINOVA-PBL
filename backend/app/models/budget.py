"""Budget model"""
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Budget(Base):
    """Budget model for budget planning per category"""
    __tablename__ = "budgets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    limit_amount = Column(Float, nullable=False)
    spent_amount = Column(Float, default=0.0)
    month = Column(String(7), nullable=False)  # YYYY-MM format
    alert_threshold = Column(Float, default=0.8)  # 80% of budget
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")
    
    __table_args__ = (
        Index('ix_budgets_user_id', 'user_id'),
        Index('ix_budgets_month', 'month'),
    )
