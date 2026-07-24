#!/usr/bin/env python3
"""
Quick script to add email to an existing asset
"""
import sqlite3
import sys

def add_email_to_asset(asset_id, email):
    try:
        conn = sqlite3.connect('assets.db')
        cursor = conn.cursor()
        
        # Check if asset exists
        cursor.execute('SELECT id, asset_name, employee_name FROM assets WHERE id = ?', (asset_id,))
        asset = cursor.fetchone()
        
        if not asset:
            print(f"❌ Asset ID {asset_id} not found!")
            conn.close()
            return False
        
        print(f"Found asset:")
        print(f"  ID: {asset[0]}")
        print(f"  Name: {asset[1]}")
        print(f"  Employee: {asset[2]}")
        print()
        
        # Update email
        cursor.execute(
            'UPDATE assets SET employee_email = ? WHERE id = ?',
            (email, asset_id)
        )
        
        conn.commit()
        print(f"✅ Email updated successfully!")
        print(f"   Asset ID {asset_id} now has email: {email}")
        
        # Verify
        cursor.execute('SELECT employee_email FROM assets WHERE id = ?', (asset_id,))
        result = cursor.fetchone()
        print(f"   Verified: {result[0]}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("Add Email to Existing Asset")
    print("=" * 60)
    print()
    
    if len(sys.argv) == 3:
        # Command line arguments
        asset_id = int(sys.argv[1])
        email = sys.argv[2]
    else:
        # Interactive mode
        asset_id = input("Enter Asset ID: ").strip()
        if not asset_id:
            print("❌ Asset ID is required!")
            sys.exit(1)
        
        asset_id = int(asset_id)
        
        email = input("Enter Employee Email: ").strip()
        if not email:
            print("❌ Email is required!")
            sys.exit(1)
    
    print()
    if add_email_to_asset(asset_id, email):
        print()
        print("=" * 60)
        print("✅ Done! You can now send acknowledgment email.")
        print("=" * 60)
    else:
        sys.exit(1)
