"""Transaction service"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models import Transaction, Account, Category
from app.schemas import TransactionCreate, TransactionUpdate, TransactionFilter
from app.ml import category_classifier, anomaly_detector
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from typing import List, Dict

class TransactionService:
    """Transaction management service"""
    
    @staticmethod
    def create_transaction(
        db: Session,
        user_id: int,
        trans_create: TransactionCreate
    ) -> Transaction:
        """Create new transaction"""
        # Validate account and category belong to user
        account = db.query(Account).filter(
            and_(Account.id == trans_create.account_id, Account.user_id == user_id)
        ).first()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        category = db.query(Category).filter(
            and_(Category.id == trans_create.category_id, Category.user_id == user_id)
        ).first()
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        # Create transaction
        transaction = Transaction(
            user_id=user_id,
            account_id=trans_create.account_id,
            category_id=trans_create.category_id,
            amount=trans_create.amount,
            transaction_type=trans_create.transaction_type,
            merchant=trans_create.merchant,
            description=trans_create.description,
            notes=trans_create.notes,
            date=trans_create.date or datetime.utcnow()
        )
        
        # Get AI category prediction
        text = f"{trans_create.description} {trans_create.merchant or ''}".strip()
        predicted_category, confidence = category_classifier.predict(text)
        transaction.ai_category_confidence = confidence
        
        # Detect anomalies
        # Get similar transactions from last 90 days
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        similar = db.query(Transaction).filter(
            and_(
                Transaction.user_id == user_id,
                Transaction.category_id == trans_create.category_id,
                Transaction.date >= ninety_days_ago
            )
        ).all()
        
        similar_amounts = [t.amount for t in similar]
        if similar_amounts:
            is_anomaly, anomaly_score = anomaly_detector.detect(
                transaction.amount,
                similar_amounts
            )
            transaction.is_anomaly = is_anomaly
            transaction.anomaly_score = anomaly_score
        
        # Update account balance
        if transaction.transaction_type == "expense":
            account.balance -= transaction.amount
        else:
            account.balance += transaction.amount
        
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        return transaction
    
    @staticmethod
    def get_transaction(db: Session, transaction_id: int, user_id: int) -> Transaction:
        """Get transaction by ID"""
        transaction = db.query(Transaction).filter(
            and_(Transaction.id == transaction_id, Transaction.user_id == user_id)
        ).first()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        return transaction
    
    @staticmethod
    def update_transaction(
        db: Session,
        transaction_id: int,
        user_id: int,
        update_data: TransactionUpdate
    ) -> Transaction:
        """Update transaction"""
        transaction = TransactionService.get_transaction(db, transaction_id, user_id)
        
        # Update fields if provided
        if update_data.amount is not None:
            # Adjust account balance
            old_amount = transaction.amount
            account = transaction.account
            
            if transaction.transaction_type == "expense":
                account.balance += old_amount
                account.balance -= update_data.amount
            else:
                account.balance -= old_amount
                account.balance += update_data.amount
            
            transaction.amount = update_data.amount
        
        if update_data.category_id is not None:
            transaction.category_id = update_data.category_id
        
        if update_data.description is not None:
            transaction.description = update_data.description
        
        if update_data.merchant is not None:
            transaction.merchant = update_data.merchant
        
        if update_data.notes is not None:
            transaction.notes = update_data.notes
        
        if update_data.date is not None:
            transaction.date = update_data.date
        
        db.commit()
        db.refresh(transaction)
        
        return transaction
    
    @staticmethod
    def delete_transaction(db: Session, transaction_id: int, user_id: int) -> bool:
        """Delete transaction"""
        transaction = TransactionService.get_transaction(db, transaction_id, user_id)
        
        # Reverse account balance
        account = transaction.account
        if transaction.transaction_type == "expense":
            account.balance += transaction.amount
        else:
            account.balance -= transaction.amount
        
        db.delete(transaction)
        db.commit()
        
        return True
    
    @staticmethod
    def filter_transactions(
        db: Session,
        user_id: int,
        filters: TransactionFilter
    ) -> List[Transaction]:
        """Filter transactions based on criteria"""
        query = db.query(Transaction).filter(Transaction.user_id == user_id)
        
        if filters.start_date:
            query = query.filter(Transaction.date >= filters.start_date)
        
        if filters.end_date:
            query = query.filter(Transaction.date <= filters.end_date)
        
        if filters.category_id:
            query = query.filter(Transaction.category_id == filters.category_id)
        
        if filters.account_id:
            query = query.filter(Transaction.account_id == filters.account_id)
        
        if filters.transaction_type:
            query = query.filter(Transaction.transaction_type == filters.transaction_type)
        
        if filters.merchant:
            query = query.filter(Transaction.merchant.ilike(f"%{filters.merchant}%"))
        
        query = query.order_by(Transaction.date.desc())
        
        return query.offset(filters.skip).limit(filters.limit).all()
