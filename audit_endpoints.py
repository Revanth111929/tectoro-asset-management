#!/usr/bin/env python3
"""
Production Stabilization - Backend API Endpoint Security Audit
Systematically checks all endpoints for critical security requirements
"""

import re
import sys

# Security patterns to check
REQUIRED_PATTERNS = {
    'authentication': [
        r'@token_required',
        r'@admin_required', 
        r'@non_viewer_required',
        r'@limiter\.limit'
    ],
    'transaction': [
        r'db\.session\.commit\(\)',
        r'db\.session\.rollback\(\)'
    ],
    'validation': [
        r'request\.get_json\(\)',
        r'request\.form',
        r'request\.args'
    ],
    'error_handling': [
        r'try:',
        r'except',
        r'return jsonify.*error'
    ]
}

# Endpoints that should NOT require auth (public endpoints)
PUBLIC_ENDPOINTS = [
    '/api/auth/login',
    '/api/auth/refresh',
    '/',
    '/static'
]

def extract_endpoints(filename):
    """Extract all endpoints with their decorators and code"""
    with open(filename, 'r') as f:
        content = f.read()
    
    # Find all @app.route definitions
    pattern = r'(@[^\n]+\n)*@app\.route\([\'"]([^\'"]+)[\'"][^\)]*\)([^\n]*\n)((?:(?!@app\.route)(?!^def ).*\n)*)(def \w+[^\:]+:.*?)(?=\n@app\.route|\n\n@app\.route|$)'
    
    endpoints = []
    for match in re.finditer(r'@app\.route\([\'"]([^\'"]+)[\'"][^\)]*\)[^\n]*\n([^\n]+def (\w+)[^\:]+:)', content):
        route = match.group(1)
        func_name = match.group(3)
        
        # Get all decorators before this route
        start = match.start()
        lines_before = content[:start].split('\n')
        decorators = []
        for line in reversed(lines_before[-10:]):  # Check last 10 lines
            line = line.strip()
            if line.startswith('@') and 'app.route' not in line:
                decorators.insert(0, line)
            elif line and not line.startswith('#'):
                break
        
        # Get function body (next 100 lines)
        func_start = match.end()
        func_lines = content[func_start:].split('\n')[:100]
        func_body = '\n'.join(func_lines)
        
        endpoints.append({
            'route': route,
            'function': func_name,
            'decorators': decorators,
            'body': func_body
        })
    
    return endpoints

def check_authentication(endpoint):
    """Check if endpoint has proper authentication"""
    route = endpoint['route']
    decorators = endpoint['decorators']
    
    # Public endpoints don't need auth
    for public_route in PUBLIC_ENDPOINTS:
        if route.startswith(public_route):
            return True, 'Public endpoint'
    
    # Check for auth decorators
    auth_decorators = ['@token_required', '@admin_required', '@non_viewer_required']
    has_auth = any(any(auth in dec for auth in auth_decorators) for dec in decorators)
    
    if not has_auth:
        return False, 'MISSING AUTH'
    
    return True, 'Has auth'

def check_validation(endpoint):
    """Check if endpoint validates input"""
    body = endpoint['body']
    
    # Check if endpoint accepts input
    accepts_input = any(pattern in body for pattern in [
        'request.get_json()',
        'request.json',
        'request.form',
        'request.args'
    ])
    
    if not accepts_input:
        return True, 'No input'
    
    # Check for validation
    has_validation = any(pattern in body for pattern in [
        'if not',
        'validate',
        'required',
        'ValueError',
        'len('
    ])
    
    if not has_validation:
        return False, 'MISSING VALIDATION'
    
    return True, 'Has validation'

def check_transaction_handling(endpoint):
    """Check if endpoint has proper transaction management"""
    body = endpoint['body']
    
    # Check if endpoint modifies database
    modifies_db = any(pattern in body for pattern in [
        'db.session.add(',
        'db.session.delete(',
        '.save(',
        '.update(',
        '.delete()'
    ])
    
    if not modifies_db:
        return True, 'Read-only'
    
    # Check for commit
    has_commit = 'db.session.commit()' in body
    if not has_commit:
        return False, 'MISSING COMMIT'
    
    # Check for rollback in exception handling
    has_rollback = 'db.session.rollback()' in body
    if not has_rollback:
        return False, 'MISSING ROLLBACK'
    
    return True, 'Has transaction handling'

def check_error_handling(endpoint):
    """Check if endpoint has proper error handling"""
    body = endpoint['body']
    
    # Check for try-except
    has_try_except = 'try:' in body and 'except' in body
    
    if not has_try_except:
        return False, 'MISSING ERROR HANDLING'
    
    # Check for error response
    has_error_response = 'error' in body and 'jsonify' in body
    
    if not has_error_response:
        return False, 'MISSING ERROR RESPONSE'
    
    return True, 'Has error handling'

def audit_endpoint(endpoint):
    """Run all checks on an endpoint"""
    results = {
        'route': endpoint['route'],
        'function': endpoint['function'],
        'issues': []
    }
    
    # Run checks
    checks = [
        ('Authentication', check_authentication),
        ('Validation', check_validation),
        ('Transaction', check_transaction_handling),
        ('Error Handling', check_error_handling)
    ]
    
    for check_name, check_func in checks:
        passed, message = check_func(endpoint)
        if not passed:
            results['issues'].append(f'{check_name}: {message}')
    
    return results

def main():
    print('=' * 80)
    print('PRODUCTION STABILIZATION - BACKEND API SECURITY AUDIT')
    print('=' * 80)
    print()
    
    filename = 'api_server.py'
    
    print(f'Extracting endpoints from {filename}...')
    endpoints = extract_endpoints(filename)
    print(f'Found {len(endpoints)} endpoints')
    print()
    
    print('Running security audit...')
    print('=' * 80)
    print()
    
    issues_found = []
    clean_endpoints = []
    
    for endpoint in endpoints:
        result = audit_endpoint(endpoint)
        
        if result['issues']:
            issues_found.append(result)
        else:
            clean_endpoints.append(result)
    
    # Report issues
    if issues_found:
        print(f'CRITICAL ISSUES FOUND: {len(issues_found)} endpoints with problems')
        print()
        
        for i, result in enumerate(issues_found, 1):
            print(f'{i}. {result["route"]} ({result["function"]})')
            for issue in result['issues']:
                print(f'   ❌ {issue}')
            print()
    
    # Summary
    print('=' * 80)
    print('AUDIT SUMMARY')
    print('=' * 80)
    print(f'Total endpoints:       {len(endpoints)}')
    print(f'Clean endpoints:       {len(clean_endpoints)}')
    print(f'Endpoints with issues: {len(issues_found)}')
    print()
    
    if issues_found:
        print('⚠️  PRODUCTION STABILIZATION REQUIRED')
        print('Review and fix all issues before production release.')
        return 1
    else:
        print('✅ All endpoints passed security audit')
        return 0

if __name__ == '__main__':
    sys.exit(main())
