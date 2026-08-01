#!/bin/bash

echo "🔄 Restarting Asset Management Application..."
echo ""

# Kill existing processes
echo "1. Stopping old processes..."
pkill -f "python3 api_server.py" 2>/dev/null
pkill -f "npm start" 2>/dev/null
sleep 2

# Kill port 3000 (used by api_server.py)
if lsof -i :3000 >/dev/null 2>&1; then
    echo "   ⚠️  Killing process on port 3000..."
    fuser -k 3000/tcp 2>/dev/null
    sleep 1
fi

echo "   ✓ Old processes stopped"
echo ""

# Start Flask server (serves both API and React frontend on port 3000)
echo "2. Starting Flask server (api_server.py) on port 3000..."
cd /home/administrator/Desktop/asset-management
source venv/bin/activate

# Start in background
nohup python3 api_server.py > backend.log 2>&1 &
BACKEND_PID=$!

sleep 3

# Check if it started successfully on port 3000
if lsof -i :3000 >/dev/null 2>&1; then
    echo "   ✓ Flask server started successfully (PID: $BACKEND_PID)"
    echo "   ✓ Running on http://192.168.20.180:3000"
    echo ""
    echo "3. Testing API endpoint..."
    
    # Test the API on port 3000
    if curl -s http://192.168.20.180:3000/api/dashboard/stats | grep -q "totalAssets"; then
        echo "   ✓ API is working!"
        echo ""
        echo "✅ Application restart complete!"
        echo ""
        echo "📝 Access your application:"
        echo "   http://192.168.20.180:3000"
    else
        echo "   ⚠️  API test failed"
        echo "   Check backend.log for errors"
        tail -20 backend.log
    fi
else
    echo "   ❌ Failed to start Flask server"
    echo "   Check backend.log for errors:"
    echo ""
    tail -20 backend.log
fi

echo ""
