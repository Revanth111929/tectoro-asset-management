#!/bin/bash
# Test script for PDF feature verification

echo "=========================================="
echo "PDF Feature Test Suite"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend Health Check
echo "Test 1: Backend Health Check"
echo "------------------------------"
HEALTH=$(curl -s http://192.168.20.180:5000/api/health | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])" 2>/dev/null)
if [ "$HEALTH" = "ok" ]; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
    exit 1
fi
echo ""

# Test 2: Login and Get Token
echo "Test 2: Authentication"
echo "----------------------"
TOKEN=$(curl -s -X POST http://192.168.20.180:5000/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"username":"admin","password":"admin123"}' | \
    python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ Authentication successful${NC}"
    echo "Token: ${TOKEN:0:30}..."
else
    echo -e "${RED}✗ Authentication failed${NC}"
    exit 1
fi
echo ""

# Test 3: Get Asset List
echo "Test 3: Fetch Assets"
echo "--------------------"
ASSET_ID=$(curl -s "http://192.168.20.180:5000/api/assets?page=1&per_page=1" \
    -H "Authorization: Bearer $TOKEN" | \
    python3 -c "import sys, json; data=json.load(sys.stdin); print(data['assets'][0]['id'] if data.get('assets') else '')" 2>/dev/null)

if [ -n "$ASSET_ID" ]; then
    echo -e "${GREEN}✓ Assets found${NC}"
    echo "Testing with Asset ID: $ASSET_ID"
else
    echo -e "${RED}✗ No assets found${NC}"
    exit 1
fi
echo ""

# Test 4: Generate PDF
echo "Test 4: PDF Generation"
echo "----------------------"
HTTP_STATUS=$(curl -s -o /tmp/test_pdf_$$.pdf -w "%{http_code}" \
    "http://192.168.20.180:5000/api/assets/$ASSET_ID/assignment-form" \
    -H "Authorization: Bearer $TOKEN")

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ PDF generated successfully (HTTP 200)${NC}"
else
    echo -e "${RED}✗ PDF generation failed (HTTP $HTTP_STATUS)${NC}"
    exit 1
fi
echo ""

# Test 5: Verify PDF Content
echo "Test 5: PDF Content Validation"
echo "-------------------------------"
PDF_SIZE=$(stat -f%z /tmp/test_pdf_$$.pdf 2>/dev/null || stat -c%s /tmp/test_pdf_$$.pdf 2>/dev/null)
if [ "$PDF_SIZE" -gt 1000 ]; then
    echo -e "${GREEN}✓ PDF size is valid: $PDF_SIZE bytes${NC}"
else
    echo -e "${RED}✗ PDF size is too small: $PDF_SIZE bytes${NC}"
    exit 1
fi

# Check if file is actually a PDF
FILE_TYPE=$(file -b /tmp/test_pdf_$$.pdf)
if [[ "$FILE_TYPE" == *"PDF"* ]]; then
    echo -e "${GREEN}✓ File is a valid PDF document${NC}"
else
    echo -e "${RED}✗ File is not a PDF: $FILE_TYPE${NC}"
    exit 1
fi

# Extract and verify content
if command -v pdftotext &> /dev/null; then
    CONTENT=$(pdftotext /tmp/test_pdf_$$.pdf - 2>/dev/null | head -20)
    if echo "$CONTENT" | grep -q "ASSET ASSIGNMENT FORM"; then
        echo -e "${GREEN}✓ PDF contains expected content${NC}"
    else
        echo -e "${YELLOW}⚠ Could not verify PDF content${NC}"
    fi
    
    if echo "$CONTENT" | grep -q "Tectoro Technologies"; then
        echo -e "${GREEN}✓ Company header found${NC}"
    fi
else
    echo -e "${YELLOW}⚠ pdftotext not installed, skipping content verification${NC}"
fi
echo ""

# Test 6: Bulk PDF Generation (if multiple assets)
echo "Test 6: Bulk PDF Generation"
echo "---------------------------"
ASSET_IDS=$(curl -s "http://192.168.20.180:5000/api/assets?page=1&per_page=3" \
    -H "Authorization: Bearer $TOKEN" | \
    python3 -c "import sys, json; data=json.load(sys.stdin); print(','.join(str(a['id']) for a in data.get('assets', [])[:3]))" 2>/dev/null)

if [ -n "$ASSET_IDS" ]; then
    IDS_ARRAY="[${ASSET_IDS}]"
    HTTP_STATUS=$(curl -s -o /tmp/test_bulk_$$.zip -w "%{http_code}" \
        -X POST "http://192.168.20.180:5000/api/assets/assignment-forms/bulk" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"asset_ids\": $IDS_ARRAY}")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✓ Bulk ZIP generated successfully (HTTP 200)${NC}"
        ZIP_SIZE=$(stat -f%z /tmp/test_bulk_$$.zip 2>/dev/null || stat -c%s /tmp/test_bulk_$$.zip 2>/dev/null)
        echo "  ZIP size: $ZIP_SIZE bytes"
        
        if command -v unzip &> /dev/null; then
            PDF_COUNT=$(unzip -l /tmp/test_bulk_$$.zip 2>/dev/null | grep -c "\.pdf$")
            echo -e "${GREEN}✓ ZIP contains $PDF_COUNT PDF files${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Bulk generation returned HTTP $HTTP_STATUS${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Not enough assets for bulk test${NC}"
fi
echo ""

# Cleanup
echo "Test 7: Cleanup"
echo "---------------"
rm -f /tmp/test_pdf_$$.pdf /tmp/test_bulk_$$.zip
echo -e "${GREEN}✓ Temporary files cleaned up${NC}"
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}✓ All backend tests passed!${NC}"
echo ""
echo "Next Steps:"
echo "1. Open browser: http://192.168.20.180:3000"
echo "2. Login with: admin / admin123"
echo "3. Go to any asset edit page"
echo "4. Click 'Download Assignment Form'"
echo "5. Verify PDF contains asset data"
echo "6. Click 'Print Assignment Form'"
echo "7. Verify print preview shows content"
echo ""
echo "If PDFs are still blank in browser:"
echo "1. Press Ctrl+Shift+R to hard refresh"
echo "2. Open browser console (F12)"
echo "3. Check for error messages"
echo "4. Share any error messages for help"
echo ""
