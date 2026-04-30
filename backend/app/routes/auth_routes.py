"""Authentication routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import UserCreate, UserLogin, UserResponse, TokenResponse
from app.services import UserService
from app.utils import get_current_user
from app.models import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=TokenResponse)
def signup(user_create: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    user = UserService.create_user(db, user_create)
    access_token = UserService.create_access_token_for_user(user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }

@router.post("/login", response_model=TokenResponse)
def login(user_login: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password"""
    user = UserService.authenticate_user(db, user_login.email, user_login.password)
    access_token = UserService.create_access_token_for_user(user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user

@router.post("/logout")
def logout():
    """Logout (client-side token deletion)"""
    return {"message": "Logged out successfully"}
