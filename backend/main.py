"""Main FastAPI application"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os

from config import settings
from app.database import init_db
from app.routes import (
    auth_router, transaction_router, account_router,
    category_router, budget_router, goal_router,
    recurring_router, analytics_router, bill_router, chat_router,
    subscription_router, forecasting_router
)

# Database initialization is performed during application startup
# to avoid connecting at import time (which prevents the app from
# failing when an external DB is temporarily unavailable).

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager"""
    # Startup
    print("Starting FINNOVA API...")
    init_db()
    yield
    # Shutdown
    print("Shutting down FINNOVA API...")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="FINNOVA - AI-powered personal finance tracker and analyzer",
    lifespan=lifespan
)

# Add CORS middleware
allow_origins = settings.CORS_ORIGINS
allow_credentials = getattr(settings, "CORS_ALLOW_CREDENTIALS", True)

if isinstance(allow_origins, list) and "*" in allow_origins:
    allow_origins = ["*"]
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(transaction_router)
app.include_router(account_router)
app.include_router(category_router)
app.include_router(budget_router)
app.include_router(goal_router)
app.include_router(recurring_router)
app.include_router(analytics_router)
app.include_router(bill_router)
app.include_router(chat_router)
app.include_router(subscription_router)
app.include_router(forecasting_router)

# Root endpoint
@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Welcome to FINNOVA API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }

# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

# Mount upload files if they exist
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Get frontend build path - works in both local and Render environments
import sys
# Backend main.py is at: backend/main.py
# Frontend build is at: frontend/build
# So from backend/, we go up one level (..) then into frontend/build
backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(backend_dir)  # Go up from backend/ to project root
frontend_build_path = os.path.join(project_root, "frontend", "build")

print(f"Backend directory: {backend_dir}")
print(f"Project root: {project_root}")
print(f"Frontend build path: {frontend_build_path}")
print(f"Frontend build exists: {os.path.exists(frontend_build_path)}")

# Serve static files from React build
frontend_static_path = os.path.join(frontend_build_path, "static")
if os.path.exists(frontend_static_path):
    print(f"Mounting static files from: {frontend_static_path}")
    app.mount("/static", StaticFiles(directory=frontend_static_path), name="static")

from fastapi import HTTPException

# Catch-all route for SPA (serve index.html for non-API routes)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve React SPA for all non-API routes"""
    # Skip API route requests and file extension requests
    if full_path.startswith("api/") or full_path == "api":
        raise HTTPException(status_code=404, detail="Not Found")

    if "." in full_path or full_path.startswith("uploads/"):
        raise HTTPException(status_code=404, detail="Not Found")

    index_file = os.path.join(frontend_build_path, "index.html")
    if os.path.exists(index_file):
        print(f"Serving frontend from: {index_file}")
        return FileResponse(index_file, media_type="text/html")

    print(f"Frontend not built at: {frontend_build_path}")
    raise HTTPException(
        status_code=500,
        detail="Frontend build missing. Run: cd frontend && npm run build"
    )

# Error handlers
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=str(exc)
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
