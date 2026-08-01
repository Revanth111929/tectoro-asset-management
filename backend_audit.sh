#!/bin/bash
# Focused Backend Audit Script
# Tests critical backend functionality

API="http://192.168.20.180:3000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

echo "🔍 BACKEND AUDIT STARTING..."
echo ""

# Get token
echo "→ Authenticating..."
TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ CRITICAL: Authentication failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Authentication successful${NC}"
echo ""

# Test function
test() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expect="$4"
    local data="$5"
    
    echo -n "→ $name ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API$endpoint" -H "Authorization: Bearer $TOKEN")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$API$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$code" = "$expect" ]; then
        echo -e "${GREEN}✓${NC} (HTTP $code)"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}✗${NC} (Expected $expect, got $code)"
        echo "  Response: ${body:0:100}"
        FAIL=$((FAIL + 1))
    fi
}

echo "══════════════════════════════════════════"
echo "1. AUTHENTICATION & AUTHORIZATION"
echo "══════════════════════════════════════════"
test "Login with valid credentials" "POST" "/auth/login" "200" '{"username":"admin","password":"admin123"}'
test "Login with invalid credentials" "POST" "/auth/login" "401" '{"username":"admin","password":"wrong"}'
test "Access protected endpoint" "GET" "/users" "200"
test "Access without token" "GET" "/users" "401"
echo ""

echo "══════════════════════════════════════════"
echo "2. ASSET OPERATIONS"
echo "══════════════════════════════════════════"
test "Get all assets" "GET" "/assets" "200"
test "Get single asset" "GET" "/assets/54" "200"
test "Get non-existent asset" "GET" "/assets/999999" "404"
test "Create asset without serial" "POST" "/assets" "400" '{"asset_name":"Test"}'
test "Create asset with duplicate serial" "POST" "/assets" "409" '{"asset_name":"Test","serial_number":"34JKX33sadads","category":"Laptop"}'
echo ""

echo "══════════════════════════════════════════"
echo "3. EMPLOYEE OPERATIONS"
echo "══════════════════════════════════════════"
test "Search employees" "GET" "/employees?q=Revanth" "200"
test "Get specific employee" "GET" "/employees/TT001" "200"
test "Get non-existent employee" "GET" "/employees/INVALID999" "404"
test "Get employee assets" "GET" "/employees/TT001/assets" "200"
echo ""

echo "══════════════════════════════════════════"
echo "4. DASHBOARD & STATS"
echo "══════════════════════════════════════════"
test "Get dashboard stats" "GET" "/dashboard/stats" "200"
test "Get dashboard activity" "GET" "/dashboard/activity" "200"
echo ""

echo "══════════════════════════════════════════"
echo "5. AUDIT & REPORTS"
echo "══════════════════════════════════════════"
test "Get audit logs" "GET" "/audit-logs" "200"
test "Export CSV" "GET" "/reports/export/csv" "200"
echo ""

echo "══════════════════════════════════════════"
echo "6. NEW ENDPOINTS"
echo "══════════════════════════════════════════"
test "Get asset replacements" "GET" "/asset-replacements" "200"
test "Get employee exits" "GET" "/employee-exit" "200"
test "Get email config" "GET" "/email-config" "200"
echo ""

echo "══════════════════════════════════════════"
echo "7. SYSTEM HEALTH"
echo "══════════════════════════════════════════"
test "Health check" "GET" "/health" "200"
test "Version info" "GET" "/version" "200"
echo ""

echo "══════════════════════════════════════════"
echo " SUMMARY"
echo "══════════════════════════════════════════"
TOTAL=$((PASS + FAIL))
echo "Total: $TOTAL"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"

if [ $FAIL -eq 0 ]; then
    echo -e "\n${GREEN}✓✓✓ ALL TESTS PASSED ✓✓✓${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠ Some tests failed${NC}"
    exit 1
fi
