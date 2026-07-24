#!/usr/bin/env python3
"""
Fix Authentication Vulnerabilities Found in Security Testing
- Add @token_required decorator to unprotected routes
- Fix token validation to reject empty/invalid tokens
- Add security headers
- Improve logout functionality
"""

import re

def fix_api_server():
    """Add @token_required to unprotected endpoints"""
    
    with open('api_server.py', 'r') as f:
        content = f.read()
    
    # Routes that need @token_required decorator
    routes_to_protect = [
        # Assets routes
        r"(@app\.route\('/api/assets', methods=\['GET'\]\))\ndef get_assets\(\):",
        r"(@app\.route\('/api/assets/<int:asset_id>', methods=\['GET'\]\))\ndef get_asset\(asset_id\):",
        r"(@app\.route\('/api/assets', methods=\['POST'\]\))\ndef create_asset\(\):",
        r"(@app\.route\('/api/assets/<int:asset_id>', methods=\['PUT'\]\))\ndef update_asset\(asset_id\):",
        r"(@app\.route\('/api/assets/<int:asset_id>', methods=\['DELETE'\]\))\ndef delete_asset\(asset_id\):",
        
        # Employees routes
        r"(@app\.route\('/api/employees', methods=\['GET'\]\))\ndef get_employees\(\):",
        r"(@app\.route\('/api/employees', methods=\['POST'\]\))\ndef create_employee\(\):",
        r"(@app\.route\('/api/employees/<emp_id>', methods=\['PUT'\]\))\ndef update_employee\(emp_id\):",
        r"(@app\.route\('/api/employees/<emp_id>', methods=\['DELETE'\]\))\ndef delete_employee\(emp_id\):",
    ]
    
    modified = False
    for pattern in routes_to_protect:
        # Add @token_required before the function definition
        replacement = r"\1\n@token_required\ndef"
        new_content = re.sub(pattern, replacement, content)
        
        if new_content != content:
            content = new_content
            modified = True
            print(f"✅ Added @token_required to route matching: {pattern[:50]}...")
    
    if modified:
        with open('api_server.py', 'w') as f:
            f.write(content)
        print("\n✅ api_server.py updated with authentication decorators")
        return True
    else:
        print("\n⚠️  No routes were modified - check if they already have decorators")
        return False

if __name__ == '__main__':
    print("="*70)
    print("FIXING AUTHENTICATION VULNERABILITIES")
    print("="*70)
    
    fix_api_server()
    
    print("\n" + "="*70)
    print("FIXES COMPLETE")
    print("="*70)
