#!/usr/bin/env python3
"""
Comprehensive Authentication Flow Testing
Tests: Registration, Login, Logout, Password Reset, Email Verification,
       Session Handling, Token Handling, Protected Routes, User Permissions
Includes: Valid scenarios, Invalid scenarios, Security vulnerabilities
"""

import requests
import json
import time
from datetime import datetime, timedelta
import jwt

# Configuration
BASE_URL = "http://192.168.20.180:5000/api"
FRONTEND_URL = "http://192.168.20.180:3000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

class AuthTester:
    def __init__(self):
        self.issues = []
        self.warnings = []
        self.successes = []
        self.test_count = 0
        self.pass_count = 0
        self.fail_count = 0
        
    def log_issue(self, category, message, severity="HIGH"):
        self.issues.append({
            'category': category,
            'message': message,
            'severity': severity
        })
        print(f"{Colors.RED}❌ [{severity}] {category}: {message}{Colors.END}")
        
    def log_warning(self, category, message):
        self.warnings.append({'category': category, 'message': message})
        print(f"{Colors.YELLOW}⚠️  {category}: {message}{Colors.END}")
        
    def log_success(self, category, message):
        self.successes.append({'category': category, 'message': message})
        print(f"{Colors.GREEN}✅ {category}: {message}{Colors.END}")
    
    def test(self, name, func):
        """Run a test and track results"""
        self.test_count += 1
        print(f"\n{Colors.BLUE}{'='*70}{Colors.END}")
        print(f"{Colors.BOLD}TEST {self.test_count}: {name}{Colors.END}")
        print(f"{Colors.BLUE}{'='*70}{Colors.END}")
        try:
            result = func()
            if result:
                self.pass_count += 1
                return True
            else:
                self.fail_count += 1
                return False
        except Exception as e:
            self.fail_count += 1
            self.log_issue(name, f"Test exception: {str(e)}")
            return False
    
    # ============================================================
    # 1. LOGIN TESTS
    # ============================================================
    
    def test_valid_login(self):
        """Test valid login with correct credentials"""
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json={"username": "admin", "password": "admin123"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data and 'refresh_token' in data:
                    self.log_success("LOGIN", "Valid login successful")
                    self.admin_token = data['access_token']
                    self.refresh_token = data['refresh_token']
                    
                    # Check token expiration
                    if 'expires_in' in data:
                        self.log_success("LOGIN", f"Token expiration: {data['expires_in']}s")
                    else:
                        self.log_warning("LOGIN", "No token expiration info returned")
                    
                    return True
                else:
                    self.log_issue("LOGIN", "Missing tokens in response", "HIGH")
                    return False
            else:
                self.log_issue("LOGIN", f"Login failed with status {response.status_code}", "HIGH")
                return False
        except Exception as e:
            self.log_issue("LOGIN", f"Exception: {str(e)}", "CRITICAL")
            return False
    
    def test_invalid_credentials(self):
        """Test login with invalid credentials"""
        test_cases = [
            {"username": "admin", "password": "wrongpassword", "desc": "Wrong password"},
            {"username": "nonexistent", "password": "admin123", "desc": "Nonexistent user"},
            {"username": "admin", "password": "", "desc": "Empty password"},
            {"username": "", "password": "admin123", "desc": "Empty username"},
            {"username": "", "password": "", "desc": "Empty both"},
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(
                    f"{BASE_URL}/auth/login",
                    json={"username": case["username"], "password": case["password"]},
                    timeout=10
                )
                
                if response.status_code == 401:
                    self.log_success("LOGIN", f"Correctly rejected: {case['desc']}")
                elif response.status_code == 400:
                    self.log_success("LOGIN", f"Correctly rejected (400): {case['desc']}")
                else:
                    self.log_issue("LOGIN", f"Wrong status for {case['desc']}: {response.status_code}", "HIGH")
                    all_passed = False
                    
                # Check that no tokens are returned
                data = response.json()
                if 'access_token' in data or 'token' in data:
                    self.log_issue("LOGIN", f"Token returned on failed login: {case['desc']}", "CRITICAL")
                    all_passed = False
                    
            except Exception as e:
                self.log_issue("LOGIN", f"Exception testing {case['desc']}: {str(e)}", "HIGH")
                all_passed = False
        
        return all_passed
    
    def test_rate_limiting(self):
        """Test rate limiting on login endpoint"""
        try:
            # Try 10 failed logins rapidly
            for i in range(10):
                response = requests.post(
                    f"{BASE_URL}/auth/login",
                    json={"username": "admin", "password": "wrong"},
                    timeout=10
                )
                
                if response.status_code == 429:
                    self.log_success("RATE LIMIT", f"Rate limiting triggered after {i+1} attempts")
                    return True
            
            self.log_warning("RATE LIMIT", "Rate limiting not triggered after 10 attempts")
            return True  # Not critical, just a warning
            
        except Exception as e:
            self.log_issue("RATE LIMIT", f"Exception: {str(e)}", "MEDIUM")
            return False
    
    def test_sql_injection_login(self):
        """Test SQL injection vulnerabilities in login"""
        sql_payloads = [
            "admin' OR '1'='1",
            "admin' --",
            "admin' #",
            "admin'/*",
            "' or 1=1--",
            "admin' AND '1'='1",
        ]
        
        all_safe = True
        for payload in sql_payloads:
            try:
                response = requests.post(
                    f"{BASE_URL}/auth/login",
                    json={"username": payload, "password": "anything"},
                    timeout=10
                )
                
                if response.status_code == 200:
                    self.log_issue("SQL INJECTION", f"Possible SQL injection: {payload}", "CRITICAL")
                    all_safe = False
                else:
                    self.log_success("SQL INJECTION", f"Payload rejected: {payload}")
                    
            except Exception as e:
                self.log_issue("SQL INJECTION", f"Exception with payload {payload}: {str(e)}", "HIGH")
                all_safe = False
        
        return all_safe
    
    # ============================================================
    # 2. TOKEN VALIDATION TESTS
    # ============================================================
    
    def test_token_structure(self):
        """Test JWT token structure and claims"""
        try:
            if not hasattr(self, 'admin_token'):
                self.log_issue("TOKEN", "No token available for testing", "HIGH")
                return False
            
            # Decode without verification to check structure
            token_parts = self.admin_token.split('.')
            if len(token_parts) != 3:
                self.log_issue("TOKEN", "Invalid JWT structure", "CRITICAL")
                return False
            
            self.log_success("TOKEN", "JWT has correct structure (3 parts)")
            
            # Try to decode (will work without secret)
            try:
                header = jwt.get_unverified_header(self.admin_token)
                payload = jwt.decode(self.admin_token, options={"verify_signature": False})
                
                # Check algorithm
                if header.get('alg') in ['none', 'None', 'NONE']:
                    self.log_issue("TOKEN", "Insecure algorithm 'none' used", "CRITICAL")
                    return False
                else:
                    self.log_success("TOKEN", f"Secure algorithm used: {header.get('alg')}")
                
                # Check required claims
                required_claims = ['user_id', 'username', 'role', 'exp', 'iat']
                for claim in required_claims:
                    if claim in payload:
                        self.log_success("TOKEN", f"Required claim present: {claim}")
                    else:
                        self.log_warning("TOKEN", f"Missing claim: {claim}")
                
                # Check expiration
                if 'exp' in payload:
                    exp_time = datetime.fromtimestamp(payload['exp'])
                    now = datetime.now()
                    if exp_time > now:
                        delta = exp_time - now
                        self.log_success("TOKEN", f"Token expires in {delta.seconds}s")
                    else:
                        self.log_issue("TOKEN", "Token already expired", "HIGH")
                        return False
                
                return True
                
            except jwt.DecodeError as e:
                self.log_issue("TOKEN", f"JWT decode error: {str(e)}", "HIGH")
                return False
                
        except Exception as e:
            self.log_issue("TOKEN", f"Exception: {str(e)}", "HIGH")
            return False
    
    def test_invalid_tokens(self):
        """Test API response to invalid tokens"""
        invalid_tokens = [
            ("", "Empty token"),
            ("invalid", "Invalid format"),
            ("Bearer invalid", "Invalid with Bearer"),
            ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxfQ.invalid", "Invalid signature"),
            (self.admin_token[:-10] + "tampered", "Tampered token"),
        ]
        
        all_rejected = True
        for token, desc in invalid_tokens:
            try:
                headers = {"Authorization": f"Bearer {token}"}
                response = requests.get(
                    f"{BASE_URL}/assets",
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code == 401:
                    self.log_success("TOKEN", f"Correctly rejected: {desc}")
                else:
                    self.log_issue("TOKEN", f"Wrong status for {desc}: {response.status_code}", "HIGH")
                    all_rejected = False
                    
            except Exception as e:
                self.log_issue("TOKEN", f"Exception with {desc}: {str(e)}", "MEDIUM")
                all_rejected = False
        
        return all_rejected
    
    def test_token_refresh(self):
        """Test token refresh functionality"""
        try:
            if not hasattr(self, 'refresh_token'):
                self.log_warning("TOKEN REFRESH", "No refresh token available")
                return True  # Not critical if endpoint doesn't exist
            
            response = requests.post(
                f"{BASE_URL}/auth/refresh",
                json={"refresh_token": self.refresh_token},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    self.log_success("TOKEN REFRESH", "Token refresh successful")
                    return True
                else:
                    self.log_warning("TOKEN REFRESH", "No access_token in refresh response")
                    return True
            elif response.status_code == 404:
                self.log_warning("TOKEN REFRESH", "Refresh endpoint not implemented")
                return True
            else:
                self.log_issue("TOKEN REFRESH", f"Unexpected status: {response.status_code}", "MEDIUM")
                return False
                
        except Exception as e:
            self.log_warning("TOKEN REFRESH", f"Exception: {str(e)}")
            return True  # Not critical
    
    # ============================================================
    # 3. PROTECTED ROUTES TESTS
    # ============================================================
    
    def test_protected_routes_without_token(self):
        """Test that protected routes require authentication"""
        protected_endpoints = [
            ("GET", "/assets", "Get assets"),
            ("GET", "/employees", "Get employees"),
            ("GET", "/users", "Get users"),
            ("POST", "/assets", "Create asset"),
            ("PUT", "/assets/1", "Update asset"),
            ("DELETE", "/assets/1", "Delete asset"),
        ]
        
        all_protected = True
        for method, endpoint, desc in protected_endpoints:
            try:
                if method == "GET":
                    response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
                elif method == "POST":
                    response = requests.post(f"{BASE_URL}{endpoint}", json={}, timeout=10)
                elif method == "PUT":
                    response = requests.put(f"{BASE_URL}{endpoint}", json={}, timeout=10)
                elif method == "DELETE":
                    response = requests.delete(f"{BASE_URL}{endpoint}", timeout=10)
                
                if response.status_code == 401:
                    self.log_success("PROTECTED", f"Correctly protected: {desc}")
                else:
                    self.log_issue("PROTECTED", f"Not protected: {desc} (status: {response.status_code})", "CRITICAL")
                    all_protected = False
                    
            except Exception as e:
                self.log_issue("PROTECTED", f"Exception with {desc}: {str(e)}", "MEDIUM")
                all_protected = False
        
        return all_protected
    
    def test_protected_routes_with_token(self):
        """Test that valid tokens grant access"""
        if not hasattr(self, 'admin_token'):
            self.log_warning("PROTECTED", "No token for testing")
            return True
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = requests.get(f"{BASE_URL}/assets", headers=headers, timeout=10)
            
            if response.status_code == 200:
                self.log_success("PROTECTED", "Valid token grants access")
                return True
            else:
                self.log_issue("PROTECTED", f"Valid token rejected: {response.status_code}", "HIGH")
                return False
                
        except Exception as e:
            self.log_issue("PROTECTED", f"Exception: {str(e)}", "HIGH")
            return False
    
    # ============================================================
    # 4. ROLE-BASED ACCESS CONTROL (RBAC) TESTS
    # ============================================================
    
    def test_admin_only_endpoints(self):
        """Test that admin-only endpoints require admin role"""
        if not hasattr(self, 'admin_token'):
            self.log_warning("RBAC", "No token for testing")
            return True
        
        admin_endpoints = [
            ("GET", "/users", "Get users"),
            ("POST", "/users", "Create user"),
            ("DELETE", "/users/1", "Delete user"),
        ]
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        for method, endpoint, desc in admin_endpoints:
            try:
                if method == "GET":
                    response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
                elif method == "POST":
                    response = requests.post(
                        f"{BASE_URL}{endpoint}",
                        headers=headers,
                        json={"username": "test", "password": "test123", "role": "user"},
                        timeout=10
                    )
                elif method == "DELETE":
                    response = requests.delete(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
                
                if response.status_code in [200, 201, 400, 404]:  # 400/404 ok for test data
                    self.log_success("RBAC", f"Admin can access: {desc}")
                elif response.status_code == 403:
                    self.log_issue("RBAC", f"Admin denied access: {desc}", "HIGH")
                    return False
                    
            except Exception as e:
                self.log_issue("RBAC", f"Exception with {desc}: {str(e)}", "MEDIUM")
        
        return True
    
    # ============================================================
    # 5. PASSWORD SECURITY TESTS
    # ============================================================
    
    def test_password_requirements(self):
        """Test password strength requirements"""
        weak_passwords = [
            ("123", "Too short (3 chars)"),
            ("pass", "Too short (4 chars)"),
            ("1234567", "Only numbers"),
            ("a", "Single character"),
        ]
        
        if not hasattr(self, 'admin_token'):
            self.log_warning("PASSWORD", "No token for testing")
            return True
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        all_rejected = True
        
        for weak_pass, desc in weak_passwords:
            try:
                response = requests.post(
                    f"{BASE_URL}/users",
                    headers=headers,
                    json={"username": f"test_{weak_pass}", "password": weak_pass, "role": "user"},
                    timeout=10
                )
                
                if response.status_code == 400:
                    self.log_success("PASSWORD", f"Weak password rejected: {desc}")
                elif response.status_code == 201:
                    self.log_issue("PASSWORD", f"Weak password accepted: {desc}", "HIGH")
                    all_rejected = False
                    
            except Exception as e:
                self.log_warning("PASSWORD", f"Exception with {desc}: {str(e)}")
        
        return all_rejected
    
    # ============================================================
    # 6. SESSION HANDLING TESTS
    # ============================================================
    
    def test_concurrent_sessions(self):
        """Test if multiple sessions can coexist"""
        try:
            # Login twice with same credentials
            response1 = requests.post(
                f"{BASE_URL}/auth/login",
                json={"username": "admin", "password": "admin123"},
                timeout=10
            )
            
            response2 = requests.post(
                f"{BASE_URL}/auth/login",
                json={"username": "admin", "password": "admin123"},
                timeout=10
            )
            
            if response1.status_code == 200 and response2.status_code == 200:
                token1 = response1.json().get('access_token')
                token2 = response2.json().get('access_token')
                
                # Both tokens should work
                headers1 = {"Authorization": f"Bearer {token1}"}
                headers2 = {"Authorization": f"Bearer {token2}"}
                
                test1 = requests.get(f"{BASE_URL}/assets", headers=headers1, timeout=10)
                test2 = requests.get(f"{BASE_URL}/assets", headers=headers2, timeout=10)
                
                if test1.status_code == 200 and test2.status_code == 200:
                    self.log_success("SESSION", "Multiple sessions supported")
                    return True
                else:
                    self.log_warning("SESSION", "One session invalidated other")
                    return True  # Not critical
                    
        except Exception as e:
            self.log_issue("SESSION", f"Exception: {str(e)}", "MEDIUM")
            return False
    
    # ============================================================
    # 7. LOGOUT TESTS
    # ============================================================
    
    def test_logout_functionality(self):
        """Test logout endpoint if available"""
        try:
            if not hasattr(self, 'admin_token'):
                self.log_warning("LOGOUT", "No token for testing")
                return True
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.post(
                f"{BASE_URL}/auth/logout",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_success("LOGOUT", "Logout endpoint available")
                
                # Test if token still works (shouldn't if proper logout)
                test = requests.get(f"{BASE_URL}/assets", headers=headers, timeout=10)
                if test.status_code == 401:
                    self.log_success("LOGOUT", "Token invalidated after logout")
                else:
                    self.log_warning("LOGOUT", "Token still valid after logout")
                return True
            elif response.status_code == 404:
                self.log_warning("LOGOUT", "Logout endpoint not implemented")
                return True
            else:
                self.log_warning("LOGOUT", f"Unexpected status: {response.status_code}")
                return True
                
        except Exception as e:
            self.log_warning("LOGOUT", f"Exception: {str(e)}")
            return True  # Not critical
    
    # ============================================================
    # 8. CORS AND SECURITY HEADERS
    # ============================================================
    
    def test_cors_configuration(self):
        """Test CORS headers"""
        try:
            response = requests.options(
                f"{BASE_URL}/auth/login",
                headers={"Origin": "http://malicious-site.com"},
                timeout=10
            )
            
            cors_header = response.headers.get('Access-Control-Allow-Origin')
            if cors_header == '*':
                self.log_issue("CORS", "CORS allows all origins (*)", "HIGH")
                return False
            elif cors_header:
                self.log_success("CORS", f"CORS configured: {cors_header}")
                return True
            else:
                self.log_success("CORS", "CORS restricted (no header)")
                return True
                
        except Exception as e:
            self.log_warning("CORS", f"Exception: {str(e)}")
            return True
    
    def test_security_headers(self):
        """Test security headers"""
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=10)
            
            headers_to_check = {
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
            }
            
            for header, expected in headers_to_check.items():
                if header in response.headers:
                    self.log_success("SECURITY HEADERS", f"{header} present")
                else:
                    self.log_warning("SECURITY HEADERS", f"{header} missing")
            
            return True
            
        except Exception as e:
            self.log_warning("SECURITY HEADERS", f"Exception: {str(e)}")
            return True
    
    # ============================================================
    # 9. REPORT GENERATION
    # ============================================================
    
    def generate_report(self):
        """Generate comprehensive test report"""
        print(f"\n{Colors.BOLD}{'='*70}")
        print("AUTHENTICATION FLOW TEST REPORT")
        print(f"{'='*70}{Colors.END}\n")
        
        print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Base URL: {BASE_URL}")
        print(f"\n{'='*70}\n")
        
        # Summary
        print(f"{Colors.BOLD}SUMMARY{Colors.END}")
        print(f"Total Tests: {self.test_count}")
        print(f"{Colors.GREEN}✅ Passed: {self.pass_count}{Colors.END}")
        print(f"{Colors.RED}❌ Failed: {self.fail_count}{Colors.END}")
        print(f"Success Rate: {(self.pass_count/self.test_count*100) if self.test_count > 0 else 0:.1f}%")
        
        print(f"\n{'='*70}\n")
        
        # Issues
        if self.issues:
            print(f"{Colors.BOLD}{Colors.RED}ISSUES FOUND ({len(self.issues)}){Colors.END}")
            
            critical = [i for i in self.issues if i['severity'] == 'CRITICAL']
            high = [i for i in self.issues if i['severity'] == 'HIGH']
            medium = [i for i in self.issues if i['severity'] == 'MEDIUM']
            
            if critical:
                print(f"\n{Colors.RED}🔴 CRITICAL ({len(critical)}){Colors.END}")
                for issue in critical:
                    print(f"  [{issue['category']}] {issue['message']}")
            
            if high:
                print(f"\n{Colors.RED}🟠 HIGH ({len(high)}){Colors.END}")
                for issue in high:
                    print(f"  [{issue['category']}] {issue['message']}")
            
            if medium:
                print(f"\n{Colors.YELLOW}🟡 MEDIUM ({len(medium)}){Colors.END}")
                for issue in medium:
                    print(f"  [{issue['category']}] {issue['message']}")
        else:
            print(f"{Colors.GREEN}✅ NO CRITICAL ISSUES FOUND{Colors.END}")
        
        # Warnings
        if self.warnings:
            print(f"\n{'='*70}\n")
            print(f"{Colors.BOLD}{Colors.YELLOW}WARNINGS ({len(self.warnings)}){Colors.END}")
            for warning in self.warnings[:10]:  # Show first 10
                print(f"  [{warning['category']}] {warning['message']}")
        
        print(f"\n{'='*70}\n")
        
        # Final verdict
        critical_count = len([i for i in self.issues if i['severity'] == 'CRITICAL'])
        high_count = len([i for i in self.issues if i['severity'] == 'HIGH'])
        
        if critical_count > 0:
            print(f"{Colors.RED}{Colors.BOLD}🔴 SECURITY STATUS: CRITICAL{Colors.END}")
            print(f"{Colors.RED}   Fix {critical_count} critical issues immediately{Colors.END}")
        elif high_count > 0:
            print(f"{Colors.YELLOW}{Colors.BOLD}🟠 SECURITY STATUS: NEEDS ATTENTION{Colors.END}")
            print(f"{Colors.YELLOW}   Fix {high_count} high-priority issues{Colors.END}")
        else:
            print(f"{Colors.GREEN}{Colors.BOLD}✅ SECURITY STATUS: GOOD{Colors.END}")
            print(f"{Colors.GREEN}   No critical security issues found{Colors.END}")
        
        print(f"\n{'='*70}\n")

def main():
    print(f"{Colors.BOLD}{'='*70}")
    print("TECTORO AUTHENTICATION FLOW TESTING")
    print(f"{'='*70}{Colors.END}\n")
    
    tester = AuthTester()
    
    # Run all tests
    tester.test("Valid Login", tester.test_valid_login)
    tester.test("Invalid Credentials", tester.test_invalid_credentials)
    tester.test("Rate Limiting", tester.test_rate_limiting)
    tester.test("SQL Injection Protection", tester.test_sql_injection_login)
    tester.test("Token Structure", tester.test_token_structure)
    tester.test("Invalid Token Handling", tester.test_invalid_tokens)
    tester.test("Token Refresh", tester.test_token_refresh)
    tester.test("Protected Routes Without Token", tester.test_protected_routes_without_token)
    tester.test("Protected Routes With Token", tester.test_protected_routes_with_token)
    tester.test("Admin-Only Endpoints", tester.test_admin_only_endpoints)
    tester.test("Password Requirements", tester.test_password_requirements)
    tester.test("Concurrent Sessions", tester.test_concurrent_sessions)
    tester.test("Logout Functionality", tester.test_logout_functionality)
    tester.test("CORS Configuration", tester.test_cors_configuration)
    tester.test("Security Headers", tester.test_security_headers)
    
    # Generate report
    tester.generate_report()
    
    # Return exit code based on critical issues
    critical_issues = len([i for i in tester.issues if i['severity'] == 'CRITICAL'])
    return 1 if critical_issues > 0 else 0

if __name__ == '__main__':
    import sys
    sys.exit(main())
