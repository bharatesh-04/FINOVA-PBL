"""Goal routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.schemas import GoalCreate, GoalResponse, GoalUpdate
from app.models import User, Goal
from app.utils import get_current_user
from typing import List

router = APIRouter(prefix="/api/goals", tags=["Goals"])

@router.post("", response_model=GoalResponse)
def create_goal(
    goal: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new financial goal"""
    new_goal = Goal(user_id=current_user.id, **goal.dict())
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return new_goal

@router.get("", response_model=List[GoalResponse])
def get_goals(
    status_filter: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all goals"""
    query = db.query(Goal).filter(Goal.user_id == current_user.id)
    
    if status_filter:
        query = query.filter(Goal.status == status_filter)
    
    return query.all()

@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific goal"""
    goal = db.query(Goal).filter(
        and_(Goal.id == goal_id, Goal.user_id == current_user.id)
    ).first()
    
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    
    return goal

@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update goal"""
    goal = db.query(Goal).filter(
        and_(Goal.id == goal_id, Goal.user_id == current_user.id)
    ).first()
    
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    
    update_data = goal_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(goal, key, value)
    
    db.commit()
    db.refresh(goal)
    return goal

@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete goal"""
    goal = db.query(Goal).filter(
        and_(Goal.id == goal_id, Goal.user_id == current_user.id)
    ).first()
    
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted successfully"}

@router.post("/{goal_id}/contribute")
def contribute_to_goal(
    goal_id: int,
    amount: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Contribute to a goal"""
    goal = db.query(Goal).filter(
        and_(Goal.id == goal_id, Goal.user_id == current_user.id)
    ).first()
    
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    
    goal.current_amount += amount
    if goal.current_amount >= goal.target_amount:
        goal.status = "completed"
    
    db.commit()
    db.refresh(goal)
    
    return {
        "goal": goal,
        "progress_percentage": (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0
    }
