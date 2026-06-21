"""Subscription service for managing subscriptions"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.subscription import Subscription, SubscriptionStatus, SubscriptionFrequency
from app.schemas.subscription import SubscriptionCreate, SubscriptionUpdate

class SubscriptionService:
    """Service for subscription operations"""
    
    @staticmethod
    def create_subscription(db: Session, user_id: int, subscription: SubscriptionCreate) -> Subscription:
        """Create a new subscription"""
        db_subscription = Subscription(
            user_id=user_id,
            name=subscription.name,
            description=subscription.description,
            category=subscription.category,
            cost=subscription.cost,
            currency=subscription.currency,
            frequency=subscription.frequency,
            start_date=subscription.start_date,
            renewal_date=subscription.renewal_date,
            next_billing_date=subscription.next_billing_date,
            is_used=subscription.is_used,
            notes=subscription.notes
        )
        db.add(db_subscription)
        db.commit()
        db.refresh(db_subscription)
        return db_subscription
    
    @staticmethod
    def get_user_subscriptions(db: Session, user_id: int, status: str = None) -> list[Subscription]:
        """Get all subscriptions for a user"""
        query = db.query(Subscription).filter(Subscription.user_id == user_id)
        if status:
            query = query.filter(Subscription.status == status)
        return query.all()
    
    @staticmethod
    def get_subscription(db: Session, user_id: int, subscription_id: int) -> Subscription:
        """Get a specific subscription"""
        return db.query(Subscription).filter(
            Subscription.id == subscription_id,
            Subscription.user_id == user_id
        ).first()
    
    @staticmethod
    def update_subscription(
        db: Session, 
        user_id: int, 
        subscription_id: int, 
        update_data: SubscriptionUpdate
    ) -> Subscription:
        """Update a subscription"""
        subscription = SubscriptionService.get_subscription(db, user_id, subscription_id)
        if not subscription:
            return None
        
        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(subscription, key, value)
        
        db.commit()
        db.refresh(subscription)
        return subscription
    
    @staticmethod
    def cancel_subscription(db: Session, user_id: int, subscription_id: int) -> Subscription:
        """Cancel a subscription"""
        subscription = SubscriptionService.get_subscription(db, user_id, subscription_id)
        if not subscription:
            return None
        
        subscription.status = SubscriptionStatus.CANCELLED
        subscription.cancellation_date = datetime.utcnow()
        db.commit()
        db.refresh(subscription)
        return subscription
    
    @staticmethod
    def delete_subscription(db: Session, user_id: int, subscription_id: int) -> bool:
        """Delete a subscription"""
        subscription = SubscriptionService.get_subscription(db, user_id, subscription_id)
        if not subscription:
            return False
        
        db.delete(subscription)
        db.commit()
        return True
    
    @staticmethod
    def get_subscription_stats(db: Session, user_id: int) -> dict:
        """Get subscription statistics"""
        subscriptions = SubscriptionService.get_user_subscriptions(db, user_id)
        
        active = [s for s in subscriptions if s.status == SubscriptionStatus.ACTIVE]
        cancelled = [s for s in subscriptions if s.status == SubscriptionStatus.CANCELLED]
        unused = [s for s in subscriptions if not s.is_used and s.status == SubscriptionStatus.ACTIVE]
        
        # Calculate spending
        monthly_spending = sum(s.cost for s in active if s.frequency == SubscriptionFrequency.MONTHLY)
        yearly_spending = sum(s.cost * 12 for s in active if s.frequency == SubscriptionFrequency.YEARLY)
        for s in active:
            if s.frequency == SubscriptionFrequency.WEEKLY:
                yearly_spending += s.cost * 52
            elif s.frequency == SubscriptionFrequency.DAILY:
                yearly_spending += s.cost * 365
        
        # Top categories
        category_spending = {}
        for s in active:
            if s.category not in category_spending:
                category_spending[s.category] = 0
            category_spending[s.category] += s.cost
        
        top_categories = sorted(
            [{"category": k, "spending": v} for k, v in category_spending.items()],
            key=lambda x: x["spending"],
            reverse=True
        )[:5]
        
        return {
            "total_subscriptions": len(subscriptions),
            "active_subscriptions": len(active),
            "cancelled_subscriptions": len(cancelled),
            "monthly_spending": monthly_spending,
            "yearly_spending": yearly_spending,
            "unused_subscriptions": len(unused),
            "top_categories": top_categories
        }
    
    @staticmethod
    def get_upcoming_renewals(db: Session, user_id: int, days: int = 30) -> list[Subscription]:
        """Get subscriptions that are renewing soon"""
        cutoff_date = datetime.utcnow() + timedelta(days=days)
        return db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status == SubscriptionStatus.ACTIVE,
            Subscription.next_billing_date <= cutoff_date,
            Subscription.next_billing_date >= datetime.utcnow()
        ).all()
