#!/usr/bin/env python3
"""
Test script for asset replacement save functionality
Tests creating, listing, and deleting asset replacements
"""

import requests
import json
from datetime import date

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
    """Get available assets for replacement"""
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
            print("  Warning: No available assets found")
            return []
    else:
        print(f"✗ Failed to get assets: {response.status_code} {response.text}")
        return []

def test_get_assigned_assets(token):
    """Get assigned assets (for old asset in replacement)"""
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
            print("  Warning: No assigned assets found")
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
        employees = response.json()
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

def test_create_asset_replacement(token, employee_id, employee_name, old_asset_id, new_asset_id):
    """Create an asset replacement"""
    print("\n=== Testing: Create Asset Replacement ===")
    
    replacement_data = {
        'employee_id': employee_id,
        'employee_name': employee_name,
        'old_asset_id': old_asset_id,
        'new_asset_id': new_asset_id,
        'reason': 'Hardware Upgrade',
        'old_asset_condition': 'Good',
        'remarks': 'Testing asset replacement - upgrading to newer model'
    }
    
    print(f"  Request data: {json.dumps(replacement_data, indent=2)}")
    
    response = requests.post(
        f"{BASE_URL}/api/asset-replacements",
        headers=get_headers(token),
        json=replacement_data
    )
    
    print(f"  Response status: {response.status_code}")
    print(f"  Response body: {response.text}")
    
    if response.status_code == 201:
        result = response.json()
        replacement = result.get('replacement')
        replacement_id = replacement.get('id') if replacement else None
        print(f"✓ Asset replacement created successfully (ID: {replacement_id})")
        return replacement_id
    else:
        print(f"✗ Failed to create replacement: {response.status_code}")
        print(f"  Error: {response.text}")
        return None

def test_list_asset_replacements(token):
    """List all asset replacements"""
    print("\n=== Testing: List Asset Replacements ===")
    response = requests.get(
        f"{BASE_URL}/api/asset-replacements",
        headers=get_headers(token)
    )
    if response.status_code == 200:
        data = response.json()
        replacements = data.get('replacements', [])
        print(f"✓ Found {len(replacements)} asset replacements")
        for i, replacement in enumerate(replacements[:3]):
            print(f"  Replacement {i+1}:")
            print(f"    ID: {replacement.get('id')}")
            print(f"    Employee: {replacement.get('employee_name')} ({replacement.get('employee_id')})")
            print(f"    Old Asset: {replacement.get('old_asset_name')}")
            print(f"    New Asset: {replacement.get('new_asset_name')}")
            print(f"    Reason: {replacement.get('reason')}")
            print(f"    Performed By: {replacement.get('performed_by')}")
        return replacements
    else:
        print(f"✗ Failed to list replacements: {response.status_code} {response.text}")
        return []

def test_delete_replacement(token, replacement_id):
    """Delete an asset replacement"""
    print(f"\n=== Testing: Delete Replacement {replacement_id} ===")
    response = requests.delete(
        f"{BASE_URL}/api/asset-replacements/{replacement_id}",
        headers=get_headers(token)
    )
    if response.status_code == 200:
        print(f"✓ Replacement deleted successfully")
        return True
    else:
        print(f"✗ Failed to delete replacement: {response.status_code} {response.text}")
        return False

def main():
    """Run all tests"""
    print("=" * 80)
    print("ASSET REPLACEMENT SAVE FUNCTIONALITY TEST")
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
    employee_name = employee.get('employee_name')
    
    # Get assets
    assigned_assets = test_get_assigned_assets(token)
    available_assets = test_get_available_assets(token)
    
    if not assigned_assets:
        print("\n✗ Cannot proceed without assigned assets for testing")
        return
    
    if not available_assets:
        print("\n✗ Cannot proceed without available assets for testing")
        return
    
    old_asset_id = assigned_assets[0].get('id')
    new_asset_id = available_assets[0].get('id')
    
    # Create asset replacement
    replacement_id = test_create_asset_replacement(
        token, employee_id, employee_name, 
        old_asset_id, new_asset_id
    )
    
    if not replacement_id:
        print("\n✗ MAIN TEST FAILED: Could not create asset replacement")
        return
    
    # List replacements to verify creation
    test_list_asset_replacements(token)
    
    # Clean up by deleting the test replacement
    print("\n" + "=" * 80)
    print("Cleaning up: Deleting test replacement")
    print("=" * 80)
    test_delete_replacement(token, replacement_id)
    
    print("\n" + "=" * 80)
    print("✓ ALL TESTS COMPLETED SUCCESSFULLY")
    print("=" * 80)

if __name__ == "__main__":
    main()
