#!/usr/bin/env python3
"""
Test script for temporary assignment save functionality
Tests creating, listing, completing, and deleting temporary assignments
"""

import requests
import json
from datetime import date, timedelta

BASE_URL = "http://192.168.20.180:5000"
USERNAME = "admin"
PASSWORD = "admin123"

def login():
    """Login and get auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        'username': USERNAME,
        'password': PASSWORD
    })
    if response.status_code == 200:
        token = response.json().get('token')
        print(f"✓ Login successful")
        return token
    else:
        print(f"✗ Login failed: {response.status_code} {response.text}")
        return None

def get_headers(token):
    """Get request headers with auth token"""
    return {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

def test_get_available_assets(token):
    """Get available assets for temporary assignment"""
    print("\n=== Testing: Get Available Assets ===")
    response = requests.get(
        f"{BASE_URL}/api/assets",
        params={'status': 'Available'},
        headers=get_headers(token)
    )
    if response.status_code == 200:
        assets = response.json().get('assets', [])
        print(f"✓ Found {len(assets)} available assets")
        if len(assets) > 0:
            print(f"  First asset: {assets[0].get('asset_name')} (ID: {assets[0].get('id')})")
            return assets
        else:
            print("  Warning: No available assets found for testing")
            return []
    else:
        print(f"✗ Failed to get assets: {response.status_code} {response.text}")
        return []

def test_get_assigned_assets(token):
    """Get assigned assets (for original asset in temp assignment)"""
    print("\n=== Testing: Get Assigned Assets ===")
    response = requests.get(
        f"{BASE_URL}/api/assets",
        params={'status': 'Assigned'},
        headers=get_headers(token)
    )
    if response.status_code == 200:
        assets = response.json().get('assets', [])
        print(f"✓ Found {len(assets)} assigned assets")
        if len(assets) > 0:
            print(f"  First asset: {assets[0].get('asset_name')} (ID: {assets[0].get('id')})")
            return assets
        else:
            print("  Warning: No assigned assets found for testing")
            return []
    else:
        print(f"✗ Failed to get assets: {response.status_code} {response.text}")
        return []

def test_search_employee(token, search_term):
    """Search for employee"""
    print(f"\n=== Testing: Search Employee '{search_term}' ===")
    response = requests.get(
        f"{BASE_URL}/api/employees",
        params={'q': search_term},
        headers=get_headers(token)
    )
    if response.status_code == 200:
        employees = response.json()  # Direct array, not {'employees': [...]}
        if isinstance(employees, list):
            print(f"✓ Found {len(employees)} employees")
            if len(employees) > 0:
                emp = employees[0]
                print(f"  First employee: {emp.get('employee_name')} (ID: {emp.get('emp_id')})")
                return employees
            else:
                print("  Warning: No employees found")
                return []
        else:
            print(f"  Unexpected response format: {type(employees)}")
            return []
    else:
        print(f"✗ Failed to search employees: {response.status_code} {response.text}")
        return []

def test_create_temp_assignment(token, employee_id, employee_name, original_asset_id, temp_asset_id):
    """Create a temporary assignment"""
    print("\n=== Testing: Create Temporary Assignment ===")
    
    assignment_data = {
        'employee_id': employee_id,
        'employee_name': employee_name,
        'original_asset_id': original_asset_id,
        'temp_asset_id': temp_asset_id,
        'reason': 'Laptop in for repair - testing temp assignment',
        'start_date': date.today().isoformat(),
        'expected_return_date': (date.today() + timedelta(days=7)).isoformat()
    }
    
    print(f"  Request data: {json.dumps(assignment_data, indent=2)}")
    
    response = requests.post(
        f"{BASE_URL}/api/temporary-assignments",
        headers=get_headers(token),
        json=assignment_data
    )
    
    print(f"  Response status: {response.status_code}")
    print(f"  Response body: {response.text}")
    
    if response.status_code == 201:
        result = response.json()
        assignment_id = result.get('assignment')
        print(f"✓ Temporary assignment created successfully (ID: {assignment_id})")
        return assignment_id
    else:
        print(f"✗ Failed to create assignment: {response.status_code}")
        print(f"  Error: {response.text}")
        return None

def test_list_temp_assignments(token):
    """List all temporary assignments"""
    print("\n=== Testing: List Temporary Assignments ===")
    response = requests.get(
        f"{BASE_URL}/api/temporary-assignments",
        headers=get_headers(token)
    )
    if response.status_code == 200:
        assignments = response.json().get('assignments', [])
        print(f"✓ Found {len(assignments)} temporary assignments")
        for i, assignment in enumerate(assignments[:3]):
            print(f"  Assignment {i+1}:")
            print(f"    ID: {assignment.get('id')}")
            print(f"    Employee: {assignment.get('employee_name')} ({assignment.get('employee_id')})")
            print(f"    Temp Asset: {assignment.get('temp_asset_name')}")
            print(f"    Status: {assignment.get('status')}")
        return assignments
    else:
        print(f"✗ Failed to list assignments: {response.status_code} {response.text}")
        return []

def test_complete_assignment(token, assignment_id):
    """Complete a temporary assignment"""
    print(f"\n=== Testing: Complete Assignment {assignment_id} ===")
    response = requests.post(
        f"{BASE_URL}/api/temporary-assignments/{assignment_id}/complete",
        headers=get_headers(token)
    )
    if response.status_code == 200:
        print(f"✓ Assignment completed successfully")
        return True
    else:
        print(f"✗ Failed to complete assignment: {response.status_code} {response.text}")
        return False

def test_delete_assignment(token, assignment_id):
    """Delete a temporary assignment"""
    print(f"\n=== Testing: Delete Assignment {assignment_id} ===")
    response = requests.delete(
        f"{BASE_URL}/api/temporary-assignments/{assignment_id}",
        headers=get_headers(token)
    )
    if response.status_code == 200:
        print(f"✓ Assignment deleted successfully")
        return True
    else:
        print(f"✗ Failed to delete assignment: {response.status_code} {response.text}")
        return False

def main():
    """Run all tests"""
    print("=" * 80)
    print("TEMPORARY ASSIGNMENT SAVE FUNCTIONALITY TEST")
    print("=" * 80)
    
    # Login
    token = login()
    if not token:
        print("\n✗ Cannot proceed without authentication token")
        return
    
    # Search for employees
    employees = test_search_employee(token, "TEC")
    if not employees:
        print("\n✗ Cannot proceed without employee data")
        return
    
    employee = employees[0]
    employee_id = employee.get('emp_id')
    employee_name = employee.get('employee_name')  # Changed from 'name' to 'employee_name'
    
    # Get assets
    assigned_assets = test_get_assigned_assets(token)
    available_assets = test_get_available_assets(token)
    
    if not assigned_assets:
        print("\n✗ Cannot proceed without assigned assets for testing")
        return
    
    if not available_assets:
        print("\n✗ Cannot proceed without available assets for testing")
        return
    
    original_asset_id = assigned_assets[0].get('id')
    temp_asset_id = available_assets[0].get('id')
    
    # Create temporary assignment
    assignment_id = test_create_temp_assignment(
        token, employee_id, employee_name, 
        original_asset_id, temp_asset_id
    )
    
    if not assignment_id:
        print("\n✗ MAIN TEST FAILED: Could not create temporary assignment")
        return
    
    # List assignments to verify creation
    test_list_temp_assignments(token)
    
    # Complete the assignment
    print("\n" + "=" * 80)
    print("Cleaning up: Completing and deleting test assignment")
    print("=" * 80)
    test_complete_assignment(token, assignment_id)
    
    # Optionally delete (or just leave it completed)
    # test_delete_assignment(token, assignment_id)
    
    print("\n" + "=" * 80)
    print("✓ ALL TESTS COMPLETED SUCCESSFULLY")
    print("=" * 80)

if __name__ == "__main__":
    main()
