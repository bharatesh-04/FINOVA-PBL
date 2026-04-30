"""Bill and receipt service"""
from sqlalchemy.orm import Session
from app.models import BillReceipt, Transaction
from app.schemas import BillReceiptUpdate
from app.utils import ocr_processor, FileHandler
from fastapi import HTTPException, status
from typing import Dict
import os

class BillService:
    """Bill and receipt processing service"""
    
    @staticmethod
    def process_receipt(
        db: Session,
        user_id: int,
        file_path: str,
        file_name: str,
        file_type: str
    ) -> BillReceipt:
        """Process uploaded receipt using OCR"""
        
        # Create bill receipt record
        receipt = BillReceipt(
            user_id=user_id,
            file_path=file_path,
            file_name=file_name,
            file_type=file_type,
            processing_status="processing"
        )
        
        try:
            # Extract information using OCR
            info = ocr_processor.extract_info(file_path)
            
            receipt.raw_text = info['raw_text']
            receipt.amount = info['amount']
            receipt.transaction_date = info['date']
            receipt.merchant_name = info['merchant']
            receipt.ocr_confidence = info['confidence']
            receipt.processing_status = "completed"
            
        except Exception as e:
            print(f"OCR processing error: {e}")
            receipt.processing_status = "failed"
        
        db.add(receipt)
        db.commit()
        db.refresh(receipt)
        
        return receipt
    
    @staticmethod
    def get_receipt(
        db: Session,
        receipt_id: int,
        user_id: int
    ) -> BillReceipt:
        """Get receipt by ID"""
        receipt = db.query(BillReceipt).filter(
            BillReceipt.id == receipt_id,
            BillReceipt.user_id == user_id
        ).first()
        
        if not receipt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Receipt not found"
            )
        
        return receipt
    
    @staticmethod
    def update_receipt(
        db: Session,
        receipt_id: int,
        user_id: int,
        update_data: BillReceiptUpdate
    ) -> BillReceipt:
        """Update receipt details"""
        receipt = BillService.get_receipt(db, receipt_id, user_id)
        
        if hasattr(update_data, 'merchant_name') and update_data.merchant_name:
            receipt.merchant_name = update_data.merchant_name
        
        if hasattr(update_data, 'amount') and update_data.amount:
            receipt.amount = update_data.amount
        
        if hasattr(update_data, 'transaction_date') and update_data.transaction_date:
            receipt.transaction_date = update_data.transaction_date
        
        if hasattr(update_data, 'is_verified'):
            receipt.is_verified = update_data.is_verified
        
        db.commit()
        db.refresh(receipt)
        
        return receipt
    
    @staticmethod
    def delete_receipt(
        db: Session,
        receipt_id: int,
        user_id: int
    ) -> bool:
        """Delete receipt and associated file"""
        receipt = BillService.get_receipt(db, receipt_id, user_id)
        
        # Delete file
        FileHandler.delete_file(receipt.file_path)
        
        # Delete record
        db.delete(receipt)
        db.commit()
        
        return True
