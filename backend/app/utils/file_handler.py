"""File handling utilities"""
import os
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from config import settings
from typing import Optional, Tuple

class FileHandler:
    """Handle file uploads and storage"""
    
    @staticmethod
    def create_upload_dir():
        """Create upload directory if it doesn't exist"""
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    @staticmethod
    def validate_file(filename: str) -> bool:
        """Validate file extension"""
        allowed_extensions = set(settings.ALLOWED_EXTENSIONS)
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        return ext in allowed_extensions
    
    @staticmethod
    async def save_upload(
        upload_file: UploadFile,
        user_id: int,
        subfolder: str = "receipts"
    ) -> Tuple[str, str]:
        """
        Save uploaded file
        Returns: (file_path, filename)
        """
        # Validate file
        if not FileHandler.validate_file(upload_file.filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed: {settings.ALLOWED_EXTENSIONS}"
            )
        
        # Check file size
        content = await upload_file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE} bytes"
            )
        
        # Create user-specific directory
        user_dir = os.path.join(settings.UPLOAD_DIR, subfolder, str(user_id))
        os.makedirs(user_dir, exist_ok=True)
        
        # Generate safe filename
        import uuid
        ext = upload_file.filename.rsplit('.', 1)[1].lower()
        safe_filename = f"{uuid.uuid4()}.{ext}"
        file_path = os.path.join(user_dir, safe_filename)
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(content)
        
        return file_path, safe_filename
    
    @staticmethod
    def delete_file(file_path: str) -> bool:
        """Delete uploaded file"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        except Exception as e:
            print(f"Error deleting file: {e}")
        return False
    
    @staticmethod
    def get_file_size(file_path: str) -> Optional[int]:
        """Get file size in bytes"""
        try:
            return os.path.getsize(file_path)
        except OSError:
            return None

# Create upload directory on module load
FileHandler.create_upload_dir()
