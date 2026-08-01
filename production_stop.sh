#!/bin/bash
# Production Stop Script
# Gracefully stops the running application

set -e

APP_DIR="/home/administrator/Desktop/asset-management"
PID_FILE="$APP_DIR/app.pid"

echo "════════════════════════════════════════════════════════════"
echo "🛑 Stopping Asset Management Application"
echo "════════════════════════════════════════════════════════════"
echo ""

cd "$APP_DIR"

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    echo "⚠️  No PID file found. Application might not be running."
    echo ""
    
    # Check if anything is on port 3000
    if lsof -ti:3000 > /dev/null 2>&1; then
        echo "❓ But port 3000 is in use. Killing processes on port 3000..."
        PROCS=$(lsof -ti:3000)
        for PID in $PROCS; do
            PROC_CMD=$(ps -p $PID -o comm= 2>/dev/null || echo "unknown")
            echo "   Killing: $PROC_CMD (PID: $PID)"
            kill $PID 2>/dev/null || true
        done
        sleep 2
        
        # Force kill if needed
        if lsof -ti:3000 > /dev/null 2>&1; then
            echo "   Force killing..."
            fuser -k 3000/tcp 2>/dev/null || true
        fi
        echo ""
        echo "✅ Port 3000 freed"
    else
        echo "✅ Port 3000 is already free"
    fi
    
    exit 0
fi

# Read PID from file
APP_PID=$(cat "$PID_FILE")
echo "📝 PID from file: $APP_PID"
echo ""

# Check if process is running
if ps -p $APP_PID > /dev/null 2>&1; then
    PROC_CMD=$(ps -p $APP_PID -o cmd= 2>/dev/null)
    echo "🔍 Found process: $PROC_CMD"
    echo ""
    echo "1. Attempting graceful shutdown (SIGTERM)..."
    kill $APP_PID 2>/dev/null || true
    
    # Wait up to 10 seconds for graceful shutdown
    WAIT_COUNT=0
    while ps -p $APP_PID > /dev/null 2>&1 && [ $WAIT_COUNT -lt 10 ]; do
        echo -n "."
        sleep 1
        WAIT_COUNT=$((WAIT_COUNT + 1))
    done
    echo ""
    
    # Check if still running
    if ps -p $APP_PID > /dev/null 2>&1; then
        echo "2. Graceful shutdown failed. Force killing (SIGKILL)..."
        kill -9 $APP_PID 2>/dev/null || true
        sleep 1
        
        if ps -p $APP_PID > /dev/null 2>&1; then
            echo "   ❌ ERROR: Could not kill process $APP_PID"
            exit 1
        fi
    fi
    
    echo "   ✓ Process stopped"
else
    echo "⚠️  Process $APP_PID is not running (stale PID file)"
fi

# Remove PID file
rm -f "$PID_FILE"
echo "   ✓ PID file removed"
echo ""

# Final check - ensure port is free
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is still in use. Cleaning up..."
    fuser -k 3000/tcp 2>/dev/null || true
    sleep 1
fi

if lsof -ti:3000 > /dev/null 2>&1; then
    echo "❌ WARNING: Port 3000 is still in use!"
    echo ""
    echo "Check manually:"
    echo "lsof -i:3000"
else
    echo "✅ Port 3000 is free"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Application Stopped Successfully"
echo "════════════════════════════════════════════════════════════"
echo ""
