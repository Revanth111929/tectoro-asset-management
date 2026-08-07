#!/bin/bash

echo "======================================================================================================"
echo "EMPLOYEE STATUS FEATURE - COMPLETE END-TO-END TEST"
echo "======================================================================================================"

# Configuration
BASE_URL="http://localhost:3000/api"
TEST_EMP_ID="RG025"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Login
echo -e "\n${YELLOW}[STEP 1]${NC} Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Logged in successfully${NC}"

# Function to get current status from database
get_db_status() {
    python3 << 'PYEOF'
import sqlite3
conn = sqlite3.connect('databases/local_assets.db')
cursor = conn.cursor()
cursor.execute("SELECT status FROM employees WHERE emp_id='RG025'")
result = cursor.fetchone()
print(result[0] if result else "NOT_FOUND")
conn.close()
PYEOF
}

# Function to get status from API
get_api_status() {
    curl -s -X GET "$BASE_URL/employees/$TEST_EMP_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" | \
        python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('employee', {}).get('status', 'NOT_FOUND'))"
}

# Function to get status from list endpoint
get_list_status() {
    curl -s -X GET "$BASE_URL/employees?q=$TEST_EMP_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" | \
        python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['status'] if data else 'NOT_FOUND')"
}

# Function to update status using PUT
update_status() {
    local new_status=$1
    
    # Get current employee
    CURRENT=$(curl -s -X GET "$BASE_URL/employees/$TEST_EMP_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")
    
    # Update status
    RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PUT "$BASE_URL/employees/$TEST_EMP_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$(echo $CURRENT | python3 -c "
import sys, json
emp = json.load(sys.stdin)['employee']
emp['status'] = '$new_status'
print(json.dumps(emp))
")")
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
    echo "$HTTP_STATUS"
}

# Test transition function
test_transition() {
    local from_status=$1
    local to_status=$2
    local test_num=$3
    
    echo ""
    echo "======================================================================================================"
    echo -e "${YELLOW}[TEST $test_num]${NC} $from_status → $to_status"
    echo "======================================================================================================"
    
    # Get initial state
    INITIAL_DB=$(get_db_status)
    echo "Initial DB Status: $INITIAL_DB"
    
    # Set to from_status if different
    if [ "$INITIAL_DB" != "$from_status" ]; then
        echo "Setting initial status to $from_status..."
        update_status "$from_status" > /dev/null
        sleep 0.5
    fi
    
    # Perform update
    echo -e "\n${YELLOW}Updating:${NC} $from_status → $to_status"
    HTTP_CODE=$(update_status "$to_status")
    echo "PUT Response Code: $HTTP_CODE"
    
    sleep 0.5
    
    # Verify all layers
    DB_STATUS=$(get_db_status)
    API_STATUS=$(get_api_status)
    LIST_STATUS=$(get_list_status)
    
    echo ""
    echo "Verification:"
    echo "  Database Status:     $DB_STATUS"
    echo "  GET /employees/{id}: $API_STATUS"
    echo "  GET /employees?q=:   $LIST_STATUS"
    
    # Check results
    local passed=true
    
    if [ "$HTTP_CODE" != "200" ]; then
        echo -e "${RED}  ✗ PUT request failed (HTTP $HTTP_CODE)${NC}"
        passed=false
    fi
    
    if [ "$DB_STATUS" != "$to_status" ]; then
        echo -e "${RED}  ✗ Database not updated (expected: $to_status, got: $DB_STATUS)${NC}"
        passed=false
    fi
    
    if [ "$API_STATUS" != "$to_status" ]; then
        echo -e "${RED}  ✗ GET API wrong status (expected: $to_status, got: $API_STATUS)${NC}"
        passed=false
    fi
    
    if [ "$LIST_STATUS" != "$to_status" ]; then
        echo -e "${RED}  ✗ List API wrong status (expected: $to_status, got: $LIST_STATUS)${NC}"
        passed=false
    fi
    
    if [ "$passed" = true ]; then
        echo -e "\n${GREEN}✅ TEST $test_num PASSED${NC}"
        return 0
    else
        echo -e "\n${RED}❌ TEST $test_num FAILED${NC}"
        return 1
    fi
}

# Run all transition tests
passed=0
failed=0

if test_transition "Active" "Inactive" 1; then ((passed++)); else ((failed++)); fi
if test_transition "Inactive" "Active" 2; then ((passed++)); else ((failed++)); fi
if test_transition "Active" "Exited" 3; then ((passed++)); else ((failed++)); fi
if test_transition "Exited" "Active" 4; then ((passed++)); else ((failed++)); fi

# Summary
echo ""
echo "======================================================================================================"
echo "TEST SUMMARY"
echo "======================================================================================================"
echo -e "${GREEN}Passed: $passed${NC}"
echo -e "${RED}Failed: $failed${NC}"

if [ $failed -eq 0 ]; then
    echo -e "\n${GREEN}✅ ALL BACKEND TESTS PASSED${NC}"
    echo ""
    echo "Next: Verify in Browser UI"
    echo "1. Open http://localhost:3000"
    echo "2. Login as admin"
    echo "3. Go to Employee Master"
    echo "4. Find employee $TEST_EMP_ID"
    echo "5. Click Edit"
    echo "6. Change status and save"
    echo "7. Verify badge updates immediately in Employee Master"
    echo "8. Refresh browser - status should persist"
    echo ""
    exit 0
else
    echo -e "\n${RED}❌ SOME TESTS FAILED${NC}"
    exit 1
fi
