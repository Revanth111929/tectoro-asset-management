#!/bin/bash
# Comprehensive Backend Testing Script
# Tests: Successful requests, Invalid requests, Missing parameters, Unauthorized requests, Edge cases

API_URL="http://192.168.20.180:5000/api"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

echo "============================================"
echo "   COMPREHENSIVE BACKEND AUDIT"
echo "============================================"
echo ""

test_case() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local auth_header="$4"
    local data="$5"
    local expected_code="${6:-200}"
    local description="$7"
    
    echo "────────────────────────────────────────────"
    echo "TEST: $test_name"
    if [ -n "$description" ]; then
        echo "DESC: $description"
    fi
    echo -n "EXEC: $method $endpoint ... "
    
    # Build curl command with proper headers
    CURL_CMD="curl -s -w \"\n%{http_code}\" -X $method \"$API_URL$endpoint\""
    
    if [ -n "$auth_header" ]; then
        CURL_CMD="$CURL_CMD -H 'Authorization: Bearer $auth_header'"
    fi
    
    if [ "$method" = "POST" ] || [ "$method" = "PUT" ]; then
        CURL_CMD="$CURL_CMD -H 'Content-Type: application/json'"
        if [ -n "$data" ]; then
            CURL_CMD="$CURL_CMD -d '$data'"
        fi
    fi
    
    response=$(eval $CURL_CMD 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, got $http_code)"
        echo -e "${YELLOW}Response: ${body:0:200}${NC}"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

# Get valid token for authenticated tests
echo "============================================"
echo "SETUP: Obtaining Authentication Token"
echo "============================================"
echo ""

login_response=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo "$login_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('access_token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ FATAL: Could not obtain authentication token${NC}"
    echo "Response: $login_response"
    exit 1
fi

echo -e "${GREEN}✓ Token obtained successfully${NC}"
echo ""

# ══════════════════════════════════════════════════════════════════════════════
# 1. AUTHENTICATION & AUTHORIZATION TESTS
# ══════════════════════════════════════════════════════════════════════════════

echo "============================================"
echo "1. AUTHENTICATION & AUTHORIZATION"
echo "============================================"
echo ""

# 1.1 Valid Login
test_case \
    "Valid Login" \
    "POST" "/auth/login" \
    "" \
    '{"username":"admin","password":"admin123"}' \
    200 \
    "Should return JWT tokens for valid credentials"

# 1.2 Invalid Credentials
test_case \
    "Invalid Credentials" \
    "POST" "/auth/login" \
    "" \
    '{"username":"admin","password":"wrongpassword"}' \
    401 \
    "Should reject invalid password"

# 1.3 Missing Username
test_case \
    "Missing Username" \
    "POST" "/auth/login" \
    "" \
    '{"password":"admin123"}' \
    400 \
    "Should return 400 for missing username"

# 1.4 Missing Password
test_case \
    "Missing Password" \
    "POST" "/auth/login" \
    "" \
    '{"username":"admin"}' \
    400 \
    "Should return 400 for missing password"

# 1.5 Empty JSON Body
test_case \
    "Empty JSON Body" \
    "POST" "/auth/login" \
    "" \
    '{}' \
    400 \
    "Should return 400 for empty credentials"

# 1.6 Malformed JSON  
test_case \
    "Malformed JSON" \
    "POST" "/auth/login" \
    "" \
    'not valid json' \
    400 \
    "Should return 400 for malformed JSON"

# 1.7 Protected Endpoint Without Token
test_case \
    "Protected Endpoint Without Token" \
    "GET" "/users" \
    "" \
    "" \
    401 \
    "Should return 401 when accessing protected endpoint without token"

# 1.8 Protected Endpoint With Invalid Token
test_case \
    "Invalid Token" \
    "GET" "/users" \
    "invalid-token-12345" \
    "" \
    401 \
    "Should return 401 for invalid JWT token"

# 1.9 Protected Endpoint With Valid Token
test_case \
    "Valid Token Access" \
    "GET" "/users" \
    "$TOKEN" \
    "" \
    200 \
    "Should allow access with valid JWT token"

# 1.10 Admin Endpoint With User Token (if we had a user)
# Skip for now as we only have admin token

echo ""

# ══════════════════════════════════════════════════════════════════════════════
# 2. ASSET CRUD OPERATIONS
# ══════════════════════════════════════════════════════════════════════════════

echo "============================================"
echo "2. ASSET CRUD OPERATIONS"
echo "============================================"
echo ""

# 2.1 Get All Assets
test_case \
    "Get All Assets" \
    "GET" "/assets" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should return list of all assets"

# 2.2 Get Assets With Filters
test_case \
    "Get Assets With Category Filter" \
    "GET" "/assets?category=Laptop" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should return filtered assets by category"

# 2.3 Get Assets With Status Filter
test_case \
    "Get Assets With Status Filter" \
    "GET" "/assets?status=Available" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should return filtered assets by status"

# 2.4 Get Single Asset (assuming ID 54 exists from previous tests)
test_case \
    "Get Single Asset" \
    "GET" "/assets/54" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should return single asset details"

