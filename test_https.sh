#!/bin/bash
#
# HTTPS Test Script
# Tests all critical endpoints over HTTPS
#

echo "========================================="
echo "HTTPS Test Suite"
echo "========================================="
echo ""

BASE_URL="https://192.168.20.180"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counter
PASSED=0
FAILED=0

test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"

    echo -n "Testing $name... "

    response=$(curl -k -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)

    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $response)"
        ((FAILED++))
    fi
}

echo "1. HTTP → HTTPS Redirect Tests"
echo "================================"
test_endpoint "HTTP redirect" "http://192.168.20.180/" "301"
test_endpoint "HTTP API redirect" "http://192.168.20.180/api/health" "301"

echo ""
echo "2. HTTPS Endpoint Tests"
echo "======================="
test_endpoint "HTTPS homepage" "$BASE_URL/" "200"
test_endpoint "Health check" "$BASE_URL/api/health" "200"
test_endpoint "Login page" "$BASE_URL/login" "200"

echo ""
echo "3. SSL Certificate Test"
echo "======================="
echo -n "Checking certificate... "
cert_info=$(echo | openssl s_client -connect 192.168.20.180:443 -servername 192.168.20.180 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ VALID${NC}"
    echo "$cert_info" | sed 's/^/  /'
    ((PASSED++))
else
    echo -e "${RED}✗ INVALID${NC}"
    ((FAILED++))
fi

echo ""
echo "4. Service Status"
echo "================="
echo -n "Backend API... "
if systemctl is-active --quiet asset-management-api.service; then
    echo -e "${GREEN}✓ RUNNING${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ STOPPED${NC}"
    ((FAILED++))
fi

echo -n "Nginx... "
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ RUNNING${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ STOPPED${NC}"
    ((FAILED++))
fi

echo ""
echo "5. Port Status"
echo "=============="
echo "Listening ports:"
ss -tlnp 2>/dev/null | grep -E ':(80|443|5000)' | awk '{print "  " $4}'

echo ""
echo "========================================="
echo "Test Results: $PASSED passed, $FAILED failed"
echo "========================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
