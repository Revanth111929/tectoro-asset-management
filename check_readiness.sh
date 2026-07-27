#!/bin/bash
echo "=========================================="
echo "Asset Deletion Readiness Check"
echo "=========================================="
echo ""

echo "1. Checking frontend build..."
if [ -f "frontend/build/index.html" ]; then
    BUILD_TIME=$(stat -c %y "frontend/build/index.html" 2>/dev/null || stat -f "%Sm" "frontend/build/index.html" 2>/dev/null)
    echo "   ✅ Frontend built: $BUILD_TIME"
else
    echo "   ❌ Frontend build not found!"
fi

echo ""
echo "2. Checking backend delete endpoint..."
if grep -q "def delete_asset(asset_id):" api_server.py; then
    echo "   ✅ Backend delete function exists"
else
    echo "   ❌ Backend delete function NOT found!"
fi

echo ""
echo "3. Checking frontend delete handler..."
if grep -q "console.log.*Delete requested" frontend/src/pages/AssetList.js; then
    echo "   ✅ Frontend has enhanced logging"
else
    echo "   ❌ Frontend logging NOT found!"
fi

echo ""
echo "4. Checking API service..."
if grep -q "console.log.*assetAPI.*delete called" frontend/src/services/api.js; then
    echo "   ✅ API service has enhanced logging"
else
    echo "   ❌ API service logging NOT found!"
fi

echo ""
echo "5. Application URLs:"
echo "   🌐 Frontend: http://192.168.20.180:3000"
echo "   🔌 Backend:  http://192.168.20.180:5000/api"

echo ""
echo "=========================================="
echo "Status: Ready for testing"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: User must do hard refresh!"
echo "    Ctrl + Shift + R (Windows/Linux)"
echo "    Cmd + Shift + R (Mac)"
echo ""