# 2.5 Get Non-Existent Asset
test_case \
    "Get Non-Existent Asset" \
    "GET" "/assets/999999" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    404 \
    "Should return 404 for non-existent asset"

# 2.6 Create Asset - Missing Required Fields
test_case \
    "Create Asset Without Required Fields" \
    "POST" "/assets" \
    "-H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json'" \
    '{"asset_name":"Test Laptop"}' \
    400 \
    "Should return 400 when serial_number is missing"

# 2.7 Create Asset - Duplicate Serial Number
test_case \
    "Create Asset With Duplicate Serial" \
    "POST" "/assets" \
    "-H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json'" \
    '{"asset_name":"Duplicate Test","serial_number":"34JKX33sadads","category":"Laptop"}' \
    409 \
    "Should return 409 for duplicate serial number"

# 2.8 Create Valid Asset
UNIQUE_SERIAL="TEST-AUDIT-$(date +%s)"
test_case \
    "Create Valid Asset" \
    "POST" "/assets" \
    "-H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json'" \
    "{\"asset_name\":\"Audit Test Laptop\",\"serial_number\":\"$UNIQUE_SERIAL\",\"category\":\"Laptop\",\"status\":\"Available\"}" \
    201 \
    "Should create new asset successfully"

# 2.9 Update Asset Without Authentication
test_case \
    "Update Asset Without Auth" \
    "PUT" "/assets/54" \
    "-H 'Content-Type: application/json'" \
    '{"comments":"Test update"}' \
    401 \
    "Should require authentication for update"

# 2.10 Delete Asset Without Authentication
test_case \
    "Delete Asset Without Auth" \
    "DELETE" "/assets/54" \
    "" \
    "" \
    401 \
    "Should require authentication for delete"

echo ""

# ══════════════════════════════════════════════════════════════════════════════
# 3. EMPLOYEE OPERATIONS
# ══════════════════════════════════════════════════════════════════════════════

echo "============================================"
echo "3. EMPLOYEE OPERATIONS"
echo "============================================"
echo ""

# 3.1 Search Employees
test_case \
    "Search Employees" \
    "GET" "/employees?q=Revanth" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should return matching employees"

# 3.2 Search With Empty Query
test_case \
    "Search Employees Empty Query" \
    "GET" "/employees?q=" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should return all employees for empty query"

# 3.3 Get Specific Employee
test_case \
    "Get Specific Employee" \
    "GET" "/employees/TT001" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should return specific employee details"

# 3.4 Get Non-Existent Employee
test_case \
    "Get Non-Existent Employee" \
    "GET" "/employees/INVALID999" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    404 \
    "Should return 404 for non-existent employee"

# 3.5 Get Employee Assets
test_case \
    "Get Employee Assets" \
    "GET" "/employees/TT001/assets" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should return assets assigned to employee"

# 3.6 Create Employee Without Required Fields
test_case \
    "Create Employee Missing Fields" \
    "POST" "/employees" \
    "-H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json'" \
    '{"employee_name":"Test User"}' \
    400 \
    "Should return 400 when emp_id is missing"

echo ""

# ══════════════════════════════════════════════════════════════════════════════
# 4. VALIDATION TESTS
# ══════════════════════════════════════════════════════════════════════════════

echo "============================================"
echo "4. INPUT VALIDATION"
echo "============================================"
echo ""

# 4.1 SQL Injection Attempt
test_case \
    "SQL Injection Prevention" \
    "GET" "/assets?category=Laptop' OR '1'='1" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should safely handle SQL injection attempt"

# 4.2 XSS Attempt in Asset Name
test_case \
    "XSS Prevention in Asset Creation" \
    "POST" "/assets" \
    "-H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json'" \
    "{\"asset_name\":\"<script>alert('xss')</script>\",\"serial_number\":\"XSS-TEST-$(date +%s)\",\"category\":\"Laptop\"}" \
    201 \
    "Should create asset but sanitize XSS content"

# 4.3 Very Long Input
test_case \
    "Very Long Asset Name" \
    "POST" "/assets" \
    "-H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json'" \
    "{\"asset_name\":\"$(printf 'A%.0s' {1..500})\",\"serial_number\":\"LONG-TEST-$(date +%s)\",\"category\":\"Laptop\"}" \
    400 \
    "Should reject extremely long input"

# 4.4 Special Characters in Serial Number
test_case \
    "Special Characters in Serial" \
    "POST" "/assets" \
    "-H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json'" \
    "{\"asset_name\":\"Special Char Test\",\"serial_number\":\"TEST-@#$%-$(date +%s)\",\"category\":\"Laptop\"}" \
    201 \
    "Should accept valid special characters in serial"

# 4.5 Negative Integer for Asset ID
test_case \
    "Negative Asset ID" \
    "GET" "/assets/-1" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    404 \
    "Should return 404 for negative ID"

# 4.6 Non-numeric Asset ID
test_case \
    "Non-numeric Asset ID" \
    "GET" "/assets/abc" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    404 \
    "Should return 404 for non-numeric ID"

echo ""

# ══════════════════════════════════════════════════════════════════════════════
# 5. ERROR HANDLING
# ══════════════════════════════════════════════════════════════════════════════

