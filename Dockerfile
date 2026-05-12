FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt .
RUN python -m pip install --upgrade pip \
    && python -m pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Install Node.js for frontend
RUN apt-get update && apt-get install -y nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# Copy frontend
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm install && npm run build

# Back to app directory
WORKDIR /app

# Expose ports
EXPOSE 8000 3000

# Run both backend and frontend
CMD ["sh", "-c", "python backend/main.py & serve -s frontend/build -l 3000"]
