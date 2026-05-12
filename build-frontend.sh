#!/bin/bash
# Build script for Render frontend deployment

echo "Building Finance Tracker Frontend..."
cd frontend

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Create production build
echo "Creating production build..."
npm run build

# Check if build was successful
if [ -d "build" ]; then
    echo "✅ Build successful!"
    echo "Build directory size: $(du -sh build)"
else
    echo "❌ Build failed!"
    exit 1
fi
