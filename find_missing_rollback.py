#!/usr/bin/env python3
"""
Find endpoints that call db.session.commit() without proper db.session.rollback() in exception handling
"""

import re

def analyze_file(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    endpoints_with_commit = []
    endpoints_with_rollback = []
    
    current_function = None
    function_start = 0
    in_function = False
    
    for i, line in enumerate(lines, 1):
        # Detect function start
        if line.strip().startswith('def ') and '(' in line:
            current_function = line.strip().split('(')[0].replace('def ', '')
            function_start = i
            in_function = True
            has_commit = False
            has_rollback = False
            
        # Check if function ended (next function or double newline at top level)
        elif in_function and (line.strip().startswith('def ') or (line.strip().startswith('@app.route') and current_function)):
            if has_commit and has_rollback:
                endpoints_with_rollback.append(current_function)
            elif has_commit and not has_rollback:
                endpoints_with_commit.append((current_function, function_start))
            in_function = False
            
            # Start new function if this is a function line
            if line.strip().startswith('def ') and '(' in line:
                current_function = line.strip().split('(')[0].replace('def ', '')
                function_start = i
                in_function = True
                has_commit = False
                has_rollback = False
            
        # Detect commit and rollback in current function
        if in_function:
            if 'db.session.commit()' in line:
                has_commit = True
            if 'db.session.rollback()' in line:
                has_rollback = True
    
    return endpoints_with_commit, endpoints_with_rollback

def main():
    filename = 'api_server.py'
    
    print('=' * 80)
    print('PRODUCTION STABILIZATION - TRANSACTION ROLLBACK AUDIT')
    print('=' * 80)
    print()
    
    endpoints_missing_rollback, endpoints_with_rollback = analyze_file(filename)
    
    print(f'Endpoints with db.session.commit(): {len(endpoints_missing_rollback) + len(endpoints_with_rollback)}')
    print(f'Endpoints WITH rollback: {len(endpoints_with_rollback)}')
    print(f'Endpoints MISSING rollback: {len(endpoints_missing_rollback)}')
    print()
    
    if endpoints_missing_rollback:
        print('=' * 80)
        print('CRITICAL: ENDPOINTS MISSING db.session.rollback()')
        print('=' * 80)
        print()
        
        for func_name, line_num in endpoints_missing_rollback:
            print(f'Line {line_num}: {func_name}()')
        
        print()
        print('⚠️  All database operations must have rollback in exception handlers')
        print('⚠️  Missing rollback can cause database corruption and connection pool exhaustion')
        return 1
    else:
        print('✅ All endpoints with db.session.commit() have proper rollback')
        return 0

if __name__ == '__main__':
    import sys
    sys.exit(main())
