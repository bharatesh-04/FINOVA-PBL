"""User service"""
from sqlalchemy.orm import Session
from app.models import User
from app.schemas import UserCreate, UserUpdate
from app.utils import hash_password, verify_password, create_access_token
from fastapi import HTTPException, status
from datetime import timedelta

class UserService:
    """User management service"""
    
    @staticmethod
    def create_user(db: Session, user_create: UserCreate) -> User:
        """Create new user"""
        # Check if user exists
        existing = db.query(User).filter(
            (User.email == user_create.email) |
            (User.username == user_create.username)
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email or username already exists"
            )
        
        # Create new user
        user = User(
            email=user_create.email,
            username=user_create.username,
            full_name=user_create.full_name,
            currency=user_create.currency,
            hashed_password=hash_password(user_create.password)
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User:
        """Authenticate user with email and password"""
        user = db.query(User).filter(User.email == email).first()
        
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled"
            )
        
        return user
    
    @staticmethod
    def get_user(db: Session, user_id: int) -> User:
        """Get user by ID"""
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
    
    @staticmethod
    def update_user(db: Session, user: User, update_data: UserUpdate) -> User:
        """Update user details"""
        if update_data.full_name:
            user.full_name = update_data.full_name
        if update_data.currency:
            user.currency = update_data.currency
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def create_access_token_for_user(user: User) -> str:
        """Create JWT token for user"""
        access_token_expires = timedelta(
            minutes=60 * 24  # 24 hours
        )
        return create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )
