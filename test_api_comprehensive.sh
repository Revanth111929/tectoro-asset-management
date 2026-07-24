#!/bin/bash
# Comprehensive API Testing Script
# Tests all major endpoints and features

API_URL="http://192.168.20.180:5000/api"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "   TECTORO API COMPREHENSIVE TEST"
echo "=========================================="
echo ""

# Test counter
PASS=0
FAIL=0

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local headers="$4"
    local data="$5"
    local expected_code="${6:-200}"
    
    echo -n "Testing: $name ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL$endpoint" $headers)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$endpoint" $headers -d "$data")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL$endpoint" $headers -d "$data")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL$endpoint" $headers)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, got $http_code)"
        echo "  Response: $body"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

echo "============================================"
echo "1. HEALTH & VERSION CHECKS"
echo "============================================"

test_endpoint "Health Check" "GET" "/health" "" "" 200
test_endpoint "Version Info" "GET" "/version" "" "" 200

echo ""
echo "============================================"
echo "2. AUTHENTICATION TESTS"
echo "============================================"

# Test login
echo -n "Testing: Login with valid credentials ... "
login_response=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo "$login_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('access_token', ''))" 2>/dev/null)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASS=$((PASS + 1))
    AUTH_HEADER="-H 'Authorization: Bearer $TOKEN'"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "  Could not obtain JWT token"
    FAIL=$((FAIL + 1))
    exit 1
fi

# Test invalid login
test_endpoint "Login with invalid credentials" "POST" "/auth/login" \
  "-H 'Content-Type: application/json'" \
  '{"username":"admin","password":"wrongpass"}' 401

# Test protected endpoint without token
test_endpoint "Protected endpoint without token" "GET" "/users" "" "" 401

# Test with valid token
test_endpoint "Protected endpoint with token" "GET" "/users" \
  "-H 'Authorization: Bearer $TOKEN'" "" 200

echo ""
echo "============================================"
echo "3. ASSET MANAGEMENT TESTS"
echo "============================================"

test_endpoint "Get all assets" "GET" "/assets" \
  "-H 'Authorization: Bearer $TOKEN'" "" 200

test_endpoint "Get dashboard stats" "GET" "/dashboard/stats" \
  "-H 'Authorization: Bearer $TOKEN'" "" 200

test_endpoint "Get expiring warranties" "GET" "/assets/warranty/expiring?days=90" \
  "-H 'Authorization: Bearer $TOKEN'" "" 200

echo ""
echo "============================================"
echo "4. EMPLOYEE MANAGEMENT TESTS"
echo "============================================"

test_endpoint "Search employees" "GET" "/employees?q=Revanth" \
  "-H 'Authorization: Bearer $TOKEN'" "" 200

echo ""
echo "============================================"
echo "5. ONBOARDING TESTS"
echo "============================================"

test_endpoint "Get onboarding list" "GET" "/onboarding" \
  "-H 'Authorization: Bearer $TOKEN'" "" 200

test_endpoint "Get available assets for onboarding" "GET" "/onboarding/available-assets" \
  "-H 'Authorization: Bearer $TOKEN'" "" 200

echo ""
echo "============================================"
echo "6. TEMPORARY ASSIGNMENTS TESTS"
echo "============================================"

test_endpoint "Get temporary assignments" "GET" "/temporary-assignments" \
  "-H 'Authorization: Bearer $TOKEN'" "" 200

echo ""
echo "============================================"
echo "7. ASSET REPLACEMENTS TESTS"
echo "============================================"

test_endpoint "Get asset replacements" "GET" "/asset-replacements" \
  "-H 'Authorization: Bearer $TOKEN'" "" 200

echo ""
echo "============================================"
echo "8. ACTIVITY & AUDIT LOGS"
echo "============================================"

test_endpoint "Get activity logs" "GET" "/activity-log" \
  "-H 'Authorization: Bearer $TOKEN'" "" 200

test_endpoint "Get audit logs" "GET" "/audit-log" \
  "-H 'Authorization: Bearer $TOKEN'" "" 200

echo ""
echo "============================================"
echo "9. EMPLOYEE EXIT PROCESS"
echo "============================================"

test_endpoint "Get employee exits" "GET" "/employee-exit" \
  "-H 'Authorization: Bearer $TOKEN'" "" 200

echo ""
echo "============================================"
echo "10. REPORT EXPORTS"
echo "============================================"

test_endpoint "Export CSV report" "GET" "/reports/export/csv" \
  "-H 'Authorization: Bearer $TOKEN'" "" 200

test_endpoint "Export Excel report" "GET" "/reports/export/excel" \
  "-H 'Authorization: Bearer $TOKEN'" "" 200

echo ""
echo "============================================"
echo "11. EMAIL CONFIGURATION"
echo "============================================"

test_endpoint "Get email config" "GET" "/email-config" \
  "-H 'Authorization: Bearer $TOKEN'" "" 200

echo ""
echo "============================================"
echo "12. RATE LIMITING TEST"
echo "============================================"

echo -n "Testing: Rate limiting on login endpoint ... "
fail_count=0
for i in {1..10}; do
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"username":"admin","password":"wrong"}')
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "429" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Rate limit triggered at attempt $i)"
        PASS=$((PASS + 1))
        break
    fi
    
    if [ $i -eq 10 ]; then
        echo -e "${YELLOW}⚠ WARNING${NC} (Rate limit not triggered after 10 attempts)"
        FAIL=$((FAIL + 1))
    fi
done

echo ""
echo "============================================"
echo "   TEST SUMMARY"
echo "============================================"
echo -e "Total Tests: $((PASS + FAIL))"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi
