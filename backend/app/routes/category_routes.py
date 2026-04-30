"""Category routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.schemas import CategoryCreate, CategoryResponse, CategoryUpdate
from app.models import User, Category
from app.utils import get_current_user
from typing import List

router = APIRouter(prefix="/api/categories", tags=["Categories"])

# Default categories
DEFAULT_CATEGORIES = [
    {"name": "Food", "icon": "🍔", "color": "#FF6B6B", "category_type": "expense"},
    {"name": "Travel", "icon": "✈️", "color": "#4ECDC4", "category_type": "expense"},
    {"name": "Entertainment", "icon": "🎬", "color": "#95E1D3", "category_type": "expense"},
    {"name": "Shopping", "icon": "🛍️", "color": "#FFB3B3", "category_type": "expense"},
    {"name": "Health", "icon": "💊", "color": "#A8D8EA", "category_type": "expense"},
    {"name": "Education", "icon": "📚", "color": "#AA96DA", "category_type": "expense"},
    {"name": "Utilities", "icon": "💡", "color": "#FCBAD3", "category_type": "expense"},
    {"name": "Other", "icon": "📌", "color": "#C3B1E1", "category_type": "expense"},
    {"name": "Salary", "icon": "💰", "color": "#52B788", "category_type": "income"},
    {"name": "Bonus", "icon": "🎁", "color": "#74C69D", "category_type": "income"},
    {"name": "Investment Returns", "icon": "📈", "color": "#B7E4C7", "category_type": "income"},
]

@router.post("/init-defaults")
def init_default_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Initialize default categories for user"""
    existing = db.query(Category).filter(Category.user_id == current_user.id).count()
    if existing > 0:
        return {"message": "Categories already initialized"}
    
    categories = []
    for cat_data in DEFAULT_CATEGORIES:
        cat = Category(
            user_id=current_user.id,
            is_default=True,
            **cat_data
        )
        categories.append(cat)
        db.add(cat)
    
    db.commit()
    return {"message": "Default categories initialized", "count": len(categories)}

@router.post("", response_model=CategoryResponse)
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new category"""
    new_category = Category(user_id=current_user.id, **category.dict())
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

@router.get("", response_model=List[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all categories"""
    categories = db.query(Category).filter(Category.user_id == current_user.id).all()
    return categories

@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific category"""
    category = db.query(Category).filter(
        and_(Category.id == category_id, Category.user_id == current_user.id)
    ).first()
    
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    return category

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update category"""
    category = db.query(Category).filter(
        and_(Category.id == category_id, Category.user_id == current_user.id)
    ).first()
    
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    update_data = category_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)
    
    db.commit()
    db.refresh(category)
    return category

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete category"""
    category = db.query(Category).filter(
        and_(Category.id == category_id, Category.user_id == current_user.id)
    ).first()
    
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}
