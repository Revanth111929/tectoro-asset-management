#!/usr/bin/env python3
"""
Database migration script to add missing 'designation' column to employees table
"""
import sqlite3
import os

def fix_employee_table():
    db_path = os.path.join(os.path.dirname(__file__), 'assets.db')
    
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if designation column exists
    cursor.execute("PRAGMA table_info(employees)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'designation' in columns:
        print("✓ Column 'designation' already exists in employees table")
    else:
        print("Adding 'designation' column to employees table...")
        try:
            cursor.execute("ALTER TABLE employees ADD COLUMN designation VARCHAR(100)")
            conn.commit()
            print("✓ Successfully added 'designation' column")
        except Exception as e:
            print(f"✗ Error adding column: {e}")
            conn.rollback()
    
    # Verify the fix
    cursor.execute("PRAGMA table_info(employees)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"\nCurrent employees table columns: {', '.join(columns)}")
    
    conn.close()
    print("\n✓ Database migration completed")

if __name__ == '__main__':
    fix_employee_table()
