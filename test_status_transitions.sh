#!/bin/bash

echo "======================================================================================================"
echo "TESTING ALL EMPLOYEE STATUS TRANSITIONS"
echo "======================================================================================================"

# Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed"
    exit 1
fi

echo "✓ Logged in successfully"

headers="-H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json'"

TEST_EMP_ID="RG025"

# Function to get current status
get_status() {
    curl -s -X GET "http://localhost:3000/api/employees/$TEST_EMP_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" | \
        python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('employee', {}).get('status', 'Unknown'))"
}

# Function to update status
update_status() {
    local new_status=$1
    
    # Get current employee data
    CURRENT=$(curl -s -X GET "http://localhost:3000/api/employees/$TEST_EMP_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")
    
    # Update with new status
    echo "$CURRENT" | python3 << PYEOF
import json
import sys
import requests

data = json.load(sys.stdin)
emp = data['employee']

emp['status'] = '$new_status'

response = requests.put(
    'http://localhost:3000/api/employees/$TEST_EMP_ID',
    headers={
        'Authorization': 'Bearer $TOKEN',
        'Content-Type': 'application/json'
    },
    json=emp
)

print(response.status_code)
PYEOF
}

# Function to verify in database
verify_db() {
    python3 << 'PYEOF'
import sqlite3
conn = sqlite3.connect('databases/local_assets.db')
cursor = conn.cursor()
cursor.execute("SELECT status FROM employees WHERE emp_id='RG025'")
result = cursor.fetchone()
print(result[0] if result else "NOT FOUND")
conn.close()
PYEOF
}

echo ""
echo "======================================================================================================"
echo "TEST 1: Active → Inactive"
echo "======================================================================================================"

INITIAL=$(get_status)
echo "Initial status: $INITIAL"

if [ "$INITIAL" != "Active" ]; then
    echo "Setting to Active first..."
    update_status "Active"
    sleep 1
fi

echo "Changing Active → Inactive..."
STATUS_CODE=$(update_status "Inactive")
echo "Response: $STATUS_CODE"

sleep 1

API_STATUS=$(get_status)
DB_STATUS=$(verify_db)

echo "API Status: $API_STATUS"
echo "DB Status:  $DB_STATUS"

if [ "$API_STATUS" == "Inactive" ] && [ "$DB_STATUS" == "Inactive" ]; then
    echo "✅ TEST 1 PASSED"
else
    echo "❌ TEST 1 FAILED"
fi

echo ""
echo "======================================================================================================"
echo "TEST 2: Inactive → Active"
echo "======================================================================================================"

echo "Changing Inactive → Active..."
STATUS_CODE=$(update_status "Active")
echo "Response: $STATUS_CODE"

sleep 1

API_STATUS=$(get_status)
DB_STATUS=$(verify_db)

echo "API Status: $API_STATUS"
echo "DB Status:  $DB_STATUS"

if [ "$API_STATUS" == "Active" ] && [ "$DB_STATUS" == "Active" ]; then
    echo "✅ TEST 2 PASSED"
else
    echo "❌ TEST 2 FAILED"
fi

echo ""
echo "======================================================================================================"
echo "TEST 3: Active → Exited"
echo "======================================================================================================"

echo "Changing Active → Exited..."
STATUS_CODE=$(update_status "Exited")
echo "Response: $STATUS_CODE"

sleep 1

API_STATUS=$(get_status)
DB_STATUS=$(verify_db)

echo "API Status: $API_STATUS"
echo "DB Status:  $DB_STATUS"

if [ "$API_STATUS" == "Exited" ] && [ "$DB_STATUS" == "Exited" ]; then
    echo "✅ TEST 3 PASSED"
else
    echo "❌ TEST 3 FAILED"
fi

echo ""
echo "======================================================================================================"
echo "TEST 4: Exited → Active"
echo "======================================================================================================"

echo "Changing Exited → Active..."
STATUS_CODE=$(update_status "Active")
echo "Response: $STATUS_CODE"

sleep 1

API_STATUS=$(get_status)
DB_STATUS=$(verify_db)

echo "API Status: $API_STATUS"
echo "DB Status:  $DB_STATUS"

if [ "$API_STATUS" == "Active" ] && [ "$DB_STATUS" == "Active" ]; then
    echo "✅ TEST 4 PASSED"
else
    echo "❌ TEST 4 FAILED"
fi

echo ""
echo "======================================================================================================"
echo "BACKEND STATUS UPDATE: ALL TESTS COMPLETE"
echo "======================================================================================================"
echo ""
echo "Next: Test in browser UI"
echo ""
echo "1. Open http://localhost:3000 in browser"
echo "2. Login as admin"
echo "3. Go to Employee Master"
echo "4. Find employee RG025"
echo "5. Click Edit"
echo "6. Change status and save"
echo "7. Verify Employee Master table shows updated status immediately"
echo ""
echo "Expected: Status badge updates WITHOUT page refresh"
echo "======================================================================================================"
