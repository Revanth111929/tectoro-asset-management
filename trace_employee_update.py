#!/usr/bin/env python3
"""
LIVE TRACE: Employee Status Update
NO ASSUMPTIONS - CAPTURE ACTUAL BEHAVIOR
"""

import requests
import json
import sqlite3
import os

BASE_URL = "http://localhost:3000/api"
TEST_EMP_ID = "RG025"

print("=" * 100)
print("EMPLOYEE STATUS UPDATE - LIVE TRACE")
print("=" * 100)

# Step 1: Login
print("\n[STEP 1] LOGIN")
login_resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin"})
print(f"Status: {login_resp.status_code}")

if login_resp.status_code != 200:
    print("❌ LOGIN FAILED")
    exit(1)

token = login_resp.json().get('token')
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
print(f"✓ Token: {token[:30]}...")

# Step 2: Get current status
print(f"\n[STEP 2] GET CURRENT STATUS: /api/employees/{TEST_EMP_ID}")
get_resp = requests.get(f"{BASE_URL}/employees/{TEST_EMP_ID}", headers=headers)
print(f"Status: {get_resp.status_code}")
print(f"Response: {json.dumps(get_resp.json(), indent=2)}")

current_employee = get_resp.json().get('employee', {})
current_status = current_employee.get('status', 'Unknown')
print(f"\n✓ CURRENT STATUS IN DATABASE: {current_status}")

# Step 3: Prepare update payload (toggle status)
new_status = "Inactive" if current_status == "Active" else "Active"

update_payload = {
    "emp_id": current_employee.get('emp_id'),
    "employee_name": current_employee.get('employee_name'),
    "email": current_employee.get('email'),
    "mobile_number": current_employee.get('mobile_number'),
    "designation": current_employee.get('designation'),
    "department": current_employee.get('department'),
    "team": current_employee.get('team'),
    "project": current_employee.get('project'),
    "manager": current_employee.get('manager'),
    "microsoft_license": current_employee.get('microsoft_license'),
    "location": current_employee.get('location'),
    "status": new_status,  # ← CHANGING THIS
    "is_active": current_employee.get('is_active', True)
}

print(f"\n[STEP 3] ATTEMPTING STATUS CHANGE: {current_status} → {new_status}")

# Step 4: ATTEMPT UPDATE WITH PUT (what frontend does)
print(f"\n[STEP 4] SEND UPDATE REQUEST")
print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print(f"1. REQUEST URL: PUT {BASE_URL}/employees/{TEST_EMP_ID}")
print(f"2. HTTP METHOD: PUT")
print(f"3. REQUEST BODY:")
print(json.dumps(update_payload, indent=2))

put_resp = requests.put(
    f"{BASE_URL}/employees/{TEST_EMP_ID}",
    headers=headers,
    json=update_payload
)

print(f"\n4. RESPONSE STATUS CODE: {put_resp.status_code}")
print(f"5. RESPONSE BODY:")
try:
    print(json.dumps(put_resp.json(), indent=2))
except:
    print(f"   Raw: {put_resp.text}")

# Step 5: Check database IMMEDIATELY
print(f"\n[STEP 5] QUERY DATABASE IMMEDIATELY AFTER PUT")
print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'assets.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

query = f"SELECT emp_id, employee_name, status, updated_at FROM employees WHERE emp_id='{TEST_EMP_ID}'"
print(f"SQL: {query}")

cursor.execute(query)
result = cursor.fetchone()

if result:
    print(f"\nDATABASE RESULT:")
    print(f"  emp_id:       {result[0]}")
    print(f"  employee_name: {result[1]}")
    print(f"  status:       {result[2]}")
    print(f"  updated_at:   {result[3]}")
    db_status = result[2]
else:
    print("❌ Employee not found in database")
    db_status = None

conn.close()

# Step 6: GET via API immediately
print(f"\n[STEP 6] GET /api/employees/{TEST_EMP_ID} (immediately after update)")
print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

get_after = requests.get(f"{BASE_URL}/employees/{TEST_EMP_ID}", headers=headers)
print(f"Status: {get_after.status_code}")
print(f"Response: {json.dumps(get_after.json(), indent=2)}")

api_status = get_after.json().get('employee', {}).get('status')

# Step 7: Search endpoint
print(f"\n[STEP 7] GET /api/employees?q={TEST_EMP_ID} (search endpoint)")
print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

search_resp = requests.get(f"{BASE_URL}/employees", headers=headers, params={"q": TEST_EMP_ID})
print(f"Status: {search_resp.status_code}")
print(f"Response: {json.dumps(search_resp.json(), indent=2)}")

search_results = search_resp.json()
search_status = None
if search_results and len(search_results) > 0:
    search_status = search_results[0].get('status')

# ANALYSIS
print("\n" + "=" * 100)
print("TRACE ANALYSIS")
print("=" * 100)

print(f"\n1. FRONTEND SENT:        status = '{new_status}'")
print(f"2. PUT REQUEST STATUS:   {put_resp.status_code}")

if put_resp.status_code == 404:
    print("   ❌ FAILURE AT ROUTING LAYER - Route does not exist")
elif put_resp.status_code == 405:
    print("   ❌ FAILURE AT ROUTING LAYER - Method not allowed")
elif put_resp.status_code >= 400:
    print(f"   ❌ FAILURE AT BACKEND - Error response")
else:
    print(f"   ✓ Request accepted by backend")

print(f"\n3. DATABASE STATUS:      '{db_status}'")
print(f"4. GET API STATUS:       '{api_status}'")
print(f"5. SEARCH API STATUS:    '{search_status}'")

print("\n" + "=" * 100)
print("DIAGNOSIS")
print("=" * 100)

if put_resp.status_code in [404, 405]:
    print(f"\n❌ ROOT CAUSE: ROUTING LAYER FAILURE")
    print(f"   The PUT /api/employees/{TEST_EMP_ID} endpoint does NOT exist")
    print(f"   Request never reached any handler")
    print(f"   Database was never updated")
    
elif db_status == new_status:
    if api_status == new_status:
        print(f"\n✅ UPDATE SUCCESSFUL")
        print(f"   Database: {current_status} → {new_status}")
        print(f"   API returns correct status")
    else:
        print(f"\n⚠️ DATABASE UPDATED but API RETURNS WRONG VALUE")
        print(f"   Database shows: {new_status}")
        print(f"   API returns: {api_status}")
        print(f"   Problem in API handler or model serialization")
        
elif db_status == current_status:
    print(f"\n❌ DATABASE NOT UPDATED")
    print(f"   Status remains: {current_status}")
    print(f"   Backend handler may have:")
    print(f"   - Not received the status field")
    print(f"   - Not updated the field")
    print(f"   - Not committed the transaction")
    
else:
    print(f"\n⚠️ UNEXPECTED STATE")
    print(f"   Database: {db_status}")
    print(f"   Expected: {new_status}")

print("\n" + "=" * 100)
