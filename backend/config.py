"""
Configuration settings for the FINNOVA application
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

ROOT_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    """Application settings"""
    
    # App settings
    APP_NAME: str = "FINNOVA"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool | str = True
    
    # Database settings
    DATABASE_URL: str = "sqlite:///./finance_tracker.db"  # SQLite for local dev
    # For PostgreSQL: postgresql://user:password@hostname:5432/dbname
    
    # JWT settings
    SECRET_KEY: str = "1-L7cbVxUU2F7EBHbW32VVLQwfY7HD0psfEHTRQrjX8"
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
    CORS_ORIGINS: list[str] | str = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://finova-qvey.onrender.com",
        "https://finova-fpr3.onrender.com",
        "*"  # Allow all origins (temporary for debugging - remove in production)
    ]
    CORS_ALLOW_CREDENTIALS: bool = True

    class Config:
        env_file = str(ROOT_DIR / ".env")
        case_sensitive = True
        extra = "ignore"

    def __init__(self, **data):
        super().__init__(**data)
        if isinstance(self.DEBUG, str):
            self.DEBUG = self.DEBUG.strip().lower() in {"1", "true", "yes", "on", "debug"}

        # Parse CORS_ORIGINS from environment if it's a string
        if isinstance(self.CORS_ORIGINS, str):
            self.CORS_ORIGINS = [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

settings = Settings()
