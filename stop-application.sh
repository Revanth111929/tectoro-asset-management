#!/bin/bash
# Stop Asset Management Application

echo "🛑 Stopping Asset Management Application"
echo "════════════════════════════════════════════════════"
echo ""

# Kill processes on port 3000
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "Stopping processes on port 3000..."
    fuser -k 3000/tcp 2>/dev/null
    sleep 2
    echo "✅ Application stopped"
else
    echo "✅ No processes found on port 3000"
fi

echo ""
echo "════════════════════════════════════════════════════"
