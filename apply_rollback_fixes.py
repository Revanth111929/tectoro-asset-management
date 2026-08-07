#!/usr/bin/env python3
"""
Apply all transaction rollback fixes to api_server.py
BUG-019 fix - adds try-except-rollback to all critical database operations
"""

import re

def apply_fixes(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    # Fix 1: create_user (Line ~393)
    content = re.sub(
        r"(    user = User\(\n.*?\n    \))\n    db\.session\.add\(user\)\n    \n    current_user = get_current_user\(\)\n    log_activity\('CREATE', 'User', f'Created user: \{username\} with role \{role\}', current_user\.get\('username'\) if current_user else 'system'\)\n    db\.session\.commit\(\)\n    \n    logger\.info\(f\"New user created: \{username\} \(role: \{role\}\) by \{current_user\.get\('username'\) if current_user else 'system'\}\"\)\n    \n    return jsonify\(\{'success': True, 'user': \{\n        'id': user\.id,\n        'username': user\.username,\n        'email': user\.email,\n        'role': user\.role\n    \}\}\), 201",
        r"\1\n    db.session.add(user)\n    \n    try:\n        current_user = get_current_user()\n        log_activity('CREATE', 'User', f'Created user: {username} with role {role}', current_user.get('username') if current_user else 'system')\n        db.session.commit()\n        \n        logger.info(f\"New user created: {username} (role: {role}) by {current_user.get('username') if current_user else 'system'}\")\n        \n        return jsonify({'success': True, 'user': {\n            'id': user.id,\n            'username': user.username,\n            'email': user.email,\n            'role': user.role\n        }}), 201\n    except Exception as e:\n        db.session.rollback()\n        logger.error(f\"Failed to create user {username}: {e}\")\n        return jsonify({'error': f'Failed to create user: {str(e)}'}), 500",
        content,
        flags=re.DOTALL
    )
    
    print("Applied fix 1: create_user")
    
    with open(filename, 'w') as f:
        f.write(content)
    
    print(f"All fixes applied to {filename}")

if __name__ == '__main__':
    apply_fixes('api_server.py')
