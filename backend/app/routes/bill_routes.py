"""Bill and receipt routes"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import BillReceiptResponse, BillReceiptUpdate
from app.services import BillService
from app.models import User
from app.utils import get_current_user, FileHandler
from typing import List

router = APIRouter(prefix="/api/bills", tags=["Bills & Receipts"])

@router.post("/upload", response_model=BillReceiptResponse)
async def upload_receipt(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload and process a bill/receipt"""
    # Save file
    file_path, file_name = await FileHandler.save_upload(file, current_user.id, "receipts")
    
    # Get file type
    file_type = file_name.rsplit('.', 1)[1].lower()
    
    # Process receipt with OCR
    receipt = BillService.process_receipt(db, current_user.id, file_path, file_name, file_type)
    
    return receipt

@router.get("", response_model=List[BillReceiptResponse])
def get_receipts(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all receipts for user"""
    from app.models import BillReceipt
    
    query = db.query(BillReceipt).filter(BillReceipt.user_id == current_user.id)
    
    if status:
        query = query.filter(BillReceipt.processing_status == status)
    
    return query.all()

@router.get("/{receipt_id}", response_model=BillReceiptResponse)
def get_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific receipt"""
    return BillService.get_receipt(db, receipt_id, current_user.id)

@router.put("/{receipt_id}", response_model=BillReceiptResponse)
def update_receipt(
    receipt_id: int,
    receipt_update: BillReceiptUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update receipt extracted data"""
    return BillService.update_receipt(db, receipt_id, current_user.id, receipt_update)

@router.delete("/{receipt_id}")
def delete_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete receipt"""
    BillService.delete_receipt(db, receipt_id, current_user.id)
    return {"message": "Receipt deleted successfully"}
