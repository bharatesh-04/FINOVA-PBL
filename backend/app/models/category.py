"""Category model"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Category(Base):
    """Category model for transaction categorization"""
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)  # Food, Travel, Entertainment, etc.
    icon = Column(String(50), nullable=True)  # emoji or icon name
    color = Column(String(7), default="#000000")  # hex color
    is_default = Column(Boolean, default=False)
    category_type = Column(String(20), default="expense")  # expense or income
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="category", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('ix_categories_user_id', 'user_id'),
        Index('ix_categories_name', 'name'),
    )
