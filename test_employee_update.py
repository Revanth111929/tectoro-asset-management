#!/usr/bin/env python3
"""
Test script to capture EXACT network behavior when updating employee status
NO ASSUMPTIONS - ONLY EVIDENCE
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000/api"
TEST_EMP_ID = "RG025"

# Step 1: Login to get token
print("=" * 80)
print("STEP 1: LOGIN TO GET AUTH TOKEN")
print("=" * 80)

login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"username": "admin", "password": "admin"}
)

print(f"Login Status Code: {login_response.status_code}")
print(f"Login Response: {json.dumps(login_response.json(), indent=2)}")

if login_response.status_code != 200:
    print("\n❌ LOGIN FAILED - Cannot proceed")
    exit(1)

token = login_response.json().get('token')
print(f"\n✓ Token obtained: {token[:50]}...")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Step 2: Get current employee status BEFORE update
print("\n" + "=" * 80)
print(f"STEP 2: GET CURRENT STATUS FOR {TEST_EMP_ID}")
print("=" * 80)

get_response = requests.get(
    f"{BASE_URL}/employees/{TEST_EMP_ID}",
    headers=headers
)

print(f"GET Request URL: {BASE_URL}/employees/{TEST_EMP_ID}")
print(f"GET Status Code: {get_response.status_code}")
print(f"GET Response Body:")
print(json.dumps(get_response.json(), indent=2))

if get_response.status_code == 200:
    current_status = get_response.json().get('employee', {}).get('status')
    print(f"\n✓ Current Status: {current_status}")
else:
    print(f"\n❌ Failed to get employee")
    current_status = "Unknown"

# Step 3: Attempt UPDATE with PUT method (what frontend does)
print("\n" + "=" * 80)
print(f"STEP 3: ATTEMPT UPDATE - PUT /api/employees/{TEST_EMP_ID}")
print("=" * 80)

# Toggle status
new_status = "Inactive" if current_status == "Active" else "Active"

update_payload = {
    "emp_id": TEST_EMP_ID,
    "employee_name": "Test Employee",
    "email": "test@company.com",
    "mobile_number": "1234567890",
    "designation": "Engineer",
    "department": "IT",
    "status": new_status,  # CHANGING STATUS
    "is_active": True
}

print(f"\n1. Request URL: PUT {BASE_URL}/employees/{TEST_EMP_ID}")
print(f"2. HTTP Method: PUT")
print(f"3. Request Payload:")
print(json.dumps(update_payload, indent=2))

put_response = requests.put(
    f"{BASE_URL}/employees/{TEST_EMP_ID}",
    headers=headers,
    json=update_payload
)

print(f"\n4. Response Status Code: {put_response.status_code}")
print(f"5. Response Body:")
try:
    print(json.dumps(put_response.json(), indent=2))
except:
    print(f"   Raw Response: {put_response.text}")

# Step 4: Query database directly
print("\n" + "=" * 80)
print("STEP 4: QUERY DATABASE DIRECTLY")
print("=" * 80)

import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'assets.db')
print(f"Database Path: {db_path}")

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    query = f"SELECT emp_id, employee_name, status, updated_at FROM employees WHERE emp_id='{TEST_EMP_ID}'"
    print(f"\nSQL Query: {query}")
    
    cursor.execute(query)
    result = cursor.fetchone()
    
    if result:
        print(f"\nDatabase Result:")
        print(f"  emp_id: {result[0]}")
        print(f"  employee_name: {result[1]}")
        print(f"  status: {result[2]}")
        print(f"  updated_at: {result[3]}")
    else:
        print(f"\n❌ No employee found with emp_id={TEST_EMP_ID}")
    
    conn.close()
else:
    print(f"❌ Database not found at {db_path}")

# Step 5: GET employee again via API
print("\n" + "=" * 80)
print(f"STEP 5: GET /api/employees/{TEST_EMP_ID} (after update attempt)")
print("=" * 80)

get_after_response = requests.get(
    f"{BASE_URL}/employees/{TEST_EMP_ID}",
    headers=headers
)

print(f"Request URL: GET {BASE_URL}/employees/{TEST_EMP_ID}")
print(f"Status Code: {get_after_response.status_code}")
print(f"Response Body:")
print(json.dumps(get_after_response.json(), indent=2))

# Step 6: Search employee via search endpoint
print("\n" + "=" * 80)
print(f"STEP 6: GET /api/employees?q={TEST_EMP_ID} (search endpoint)")
print("=" * 80)

search_response = requests.get(
    f"{BASE_URL}/employees",
    headers=headers,
    params={"q": TEST_EMP_ID}
)

print(f"Request URL: GET {BASE_URL}/employees?q={TEST_EMP_ID}")
print(f"Status Code: {search_response.status_code}")
print(f"Response Body:")
print(json.dumps(search_response.json(), indent=2))

# Summary
print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"Original Status: {current_status}")
print(f"Attempted Change To: {new_status}")
print(f"PUT Request Status: {put_response.status_code}")

if get_after_response.status_code == 200:
    final_status = get_after_response.json().get('employee', {}).get('status')
    print(f"Final Status (via GET): {final_status}")
    
    if final_status == new_status:
        print("\n✅ STATUS UPDATE SUCCEEDED")
    else:
        print(f"\n❌ STATUS UPDATE FAILED - Still showing {final_status}")
else:
    print("\n❌ Cannot verify final status")
