#!/usr/bin/env python3
"""
Migration script to add employee_email column to assets table
"""

import sqlite3
import os

# Database path
DB_PATH = 'assets.db'

def add_employee_email_column():
    """Add employee_email column to assets table"""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database file '{DB_PATH}' not found!")
        return False
    
    try:
        # Connect to database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(assets)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'employee_email' in columns:
            print("✓ Column 'employee_email' already exists in assets table")
            conn.close()
            return True
        
        # Add the column
        print("Adding 'employee_email' column to assets table...")
        cursor.execute("""
            ALTER TABLE assets 
            ADD COLUMN employee_email VARCHAR(150)
        """)
        
        conn.commit()
        print("✓ Successfully added 'employee_email' column")
        
        # Verify
        cursor.execute("PRAGMA table_info(assets)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'employee_email' in columns:
            print("✓ Verification successful - column exists")
            conn.close()
            return True
        else:
            print("❌ Verification failed - column not found")
            conn.close()
            return False
            
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("Database Migration: Add employee_email Column")
    print("=" * 60)
    
    success = add_employee_email_column()
    
    print("=" * 60)
    if success:
        print("✓ Migration completed successfully!")
        print("\nNext steps:")
        print("1. Restart the Flask backend")
        print("2. Refresh the frontend")
    else:
        print("❌ Migration failed!")
    print("=" * 60)
