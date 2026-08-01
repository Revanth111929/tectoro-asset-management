#!/bin/bash
# Production Status Script
# Shows current status of the application

APP_DIR="/home/administrator/Desktop/asset-management"
PID_FILE="$APP_DIR/app.pid"
LOG_FILE="$APP_DIR/logs/production.log"

echo "════════════════════════════════════════════════════════════"
echo "📊 Asset Management Application - Status"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check PID file
echo "1. PID File Check:"
if [ -f "$PID_FILE" ]; then
    APP_PID=$(cat "$PID_FILE")
    echo "   ✓ PID file exists: $PID_FILE"
    echo "   📝 PID: $APP_PID"
    
    # Check if process is running
    if ps -p $APP_PID > /dev/null 2>&1; then
        PROC_CMD=$(ps -p $APP_PID -o cmd= 2>/dev/null)
        echo "   ✓ Process is RUNNING"
        echo "   📋 Command: $PROC_CMD"
        
        # Get process stats
        CPU=$(ps -p $APP_PID -o %cpu= 2>/dev/null | xargs)
        MEM=$(ps -p $APP_PID -o %mem= 2>/dev/null | xargs)
        ELAPSED=$(ps -p $APP_PID -o etime= 2>/dev/null | xargs)
        echo "   💻 CPU: ${CPU}%"
        echo "   🧠 Memory: ${MEM}%"
        echo "   ⏱️  Uptime: $ELAPSED"
    else
        echo "   ❌ Process is NOT running (stale PID file)"
    fi
else
    echo "   ⚠️  No PID file found"
fi

echo ""

# Check port 3000
echo "2. Port 3000 Status:"
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "   ✓ Port 3000 is IN USE"
    PROCS=$(lsof -ti:3000)
    for PID in $PROCS; do
        PROC_CMD=$(ps -p $PID -o comm= 2>/dev/null || echo "unknown")
        PROC_FULL=$(ps -p $PID -o cmd= 2>/dev/null || echo "unknown")
        echo "      • PID $PID: $PROC_CMD"
        echo "        $PROC_FULL"
    done
else
    echo "   ❌ Port 3000 is FREE (no process listening)"
fi

echo ""

# Check API health
echo "3. API Health Check:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/dashboard/stats 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✓ API is HEALTHY (HTTP $HTTP_CODE)"
    
    # Get stats
    STATS=$(curl -s http://localhost:3000/api/dashboard/stats 2>/dev/null)
    if [ ! -z "$STATS" ]; then
        TOTAL_ASSETS=$(echo "$STATS" | grep -o '"totalAssets":[0-9]*' | cut -d: -f2)
        if [ ! -z "$TOTAL_ASSETS" ]; then
            echo "   📦 Total Assets: $TOTAL_ASSETS"
        fi
    fi
elif [ "$HTTP_CODE" = "000" ]; then
    echo "   ❌ API is DOWN (cannot connect)"
else
    echo "   ⚠️  API returned HTTP $HTTP_CODE"
fi

echo ""

# Check frontend build
echo "4. Frontend Build:"
if [ -d "$APP_DIR/frontend/build" ] && [ -f "$APP_DIR/frontend/build/index.html" ]; then
    BUILD_DATE=$(stat -c %y "$APP_DIR/frontend/build/index.html" 2>/dev/null | cut -d' ' -f1)
    BUILD_SIZE=$(du -sh "$APP_DIR/frontend/build" 2>/dev/null | cut -f1)
    echo "   ✓ Build exists"
    echo "   📅 Built on: $BUILD_DATE"
    echo "   📊 Size: $BUILD_SIZE"
else
    echo "   ❌ Build NOT found"
fi

echo ""

# Check logs
echo "5. Recent Logs:"
if [ -f "$LOG_FILE" ]; then
    LOG_SIZE=$(du -sh "$LOG_FILE" 2>/dev/null | cut -f1)
    LOG_LINES=$(wc -l < "$LOG_FILE" 2>/dev/null)
    echo "   ✓ Log file exists: $LOG_FILE"
    echo "   📊 Size: $LOG_SIZE ($LOG_LINES lines)"
    echo ""
    echo "   📝 Last 10 lines:"
    echo "   ────────────────────────────────────────────────"
    tail -10 "$LOG_FILE" 2>/dev/null | sed 's/^/   │ /'
    echo "   ────────────────────────────────────────────────"
else
    echo "   ⚠️  No log file found"
fi

echo ""

# Check database
echo "6. Database:"
if [ -f "$APP_DIR/assets.db" ]; then
    DB_SIZE=$(du -sh "$APP_DIR/assets.db" 2>/dev/null | cut -f1)
    echo "   ✓ Database exists: assets.db"
    echo "   📊 Size: $DB_SIZE"
else
    echo "   ❌ Database NOT found"
fi

echo ""
echo "════════════════════════════════════════════════════════════"

# Overall status
if [ -f "$PID_FILE" ]; then
    APP_PID=$(cat "$PID_FILE")
    if ps -p $APP_PID > /dev/null 2>&1 && [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Overall Status: RUNNING & HEALTHY"
    elif ps -p $APP_PID > /dev/null 2>&1; then
        echo "⚠️  Overall Status: RUNNING but API unhealthy"
    else
        echo "❌ Overall Status: NOT RUNNING"
    fi
else
    echo "❌ Overall Status: NOT RUNNING"
fi

echo "════════════════════════════════════════════════════════════"
echo ""

# Show management commands
echo "🔧 Management Commands:"
echo "   • Start:      ./production_start.sh"
echo "   • Stop:       ./production_stop.sh"
echo "   • Restart:    ./production_restart.sh"
echo "   • View logs:  tail -f $LOG_FILE"
echo ""
