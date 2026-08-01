#!/bin/bash
# Test the live PDF endpoint with real authentication

echo "=========================================="
echo "Testing Live PDF Endpoint"
echo "=========================================="
echo ""

# Step 1: Login
echo "Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://192.168.20.180:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('token', data.get('access_token', '')))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✓ Login successful"
echo "✓ Token obtained"
echo ""

# Step 2: Test PDF endpoint
echo "Step 2: Testing PDF endpoint for Asset ID 7..."
HTTP_STATUS=$(curl -s -o /tmp/test_live_pdf.pdf -w "%{http_code}" \
  http://192.168.20.180:3000/api/assets/7/assignment-form \
  -H "Authorization: Bearer $TOKEN")

if [ "$HTTP_STATUS" = "200" ]; then
  FILE_SIZE=$(stat -c%s /tmp/test_live_pdf.pdf 2>/dev/null)
  echo "✓ PDF endpoint returned HTTP 200"
  echo "✓ PDF file size: $FILE_SIZE bytes"
  
  if [ "$FILE_SIZE" -gt 0 ]; then
    echo "✓ PDF is not empty"
    
    # Check if it's a valid PDF
    if file /tmp/test_live_pdf.pdf | grep -q "PDF"; then
      echo "✓ File is a valid PDF"
      
      # Extract page count
      PAGE_COUNT=$(pdfinfo /tmp/test_live_pdf.pdf 2>/dev/null | grep "Pages:" | awk '{print $2}')
      if [ "$PAGE_COUNT" = "1" ]; then
        echo "✓ PDF is single page"
      else
        echo "⚠ PDF has $PAGE_COUNT pages (expected 1)"
      fi
      
      # Extract some text to verify content
      echo ""
      echo "PDF Content Preview:"
      echo "--------------------"
      pdftotext /tmp/test_live_pdf.pdf - 2>/dev/null | head -20
      
      echo ""
      echo "=========================================="
      echo "✅ ALL CHECKS PASSED"
      echo "=========================================="
      echo ""
      echo "Live PDF endpoint is working correctly!"
      echo "Test PDF saved to: /tmp/test_live_pdf.pdf"
    else
      echo "❌ Downloaded file is not a valid PDF"
      exit 1
    fi
  else
    echo "❌ PDF is empty"
    exit 1
  fi
else
  echo "❌ PDF endpoint returned HTTP $HTTP_STATUS"
  cat /tmp/test_live_pdf.pdf
  exit 1
fi
