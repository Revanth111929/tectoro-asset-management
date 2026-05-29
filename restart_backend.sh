#!/bin/bash

echo "🔄 Restarting Backend Server..."
echo ""

# Kill existing backend processes
echo "1. Stopping old backend processes..."
pkill -f "python3 app.py" 2>/dev/null
pkill -f "python3 api_server.py" 2>/dev/null
sleep 2

# Verify they're stopped
if lsof -i :5000 >/dev/null 2>&1; then
    echo "   ⚠️  Port 5000 still in use, force killing..."
    fuser -k 5000/tcp 2>/dev/null
    sleep 1
fi

echo "   ✓ Old processes stopped"
echo ""

# Start new backend
echo "2. Starting new backend..."
cd /home/administrator/Desktop/asset-management
source venv/bin/activate

# Start in background
nohup python3 app.py > backend.log 2>&1 &
BACKEND_PID=$!

sleep 3

# Check if it started successfully
if lsof -i :5000 >/dev/null 2>&1; then
    echo "   ✓ Backend started successfully (PID: $BACKEND_PID)"
    echo "   ✓ Running on http://192.168.20.180:5000"
    echo ""
    echo "3. Testing API endpoint..."
    
    # Test the API
    if curl -s http://192.168.20.180:5000/api/dashboard/stats | grep -q "laptopStats"; then
        echo "   ✓ API is working and returning laptopStats!"
        echo ""
        echo "✅ Backend restart complete!"
        echo ""
        echo "📝 Next steps:"
        echo "   1. Go to your browser"
        echo "   2. Open http://192.168.20.180:3000/dashboard"
        echo "   3. Press Ctrl+Shift+R to hard refresh"
        echo "   4. You should see laptop statistics in the chart"
    else
        echo "   ⚠️  API is running but laptopStats not found"
        echo "   Check backend.log for errors"
    fi
else
    echo "   ❌ Failed to start backend"
    echo "   Check backend.log for errors:"
    echo ""
    tail -20 backend.log
fi

echo ""
