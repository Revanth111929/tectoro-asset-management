#!/bin/bash
# Quick Fix Script - Run this if you have any issues

echo "🔧 Quick Fix Starting..."
echo ""

cd /home/administrator/Desktop/asset-management

# Restart backend
echo "1. Restarting backend..."
./restart_backend.sh

echo ""
echo "✅ Fix Complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Go to your browser"
echo "   2. Press Ctrl+Shift+R (hard refresh)"
echo "   3. Everything should work now!"
echo ""
