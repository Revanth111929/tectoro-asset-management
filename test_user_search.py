#!/usr/bin/env python3
"""
Comprehensive User Search Testing Suite
Tests user search functionality by ID and Name
"""

import requests
import json
from datetime import datetime

API_URL = "http://192.168.20.180:5000/api"

class TestUserSearch:
    def __init__(self):
        self.token = None
        self.tests_passed = 0
        self.tests_failed = 0
        self.test_results = []
        
    def print_header(self, title):
        print(f"\n{'='*80}")
        print(f"  {title}")
        print(f"{'='*80}")
    
    def print_test(self, name, passed, details=""):
        status = "✓ PASS" if passed else "✗ FAIL"
        icon = "✅" if passed else "❌"
        print(f"{icon} {status}: {name}")
        if details:
            print(f"   {details}")
        
        self.test_results.append({
            'name': name,
            'passed': passed,
            'details': details
        })
        
        if passed:
            self.tests_passed += 1
        else:
            self.tests_failed += 1
    
    def test_login(self):
        """Test 1: Login and get authentication token"""
        self.print_header("TEST 1: Authentication")
        try:
            response = requests.post(
                f"{API_URL}/auth/login",
                json={"username": "admin", "password": "admin123"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access_token') or data.get('token')
                self.print_test(
                    "Login successful",
                    True,
                    f"Token: {self.token[:30]}..."
                )
                return True
            else:
                self.print_test(
                    "Login failed",
                    False,
                    f"Status: {response.status_code}, Response: {response.text[:100]}"
                )
                return False
        except Exception as e:
            self.print_test("Login failed", False, f"Exception: {str(e)}")
            return False
    
    def test_search_by_exact_id(self):
        """Test 2: Search by exact User ID"""
        self.print_header("TEST 2: Search by Exact User ID")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        test_ids = ['TT694', 'TT001', 'TT251']
        
        for emp_id in test_ids:
            try:
                response = requests.get(
                    f"{API_URL}/employees?q={emp_id}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    found = any(emp['emp_id'] == emp_id for emp in data)
                    
                    if found:
                        emp = next(e for e in data if e['emp_id'] == emp_id)
                        self.print_test(
                            f"Search by ID '{emp_id}'",
                            True,
                            f"Found: {emp['employee_name']} ({emp['emp_id']})"
                        )
                    else:
                        self.print_test(
                            f"Search by ID '{emp_id}'",
                            False,
                            f"Employee {emp_id} not found in results"
                        )
                else:
                    self.print_test(
                        f"Search by ID '{emp_id}'",
                        False,
                        f"API error: {response.status_code}"
                    )
            except Exception as e:
                self.print_test(
                    f"Search by ID '{emp_id}'",
                    False,
                    f"Exception: {str(e)}"
                )
    
    def test_search_by_full_name(self):
        """Test 3: Search by full User Name"""
        self.print_header("TEST 3: Search by Full User Name")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        test_names = [
            'Revanth Maddela',
            'Prem Kumar Mamidala',
            'Rajini'
        ]
        
        for name in test_names:
            try:
                response = requests.get(
                    f"{API_URL}/employees?q={name}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    found = any(name.lower() in emp['employee_name'].lower() for emp in data)
                    
                    if found:
                        matches = [e for e in data if name.lower() in e['employee_name'].lower()]
                        self.print_test(
                            f"Search by name '{name}'",
                            True,
                            f"Found {len(matches)} match(es): {matches[0]['employee_name']} ({matches[0]['emp_id']})"
                        )
                    else:
                        self.print_test(
                            f"Search by name '{name}'",
                            False,
                            f"No matches for '{name}'"
                        )
                else:
                    self.print_test(
                        f"Search by name '{name}'",
                        False,
                        f"API error: {response.status_code}"
                    )
            except Exception as e:
                self.print_test(
                    f"Search by name '{name}'",
                    False,
                    f"Exception: {str(e)}"
                )
    
    def test_search_by_partial_name(self):
        """Test 4: Search by partial User Name"""
        self.print_header("TEST 4: Search by Partial User Name")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        test_queries = [
            ('Rev', 'Should find Revanth'),
            ('Prem', 'Should find Prem Kumar'),
            ('Mad', 'Should find Maddela'),
            ('tt', 'Should find employees with TT in ID')
        ]
        
        for query, description in test_queries:
            try:
                response = requests.get(
                    f"{API_URL}/employees?q={query}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if len(data) > 0:
                        self.print_test(
                            f"Partial search '{query}'",
                            True,
                            f"{description} - Found {len(data)} result(s)"
                        )
                    else:
                        self.print_test(
                            f"Partial search '{query}'",
                            False,
                            f"No results for '{query}'"
                        )
                else:
                    self.print_test(
                        f"Partial search '{query}'",
                        False,
                        f"API error: {response.status_code}"
                    )
            except Exception as e:
                self.print_test(
                    f"Partial search '{query}'",
                    False,
                    f"Exception: {str(e)}"
                )
    
    def test_case_insensitive_search(self):
        """Test 5: Case-insensitive search"""
        self.print_header("TEST 5: Case-Insensitive Search")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        test_cases = [
            ('revanth', 'lowercase'),
            ('REVANTH', 'uppercase'),
            ('ReVaNtH', 'mixed case'),
            ('tt694', 'lowercase ID'),
            ('TT694', 'uppercase ID')
        ]
        
        for query, case_type in test_cases:
            try:
                response = requests.get(
                    f"{API_URL}/employees?q={query}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if len(data) > 0:
                        self.print_test(
                            f"Case-insensitive '{query}' ({case_type})",
                            True,
                            f"Found {len(data)} result(s)"
                        )
                    else:
                        self.print_test(
                            f"Case-insensitive '{query}' ({case_type})",
                            False,
                            f"No results"
                        )
                else:
                    self.print_test(
                        f"Case-insensitive '{query}' ({case_type})",
                        False,
                        f"API error: {response.status_code}"
                    )
            except Exception as e:
                self.print_test(
                    f"Case-insensitive '{query}' ({case_type})",
                    False,
                    f"Exception: {str(e)}"
                )
    
    def test_employee_assets(self):
        """Test 6: Get employee assets"""
        self.print_header("TEST 6: Get Employee Assets")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        test_employees = ['TT694', 'TT001', 'TT251']
        
        for emp_id in test_employees:
            try:
                response = requests.get(
                    f"{API_URL}/assets/by-employee/{emp_id}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    assets = data.get('assets', [])
                    emp_name = data.get('employee_name', 'Unknown')
                    
                    self.print_test(
                        f"Assets for {emp_id}",
                        True,
                        f"Employee: {emp_name}, Assets: {len(assets)}"
                    )
                else:
                    self.print_test(
                        f"Assets for {emp_id}",
                        False,
                        f"API error: {response.status_code}"
                    )
            except Exception as e:
                self.print_test(
                    f"Assets for {emp_id}",
                    False,
                    f"Exception: {str(e)}"
                )
    
    def test_error_handling(self):
        """Test 7: Error handling for invalid searches"""
        self.print_header("TEST 7: Error Handling")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Test 1: Empty search
        try:
            response = requests.get(
                f"{API_URL}/employees?q=",
                headers=headers
            )
            
            if response.status_code == 200:
                self.print_test(
                    "Empty search query",
                    True,
                    "Returns all employees (or empty list)"
                )
            else:
                self.print_test(
                    "Empty search query",
                    False,
                    f"Unexpected status: {response.status_code}"
                )
        except Exception as e:
            self.print_test("Empty search query", False, f"Exception: {str(e)}")
        
        # Test 2: Non-existent employee
        try:
            response = requests.get(
                f"{API_URL}/employees?q=NONEXISTENT999",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.print_test(
                    "Non-existent employee search",
                    len(data) == 0,
                    f"Returns empty list: {len(data) == 0}"
                )
            else:
                self.print_test(
                    "Non-existent employee search",
                    False,
                    f"API error: {response.status_code}"
                )
        except Exception as e:
            self.print_test("Non-existent employee search", False, f"Exception: {str(e)}")
        
        # Test 3: Special characters
        try:
            response = requests.get(
                f"{API_URL}/employees?q=@#$%",
                headers=headers
            )
            
            if response.status_code == 200:
                self.print_test(
                    "Special characters search",
                    True,
                    "Handles special characters gracefully"
                )
            else:
                self.print_test(
                    "Special characters search",
                    response.status_code == 400,
                    f"Status: {response.status_code}"
                )
        except Exception as e:
            self.print_test("Special characters search", False, f"Exception: {str(e)}")
    
    def test_no_token(self):
        """Test 8: Authentication required"""
        self.print_header("TEST 8: Authentication Required")
        
        try:
            response = requests.get(f"{API_URL}/employees?q=test")
            
            self.print_test(
                "Request without token",
                response.status_code == 401,
                f"Status: {response.status_code} (Expected: 401)"
            )
        except Exception as e:
            self.print_test("Request without token", False, f"Exception: {str(e)}")
    
    def print_summary(self):
        """Print test summary"""
        self.print_header("TEST SUMMARY")
        
        total = self.tests_passed + self.tests_failed
        pass_rate = (self.tests_passed / total * 100) if total > 0 else 0
        
        print(f"\nTotal Tests:    {total}")
        print(f"✅ Passed:      {self.tests_passed}")
        print(f"❌ Failed:      {self.tests_failed}")
        print(f"Success Rate:   {pass_rate:.1f}%")
        
        if self.tests_failed == 0:
            print("\n🎉 ALL TESTS PASSED! User search is working correctly!")
        else:
            print(f"\n⚠️  {self.tests_failed} test(s) failed - Review needed")
        
        print(f"\n{'='*80}\n")
        
        return self.tests_failed == 0
    
    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "="*80)
        print("  USER SEARCH FUNCTIONALITY - COMPREHENSIVE TEST SUITE")
        print("="*80)
        print(f"  Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  API:  {API_URL}")
        print("="*80)
        
        # Run tests
        if not self.test_login():
            print("\n❌ Cannot proceed without authentication")
            return False
        
        self.test_search_by_exact_id()
        self.test_search_by_full_name()
        self.test_search_by_partial_name()
        self.test_case_insensitive_search()
        self.test_employee_assets()
        self.test_error_handling()
        self.test_no_token()
        
        # Print summary
        return self.print_summary()

if __name__ == "__main__":
    tester = TestUserSearch()
    success = tester.run_all_tests()
    exit(0 if success else 1)
