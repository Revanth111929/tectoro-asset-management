#!/bin/bash
# Production Start Script
# This script properly starts the application for production use

set -e  # Exit on error

APP_DIR="/home/administrator/Desktop/asset-management"
LOG_DIR="$APP_DIR/logs"
PID_FILE="$APP_DIR/app.pid"
LOG_FILE="$LOG_DIR/production.log"

echo "════════════════════════════════════════════════════════════"
echo "🚀 Starting Asset Management Application (Production Mode)"
echo "════════════════════════════════════════════════════════════"
echo ""

cd "$APP_DIR"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Step 1: Check if already running
echo "1. Checking if application is already running..."
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "   ⚠️  Application is already running (PID: $OLD_PID)"
        echo ""
        echo "   To stop it first, run:"
        echo "   ./production_stop.sh"
        echo ""
        echo "   Or to restart, run:"
        echo "   ./production_restart.sh"
        exit 1
    else
        echo "   🧹 Removing stale PID file..."
        rm -f "$PID_FILE"
    fi
fi

# Step 2: Kill any processes on port 3000
echo "2. Checking port 3000..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "   ⚠️  Port 3000 is in use. Stopping existing processes..."
    
    # Get process details
    PROCS=$(lsof -ti:3000 2>/dev/null || echo "")
    if [ ! -z "$PROCS" ]; then
        for PID in $PROCS; do
            PROC_CMD=$(ps -p $PID -o comm= 2>/dev/null || echo "unknown")
            echo "      Killing: $PROC_CMD (PID: $PID)"
            kill $PID 2>/dev/null || sudo kill $PID 2>/dev/null || true
        done
        sleep 2
        
        # Force kill if still running
        if lsof -ti:3000 > /dev/null 2>&1; then
            echo "      Force killing remaining processes..."
            fuser -k 3000/tcp 2>/dev/null || sudo fuser -k 3000/tcp 2>/dev/null || true
            sleep 1
        fi
    fi
fi

# Step 3: Verify port is free
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "   ❌ ERROR: Could not free port 3000"
    echo ""
    echo "   Manually check what's using the port:"
    echo "   lsof -i:3000"
    echo "   sudo fuser -k 3000/tcp"
    exit 1
else
    echo "   ✓ Port 3000 is free"
fi

# Step 4: Activate virtual environment
echo "3. Activating virtual environment..."
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "   ✓ Virtual environment activated"
else
    echo "   ❌ ERROR: Virtual environment not found"
    echo "   Create it with: python3 -m venv venv"
    exit 1
fi

# Step 5: Verify frontend build exists
echo "4. Checking frontend build..."
if [ -d "frontend/build" ] && [ -f "frontend/build/index.html" ]; then
    BUILD_DATE=$(stat -c %y frontend/build/index.html 2>/dev/null | cut -d' ' -f1)
    echo "   ✓ Frontend build found (built on: $BUILD_DATE)"
else
    echo "   ⚠️  Frontend build not found. Building now..."
    cd frontend
    npm run build
    cd ..
    echo "   ✓ Frontend built successfully"
fi

# Step 6: Choose which server to run
echo "5. Starting Flask application..."
echo ""
echo "   Which server file do you want to run?"
echo "   1) app.py (recommended - includes blueprints)"
echo "   2) api_server.py (standalone - all routes in one file)"
echo ""
read -p "   Enter choice (1 or 2): " CHOICE

if [ "$CHOICE" = "2" ]; then
    SERVER_FILE="api_server.py"
else
    SERVER_FILE="app.py"
fi

echo ""
echo "   Starting $SERVER_FILE..."

# Start the application in background
nohup python3 "$SERVER_FILE" > "$LOG_FILE" 2>&1 &
APP_PID=$!

# Save PID
echo $APP_PID > "$PID_FILE"

# Wait a moment for server to start
sleep 3

# Step 7: Verify server started
echo "6. Verifying server started..."
if ps -p $APP_PID > /dev/null 2>&1; then
    echo "   ✓ Server process is running (PID: $APP_PID)"
    
    # Check if port is listening
    sleep 2
    if lsof -ti:3000 > /dev/null 2>&1; then
        echo "   ✓ Port 3000 is listening"
        
        # Test the API
        if curl -s http://localhost:3000/api/dashboard/stats > /dev/null 2>&1; then
            echo "   ✓ API health check passed"
        else
            echo "   ⚠️  API health check failed (might still be starting)"
        fi
    else
        echo "   ⚠️  Port 3000 not listening yet (might still be starting)"
    fi
else
    echo "   ❌ ERROR: Server failed to start"
    echo ""
    echo "   Check the logs:"
    echo "   tail -50 $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Application Started Successfully!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📝 Application Details:"
echo "   • PID:        $APP_PID"
echo "   • Server:     $SERVER_FILE"
echo "   • URL:        http://192.168.20.180:3000"
echo "   • Logs:       $LOG_FILE"
echo "   • PID File:   $PID_FILE"
echo ""
echo "🔧 Management Commands:"
echo "   • View logs:  tail -f $LOG_FILE"
echo "   • Stop:       ./production_stop.sh"
echo "   • Restart:    ./production_restart.sh"
echo "   • Status:     ./production_status.sh"
echo ""
echo "🌐 Access the application:"
echo "   http://192.168.20.180:3000"
echo ""
