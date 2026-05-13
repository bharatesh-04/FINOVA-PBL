"""
Configuration settings for the Finance Tracker application
"""
import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings"""
    
    # App settings
    APP_NAME: str = "AI Personal Finance Tracker"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database settings
    DATABASE_URL: str = "sqlite:///./finance_tracker.db"  # SQLite for local dev
    # For PostgreSQL: postgresql://user:password@hostname:5432/dbname
    
    # JWT settings
    SECRET_KEY: str = "your-secret-key-change-this-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # File upload settings
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_EXTENSIONS: list = ["jpg", "jpeg", "png", "pdf"]
    
    # OCR settings
    OCR_ENABLED: bool = True
    TESSERACT_PATH: Optional[str] = None  # Set if needed on Windows
    
    # ML Model settings
    MODEL_PATH: str = "ml_models"
    
    # CORS settings
    CORS_ORIGINS: list = [
        "http://localhost:3000", 
        "http://localhost:8000",
        "https://YOUR_RENDER_DOMAIN.onrender.com"
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    def __init__(self, **data):
        super().__init__(**data)
        # Parse CORS_ORIGINS from environment if it's a string
        if isinstance(self.CORS_ORIGINS, str):
            self.CORS_ORIGINS = [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

settings = Settings()
