#!/bin/bash
# Start Asset Management Application (Non-Docker)
# This starts both backend and frontend in the traditional way

echo "🚀 Starting Asset Management Application"
echo "════════════════════════════════════════════════════"
echo ""

cd /home/administrator/Desktop/asset-management

# Kill any existing processes on port 3000
echo "1. Checking for existing processes on port 3000..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "   ⚠️  Port 3000 is in use. Stopping existing processes..."
    fuser -k 3000/tcp 2>/dev/null
    sleep 2
fi
echo "   ✅ Port 3000 is free"
echo ""

# Start Backend
echo "2. Starting Backend (Python Flask API)..."
source venv/bin/activate
nohup python3 api_server.py > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   ✅ Backend started (PID: $BACKEND_PID)"
echo "   📝 Backend logs: logs/backend.log"
echo ""

# Wait for backend to start
echo "3. Waiting for backend to be ready..."
sleep 5

# Test backend
if curl -s http://localhost:3000/api/dashboard/stats > /dev/null 2>&1; then
    echo "   ✅ Backend is responding"
else
    echo "   ⚠️  Backend might still be starting..."
fi
echo ""

echo "════════════════════════════════════════════════════"
echo "✅ Application Started!"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://192.168.20.180:3000"
echo "   Backend:  http://192.168.20.180:3000/api"
echo ""
echo "📝 Backend Process: PID $BACKEND_PID"
echo "📋 View logs: tail -f logs/backend.log"
echo ""
echo "🛑 To stop:"
echo "   fuser -k 3000/tcp"
echo "   or"
echo "   ./stop-application.sh"
echo ""
echo "ℹ️  Backend serves both API and Frontend (React build)"
echo "════════════════════════════════════════════════════"
