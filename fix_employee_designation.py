#!/usr/bin/env python3
"""
Database migration script to add missing 'designation' column to employees table
"""
import sqlite3
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()

from db_config import resolve_database_uri, DatabaseConfigError

def fix_employee_table():
    try:
        _db_uri, _app_env = resolve_database_uri(os.path.dirname(os.path.abspath(__file__)))
    except DatabaseConfigError as exc:
        raise SystemExit(str(exc))
    db_path = _db_uri.replace('sqlite:///', '')
    
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
