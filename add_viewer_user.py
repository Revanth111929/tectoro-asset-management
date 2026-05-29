#!/usr/bin/env python3
"""
Script to add a viewer (read-only) user to the asset management system.
Usage: python3 add_viewer_user.py
"""

import sqlite3
from werkzeug.security import generate_password_hash
import sys

def add_viewer_user(username, password):
    """Add a new viewer user to the database"""
    try:
        conn = sqlite3.connect('assets.db')
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
        if cursor.fetchone():
            print(f"❌ Error: User '{username}' already exists!")
            conn.close()
            return False
        
        # Hash the password
        password_hash = generate_password_hash(password)
        
        # Insert new viewer user
        cursor.execute(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            (username, password_hash, 'viewer')
        )
        
        conn.commit()
        conn.close()
        
        print(f"✓ Successfully created viewer user: {username}")
        print(f"  Username: {username}")
        print(f"  Password: {password}")
        print(f"  Role: viewer (read-only access)")
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("=" * 60)
    print("Add Viewer User to Asset Management System")
    print("=" * 60)
    print()
    
    # Get username
    username = input("Enter username for viewer: ").strip()
    if not username:
        print("❌ Username cannot be empty!")
        sys.exit(1)
    
    # Get password
    password = input("Enter password: ").strip()
    if not password:
        print("❌ Password cannot be empty!")
        sys.exit(1)
    
    # Confirm password
    password_confirm = input("Confirm password: ").strip()
    if password != password_confirm:
        print("❌ Passwords do not match!")
        sys.exit(1)
    
    print()
    print(f"Creating viewer user '{username}'...")
    
    if add_viewer_user(username, password):
        print()
        print("=" * 60)
        print("User created successfully!")
        print("=" * 60)
        print()
        print("Viewer users have read-only access:")
        print("  ✓ Can view all assets and inventory")
        print("  ✓ Can view reports and warranty information")
        print("  ✓ Can export data")
        print("  ✗ Cannot add, edit, or delete assets")
        print("  ✗ Cannot access settings")
        print()
    else:
        sys.exit(1)

if __name__ == '__main__':
    main()
