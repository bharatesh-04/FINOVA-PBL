"""Subscription routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.schemas.subscription import SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse, SubscriptionStats
from app.services.subscription_service import SubscriptionService

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

@router.post("/", response_model=SubscriptionResponse)
async def create_subscription(
    subscription: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new subscription"""
    return SubscriptionService.create_subscription(db, current_user.id, subscription)

@router.get("/", response_model=list[SubscriptionResponse])
async def get_subscriptions(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all subscriptions for current user"""
    return SubscriptionService.get_user_subscriptions(db, current_user.id, status)

@router.get("/stats", response_model=SubscriptionStats)
async def get_subscription_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get subscription statistics"""
    return SubscriptionService.get_subscription_stats(db, current_user.id)

@router.get("/upcoming", response_model=list[SubscriptionResponse])
async def get_upcoming_renewals(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get subscriptions with upcoming renewals"""
    return SubscriptionService.get_upcoming_renewals(db, current_user.id, days)

@router.get("/{subscription_id}", response_model=SubscriptionResponse)
async def get_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific subscription"""
    subscription = SubscriptionService.get_subscription(db, current_user.id, subscription_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    return subscription

@router.put("/{subscription_id}", response_model=SubscriptionResponse)
async def update_subscription(
    subscription_id: int,
    update_data: SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a subscription"""
    subscription = SubscriptionService.update_subscription(db, current_user.id, subscription_id, update_data)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    return subscription

@router.delete("/{subscription_id}/{action}")
async def delete_or_cancel_subscription(
    subscription_id: int,
    action: str,  # "delete" or "cancel"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete or cancel a subscription"""
    if action == "delete":
        success = SubscriptionService.delete_subscription(db, current_user.id, subscription_id)
    elif action == "cancel":
        subscription = SubscriptionService.cancel_subscription(db, current_user.id, subscription_id)
        success = subscription is not None
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action must be 'delete' or 'cancel'"
        )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    return {"message": f"Subscription {action}ed successfully"}
