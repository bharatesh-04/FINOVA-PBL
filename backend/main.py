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
    recurring_router, analytics_router, bill_router
)

# Initialize database
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager"""
    # Startup
    print("Starting Finance Tracker API...")
    init_db()
    yield
    # Shutdown
    print("Shutting down Finance Tracker API...")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Personal Finance Tracker & Analyzer",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
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

# Root endpoint
@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Finance Tracker API",
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

# Serve static files from React build - must be before catch-all
frontend_build_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "build")
frontend_static_path = os.path.join(frontend_build_path, "static")

if os.path.exists(frontend_static_path):
    app.mount("/static", StaticFiles(directory=frontend_static_path), name="static")

# Catch-all route for SPA (serve index.html for non-API routes)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve React SPA for all non-API routes"""
    # If it's an API route or file request, let it fail naturally
    if full_path.startswith("api/") or full_path.startswith("uploads/") or "." in full_path:
        return {"error": "Not Found"}
    
    # Serve index.html for client-side routing
    index_file = os.path.join(frontend_build_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file, media_type="text/html")
    
    return {"error": "Frontend not built. Run: npm run build in frontend directory"}

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
