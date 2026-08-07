#!/usr/bin/env python3
"""
Test script to verify active_only employee filter
Tests both with and without the active_only parameter
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:3000/api"

def get_token():
    """Login and get JWT token"""
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    if response.status_code == 200:
        return response.json().get('token')
    else:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        return None

def test_employee_search(token, query='', active_only=False):
    """Test employee search with optional active_only filter"""
    headers = {"Authorization": f"Bearer {token}"}
    params = {"q": query}
    if active_only:
        params['active_only'] = 'true'
    
    print(f"\n{'='*80}")
    print(f"TEST: Employee Search")
    print(f"Query: '{query}'")
    print(f"Active Only: {active_only}")
    print(f"URL: GET {BASE_URL}/employees?{'&'.join([f'{k}={v}' for k,v in params.items()])}")
    print(f"{'='*80}")
    
    response = requests.get(f"{BASE_URL}/employees", headers=headers, params=params)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        employees = response.json()
        print(f"\nTotal Results: {len(employees)}")
        
        if employees:
            print(f"\nEmployee Details:")
            print(f"{'Emp ID':<12} {'Name':<25} {'Status':<12} {'Is Active':<12} {'Email':<30}")
            print(f"{'-'*12} {'-'*25} {'-'*12} {'-'*12} {'-'*30}")
            
            status_counts = {'Active': 0, 'Inactive': 0, 'Exited': 0}
            
            for emp in employees[:10]:  # Show first 10
                emp_id = emp.get('emp_id', 'N/A')
                name = emp.get('employee_name', 'N/A')[:24]
                status = emp.get('status', 'N/A')
                # is_active may not be in response, default to checking status
                email = (emp.get('email', '') or 'N/A')[:29]
                
                if status in status_counts:
                    status_counts[status] += 1
                
                print(f"{emp_id:<12} {name:<25} {status:<12} {'N/A':<12} {email:<30}")
            
            if len(employees) > 10:
                print(f"\n... and {len(employees) - 10} more employees")
            
            print(f"\nStatus Breakdown:")
            print(f"  Active:   {status_counts['Active']}")
            print(f"  Inactive: {status_counts['Inactive']}")
            print(f"  Exited:   {status_counts['Exited']}")
            
            # Verify filter worked correctly
            if active_only:
                if status_counts['Inactive'] > 0 or status_counts['Exited'] > 0:
                    print(f"\n⚠️  WARNING: active_only=true but found non-Active employees!")
                    print(f"   Filter may not be working correctly.")
                else:
                    print(f"\n✅ SUCCESS: Only Active employees returned (as expected)")
            else:
                print(f"\n✅ All statuses included (no filter applied)")
        else:
            print("No employees found")
    else:
        print(f"Error: {response.text}")

def main():
    print("="*80)
    print("EMPLOYEE SEARCH ACTIVE_ONLY FILTER TEST")
    print("="*80)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Target: {BASE_URL}")
    
    # Get authentication token
    token = get_token()
    if not token:
        print("Failed to authenticate. Exiting.")
        return
    
    print("\n✅ Authentication successful")
    
    # Test 1: Search without filter (should show all employees)
    test_employee_search(token, query='', active_only=False)
    
    # Test 2: Search with active_only filter (should show only Active employees)
    test_employee_search(token, query='', active_only=True)
    
    # Test 3: Search with query and active_only filter
    test_employee_search(token, query='e', active_only=True)
    
    # Test 4: Search with query, no filter
    test_employee_search(token, query='e', active_only=False)
    
    print("\n" + "="*80)
    print("TEST COMPLETE")
    print("="*80)
    print("\nVERIFICATION:")
    print("1. Test 1 should show Active, Inactive, and Exited employees")
    print("2. Test 2 should show ONLY Active employees")
    print("3. Test 3 should show ONLY Active employees matching query")
    print("4. Test 4 should show all employees matching query (any status)")
    print("\nIf Test 2 or 3 shows Inactive/Exited employees, the filter is NOT working.")

if __name__ == "__main__":
    main()
