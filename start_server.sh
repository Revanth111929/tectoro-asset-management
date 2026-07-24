#!/bin/bash
# Start Asset Management Server on Port 3000

echo "=================================================="
echo "🚀 Starting Asset Management Application"
echo "=================================================="

# Navigate to project directory
cd "$(dirname "$0")"

# Kill any existing processes on port 3000
echo "📍 Step 1: Checking for existing processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "   ✓ Killed old processes" || echo "   ✓ No existing processes found"

# Activate virtual environment
echo ""
echo "📍 Step 2: Activating virtual environment..."
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "   ✓ Virtual environment activated"
else
    echo "   ❌ Virtual environment not found!"
    exit 1
fi

# Check if frontend build exists
echo ""
echo "📍 Step 3: Checking frontend build..."
if [ ! -f "frontend/build/index.html" ]; then
    echo "   ❌ Frontend build not found!"
    echo "   Run: cd frontend && npm run build"
    exit 1
fi
echo "   ✓ Frontend build found"

# Start Flask server
echo ""
echo "📍 Step 4: Starting Flask server..."
echo "=================================================="
python3 api_server.py