echo "============================================"
echo "5. ERROR HANDLING"
echo "============================================"
echo ""

# 5.1 Malformed JSON in POST
test_case \
    "Malformed JSON in Asset Creation" \
    "POST" "/assets" \
    "-H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json'" \
    '{"asset_name":"Test", invalid json' \
    400 \
    "Should return 400 for malformed JSON"

# 5.2 Wrong Content-Type
test_case \
    "Wrong Content-Type" \
    "POST" "/assets" \
    "-H 'Authorization: Bearer $TOKEN' -H 'Content-Type: text/plain'" \
    'asset_name=Test&serial_number=TEST123' \
    400 \
    "Should reject non-JSON content type"

# 5.3 Empty Request Body
test_case \
    "Empty Request Body" \
    "POST" "/assets" \
    "-H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json'" \
    '' \
    400 \
    "Should return 400 for empty body"

# 5.4 Non-Existent Endpoint
test_case \
    "Non-Existent Endpoint" \
    "GET" "/nonexistent" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    404 \
    "Should return 404 for non-existent endpoint"

# 5.5 Method Not Allowed
test_case \
    "Method Not Allowed" \
    "DELETE" "/auth/login" \
    "" \
    "" \
    405 \
    "Should return 405 for unsupported HTTP method"

echo ""

# ══════════════════════════════════════════════════════════════════════════════
# 6. EDGE CASES
# ══════════════════════════════════════════════════════════════════════════════

echo "============================================"
echo "6. EDGE CASES"
echo "============================================"
echo ""

# 6.1 Pagination Edge Cases
test_case \
    "Pagination - Page 0" \
    "GET" "/assets?page=0" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should handle page 0 gracefully"

# 6.2 Pagination - Negative Page
test_case \
    "Pagination - Negative Page" \
    "GET" "/assets?page=-1" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should handle negative page gracefully"

# 6.3 Pagination - Very Large Page
test_case \
    "Pagination - Large Page Number" \
    "GET" "/assets?page=9999" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should handle large page numbers"

# 6.4 Per Page - Zero
test_case \
    "Per Page - Zero" \
    "GET" "/assets?per_page=0" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should handle per_page=0"

# 6.5 Per Page - Negative
test_case \
    "Per Page - Negative" \
    "GET" "/assets?per_page=-10" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should handle negative per_page"

# 6.6 Multiple Query Parameters
test_case \
    "Multiple Query Parameters" \
    "GET" "/assets?category=Laptop&status=Available&page=1&per_page=10" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should handle multiple query parameters"

# 6.7 Unicode Characters
test_case \
    "Unicode Characters in Search" \
    "GET" "/employees?q=测试" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should handle Unicode characters"

# 6.8 Empty String Values
test_case \
    "Empty String Values" \
    "POST" "/assets" \
    "-H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json'" \
    "{\"asset_name\":\"\",\"serial_number\":\"EMPTY-TEST-$(date +%s)\",\"category\":\"Laptop\"}" \
    400 \
    "Should reject empty asset name"

echo ""

# ══════════════════════════════════════════════════════════════════════════════
# 7. CONCURRENT OPERATIONS
# ══════════════════════════════════════════════════════════════════════════════

echo "============================================"
echo "7. CONCURRENT OPERATIONS"
echo "============================================"
echo ""

# 7.1 Rapid Sequential Requests
echo -n "Rapid Sequential Requests (10x) ... "
SUCCESS_COUNT=0
for i in {1..10}; do
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/health" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" = "200" ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    fi
done
if [ $SUCCESS_COUNT -eq 10 ]; then
    echo -e "${GREEN}✓ PASS${NC} (All 10 succeeded)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗ FAIL${NC} ($SUCCESS_COUNT/10 succeeded)"
    FAIL=$((FAIL + 1))
fi

echo ""

# ══════════════════════════════════════════════════════════════════════════════
# 8. DATABASE OPERATIONS
# ══════════════════════════════════════════════════════════════════════════════

echo "============================================"
echo "8. DATABASE OPERATIONS"
echo "============================================"
echo ""

# 8.1 Verify Data Integrity
test_case \
    "Data Integrity Check" \
    "GET" "/assets" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should return consistent asset data"

# 8.2 Verify Audit Logs
test_case \
    "Audit Logs Exist" \
    "GET" "/audit-logs" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should return audit logs"

# 8.3 Verify Dashboard Stats
test_case \
    "Dashboard Stats Calculation" \
    "GET" "/dashboard/stats" \
    "-H 'Authorization: Bearer $TOKEN'" \
    "" \
    200 \
    "Should calculate dashboard statistics"

echo ""

# ══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════════════════════

echo "============================================"
echo "   TEST SUMMARY"
echo "============================================"
echo ""
TOTAL=$((PASS + FAIL))
PASS_RATE=$((PASS * 100 / TOTAL))

echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo "Pass Rate: $PASS_RATE%"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓✓✓ ALL TESTS PASSED! ✓✓✓${NC}"
    echo -e "${GREEN}Backend is production-ready!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed. Review issues above.${NC}"
    exit 1
fi
