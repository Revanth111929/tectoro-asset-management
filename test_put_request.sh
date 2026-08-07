#!/bin/bash

echo "======================================================================================================"
echo "TESTING PUT /api/employees/RG025"
echo "======================================================================================================"

# Step 1: Login and get token
echo -e "\n[STEP 1] LOGIN"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

echo "Login Response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed completely"
    exit 1
fi

echo "✓ Token obtained: ${TOKEN:0:50}..."

# Step 2: Get current employee
echo -e "\n[STEP 2] GET CURRENT EMPLOYEE STATUS"
echo "GET http://localhost:3000/api/employees/RG025"

CURRENT=$(curl -s -X GET http://localhost:3000/api/employees/RG025 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$CURRENT" | python3 -m json.tool

CURRENT_STATUS=$(echo "$CURRENT" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
echo -e "\n✓ Current Status: $CURRENT_STATUS"

# Step 3: Attempt PUT update
echo -e "\n[STEP 3] ATTEMPT UPDATE WITH PUT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

NEW_STATUS="Inactive"
if [ "$CURRENT_STATUS" == "Inactive" ]; then
    NEW_STATUS="Active"
fi

PAYLOAD='{
  "emp_id": "RG025",
  "employee_name": "Test Employee",
  "email": "test@company.com",
  "mobile_number": "1234567890",
  "designation": "Engineer",
  "department": "IT",
  "team": "Backend",
  "project": "Asset Management",
  "manager": "Manager Name",
  "microsoft_license": "E3",
  "location": "Office",
  "status": "'$NEW_STATUS'",
  "is_active": true
}'

echo "1. REQUEST URL: PUT http://localhost:3000/api/employees/RG025"
echo "2. HTTP METHOD: PUT"
echo "3. REQUEST BODY:"
echo "$PAYLOAD" | python3 -m json.tool
echo ""
echo "4. SENDING REQUEST..."

PUT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PUT http://localhost:3000/api/employees/RG025 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

RESPONSE_BODY=$(echo "$PUT_RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
HTTP_STATUS=$(echo "$PUT_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo "5. RESPONSE STATUS CODE: $HTTP_STATUS"
echo "6. RESPONSE BODY:"
echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"

# Step 4: Check database
echo -e "\n[STEP 4] CHECK DATABASE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

python3 << 'PYEOF'
import sqlite3
conn = sqlite3.connect('databases/local_assets.db')
cursor = conn.cursor()
cursor.execute("SELECT emp_id, employee_name, status, updated_at FROM employees WHERE emp_id='RG025'")
result = cursor.fetchone()
if result:
    print(f"Database Result:")
    print(f"  emp_id:        {result[0]}")
    print(f"  employee_name: {result[1]}")
    print(f"  status:        {result[2]}")
    print(f"  updated_at:    {result[3]}")
else:
    print("❌ Employee not found")
conn.close()
PYEOF

# Step 5: GET again
echo -e "\n[STEP 5] GET EMPLOYEE AGAIN (after PUT)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

AFTER=$(curl -s -X GET http://localhost:3000/api/employees/RG025 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$AFTER" | python3 -m json.tool

AFTER_STATUS=$(echo "$AFTER" | grep -o '"status":"[^"]*' | cut -d'"' -f4)

# Step 6: Search endpoint
echo -e "\n[STEP 6] SEARCH ENDPOINT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SEARCH=$(curl -s -X GET "http://localhost:3000/api/employees?q=RG025" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$SEARCH" | python3 -m json.tool

# Analysis
echo -e "\n======================================================================================================"
echo "DIAGNOSIS"
echo "======================================================================================================"

echo ""
echo "ATTEMPTED CHANGE: $CURRENT_STATUS → $NEW_STATUS"
echo "PUT STATUS CODE:  $HTTP_STATUS"
echo "STATUS AFTER GET: $AFTER_STATUS"

if [ "$HTTP_STATUS" == "404" ]; then
    echo ""
    echo "❌ ROOT CAUSE: 404 NOT FOUND"
    echo "   The route PUT /api/employees/RG025 does NOT exist"
    echo "   Request never reached backend handler"
elif [ "$HTTP_STATUS" == "405" ]; then
    echo ""
    echo "❌ ROOT CAUSE: 405 METHOD NOT ALLOWED"
    echo "   The route exists but does not accept PUT method"
    echo "   Request rejected at routing layer"
elif [ "$HTTP_STATUS" == "200" ]; then
    if [ "$AFTER_STATUS" == "$NEW_STATUS" ]; then
        echo ""
        echo "✅ UPDATE SUCCESSFUL"
    else
        echo ""
        echo "⚠️ Request succeeded but status not updated"
        echo "   Problem in backend handler"
    fi
else
    echo ""
    echo "⚠️ Unexpected status code: $HTTP_STATUS"
fi

echo ""
echo "======================================================================================================"
