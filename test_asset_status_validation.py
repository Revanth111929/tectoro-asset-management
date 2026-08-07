#!/usr/bin/env python3
"""
ASSET STATUS VALIDATION - COMPREHENSIVE TEST
Tests all business rules for asset status and employee assignment consistency
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3000/api"

class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

def print_header(text):
    print(f"\n{'='*100}")
    print(f"{Colors.YELLOW}{text}{Colors.NC}")
    print('='*100)

def print_test(test_num, description):
    print(f"\n{Colors.BLUE}[TEST {test_num}]{Colors.NC} {description}")
    print('-'*100)

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.NC}")

def print_failure(message):
    print(f"{Colors.RED}❌ {message}{Colors.NC}")

# Login
print_header("ASSET STATUS VALIDATION - COMPREHENSIVE TEST")
print("Logging in...")

login_resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin123"})
if login_resp.status_code != 200:
    print_failure("Login failed")
    exit(1)

token = login_resp.json()['token']
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
print_success("Logged in successfully")

# Test counters
passed = 0
failed = 0

# ==================================================================================
# TEST SUITE 1: Asset Update Validation
# ==================================================================================

print_header("TEST SUITE 1: ASSET UPDATE VALIDATION")

# Get an existing asset
assets_resp = requests.get(f"{BASE_URL}/assets", headers=headers)
assets = assets_resp.json()['assets']
if not assets:
    print_failure("No assets found for testing")
    exit(1)

test_asset = assets[0]
asset_id = test_asset['id']
print(f"\nUsing test asset: ID={asset_id}, Name={test_asset['asset_name']}")

# TEST 1: Try to set status=Available with employee assigned (SHOULD FAIL)
print_test(1, "Set status='Available' with employee assigned (SHOULD FAIL)")

payload = {
    "asset_name": test_asset['asset_name'],
    "serial_number": test_asset['serial_number'],
    "category": test_asset.get('category', 'Laptop'),
    "emp_id": "RG025",
    "employee_name": "Test Employee",
    "status": "Available"  # INVALID: Has employee but status=Available
}

response = requests.put(f"{BASE_URL}/assets/{asset_id}", headers=headers, json=payload)
print(f"Response Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 400:
    print_success("PASS: Backend correctly rejected invalid combination")
    passed += 1
else:
    print_failure("FAIL: Backend should have rejected this")
    failed += 1

# TEST 2: Try to set status=Assigned without employee (SHOULD FAIL)
print_test(2, "Set status='Assigned' without employee (SHOULD FAIL)")

payload = {
    "asset_name": test_asset['asset_name'],
    "serial_number": test_asset['serial_number'],
    "category": test_asset.get('category', 'Laptop'),
    "emp_id": "",
    "employee_name": "",
    "status": "Assigned"  # INVALID: No employee but status=Assigned
}

response = requests.put(f"{BASE_URL}/assets/{asset_id}", headers=headers, json=payload)
print(f"Response Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 400:
    print_success("PASS: Backend correctly rejected invalid combination")
    passed += 1
else:
    print_failure("FAIL: Backend should have rejected this")
    failed += 1

# TEST 3: Set status=Available with NO employee (SHOULD SUCCEED)
print_test(3, "Set status='Available' with NO employee (SHOULD SUCCEED)")

payload = {
    "asset_name": test_asset['asset_name'],
    "serial_number": test_asset['serial_number'],
    "category": test_asset.get('category', 'Laptop'),
    "emp_id": "",
    "employee_name": "",
    "employee_email": "",
    "mobile_number": "",
    "status": "Available"  # VALID: No employee and status=Available
}

response = requests.put(f"{BASE_URL}/assets/{asset_id}", headers=headers, json=payload)
print(f"Response Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 200:
    print_success("PASS: Backend correctly accepted valid combination")
    passed += 1
else:
    print_failure("FAIL: Backend should have accepted this")
    failed += 1

# TEST 4: Set status=Assigned with employee (SHOULD SUCCEED)
print_test(4, "Set status='Assigned' with employee (SHOULD SUCCEED)")

payload = {
    "asset_name": test_asset['asset_name'],
    "serial_number": test_asset['serial_number'],
    "category": test_asset.get('category', 'Laptop'),
    "emp_id": "RG025",
    "employee_name": "Test Employee",
    "employee_email": "test@company.com",
    "mobile_number": "1234567890",
    "status": "Assigned"  # VALID: Has employee and status=Assigned
}

response = requests.put(f"{BASE_URL}/assets/{asset_id}", headers=headers, json=payload)
print(f"Response Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 200:
    print_success("PASS: Backend correctly accepted valid combination")
    passed += 1
else:
    print_failure("FAIL: Backend should have accepted this")
    failed += 1

# TEST 5: Try to set employee with status=Maintenance (SHOULD FAIL)
print_test(5, "Set employee with status='Maintenance' (SHOULD FAIL)")

payload = {
    "asset_name": test_asset['asset_name'],
    "serial_number": test_asset['serial_number'],
    "category": test_asset.get('category', 'Laptop'),
    "emp_id": "RG025",
    "employee_name": "Test Employee",
    "status": "Maintenance"  # INVALID: Has employee but status not Assigned
}

response = requests.put(f"{BASE_URL}/assets/{asset_id}", headers=headers, json=payload)
print(f"Response Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 400:
    print_success("PASS: Backend correctly rejected invalid combination")
    passed += 1
else:
    print_failure("FAIL: Backend should have rejected this")
    failed += 1

# TEST 6: Set only employee_name without emp_id and status=Available (SHOULD FAIL)
print_test(6, "Set only employee_name with status='Available' (SHOULD FAIL)")

payload = {
    "asset_name": test_asset['asset_name'],
    "serial_number": test_asset['serial_number'],
    "category": test_asset.get('category', 'Laptop'),
    "emp_id": "",
    "employee_name": "Test Employee",  # Has name but no ID
    "status": "Available"
}

response = requests.put(f"{BASE_URL}/assets/{asset_id}", headers=headers, json=payload)
print(f"Response Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 400:
    print_success("PASS: Backend correctly rejected (employee name present)")
    passed += 1
else:
    print_failure("FAIL: Backend should have rejected this")
    failed += 1

# ==================================================================================
# TEST SUITE 2: Asset Creation Validation
# ==================================================================================

print_header("TEST SUITE 2: ASSET CREATION VALIDATION")

# TEST 7: Create asset with status=Available and employee (SHOULD FAIL)
print_test(7, "Create asset with status='Available' and employee (SHOULD FAIL)")

payload = {
    "asset_name": f"Test Asset {datetime.now().timestamp()}",
    "serial_number": f"TEST-{int(datetime.now().timestamp())}",
    "category": "Laptop",
    "emp_id": "RG025",
    "employee_name": "Test Employee",
    "status": "Available"  # INVALID
}

response = requests.post(f"{BASE_URL}/assets", headers=headers, json=payload)
print(f"Response Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 400:
    print_success("PASS: Backend correctly rejected invalid combination")
    passed += 1
else:
    print_failure("FAIL: Backend should have rejected this")
    failed += 1

# TEST 8: Create asset with status=Assigned and employee (SHOULD SUCCEED)
print_test(8, "Create asset with status='Assigned' and employee (SHOULD SUCCEED)")

payload = {
    "asset_name": f"Test Asset {datetime.now().timestamp()}",
    "serial_number": f"TEST-{int(datetime.now().timestamp())}",
    "category": "Laptop",
    "emp_id": "RG025",
    "employee_name": "Test Employee",
    "status": "Assigned"  # VALID
}

response = requests.post(f"{BASE_URL}/assets", headers=headers, json=payload)
print(f"Response Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 200 or response.status_code == 201:
    print_success("PASS: Backend correctly accepted valid combination")
    passed += 1
    created_asset_id = response.json().get('asset', {}).get('id')
else:
    print_failure("FAIL: Backend should have accepted this")
    failed += 1
    created_asset_id = None

# ==================================================================================
# SUMMARY
# ==================================================================================

print_header("TEST SUMMARY")
print(f"\n{Colors.GREEN}Passed: {passed}{Colors.NC}")
print(f"{Colors.RED}Failed: {failed}{Colors.NC}")

if failed == 0:
    print(f"\n{Colors.GREEN}✅ ALL ASSET STATUS VALIDATION TESTS PASSED{Colors.NC}")
    print("\n" + "="*100)
    print("ASSET STATUS FEATURE - VALIDATION COMPLETE")
    print("="*100)
    print("\nBusiness Rules Enforced:")
    print("1. ✅ If employee assigned → status MUST be 'Assigned'")
    print("2. ✅ If status='Available' → NO employee information allowed")
    print("3. ✅ If status='Assigned' → employee information REQUIRED")
    print("4. ✅ Invalid combinations are rejected with clear error messages")
    print("\nNext: Test in Browser UI")
    print("1. Open http://localhost:3000")
    print("2. Try to save an asset with employee + status=Available")
    print("3. Verify error message is displayed")
    print("4. Change to status=Assigned and verify save succeeds")
    print("="*100)
    exit(0)
else:
    print(f"\n{Colors.RED}❌ SOME TESTS FAILED{Colors.NC}")
    exit(1)
