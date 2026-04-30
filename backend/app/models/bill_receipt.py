"""Bill Receipt model for OCR processing"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class BillReceipt(Base):
    """Bill/Receipt model for OCR-processed documents"""
    __tablename__ = "bill_receipts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)  # pdf, jpg, png
    
    # Extracted data via OCR
    merchant_name = Column(String(255), nullable=True)
    amount = Column(Float, nullable=True)
    transaction_date = Column(DateTime, nullable=True)
    raw_text = Column(Text, nullable=True)  # Raw OCR output
    
    ocr_confidence = Column(Float, default=0.0)  # 0-1, confidence of OCR extraction
    processing_status = Column(String(20), default="pending")  # pending, processing, completed, failed
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="bill_receipts")
    
    __table_args__ = (
        Index('ix_bill_receipts_user_id', 'user_id'),
        Index('ix_bill_receipts_status', 'processing_status'),
    )
