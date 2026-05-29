FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements-core.txt .
RUN python -m pip install --upgrade pip \
    && python -m pip install --no-cache-dir -r requirements-core.txt

# Copy backend code
COPY backend/ ./backend/

# Run from backend so app_demo:app resolves correctly
WORKDIR /app/backend

# Expose backend port
EXPOSE 8000

# Run backend with Render's assigned port
CMD ["sh", "-c", "python -m gunicorn.app.wsgiapp app_demo:app --workers 1 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8000}"]
