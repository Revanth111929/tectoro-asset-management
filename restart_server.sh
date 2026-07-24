#!/bin/bash

echo "🔄 Restarting Flask server..."

# Find and kill existing Flask process
pkill -f "python.*api_server.py" || echo "No existing process found"

# Wait a moment
sleep 2

# Start the server
cd /home/administrator/Desktop/asset-management
python api_server.py &

echo "✅ Server restarted!"
echo "📍 URL: http://192.168.20.180:3000"
