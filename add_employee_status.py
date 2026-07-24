#!/usr/bin/env python3
"""
Add status column to employees table
"""
import sqlite3

def add_employee_status_column():
    conn = sqlite3.connect('/home/administrator/Desktop/asset-management/assets.db')
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(employees)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'status' not in columns:
            print("Adding 'status' column to employees table...")
            cursor.execute("ALTER TABLE employees ADD COLUMN status VARCHAR(50) DEFAULT 'Active'")
            
            # Update existing employees to Active
            cursor.execute("UPDATE employees SET status = 'Active' WHERE status IS NULL")
            
            conn.commit()
            print("✅ Status column added successfully!")
        else:
            print("ℹ️  Status column already exists")
            
        # Check if exit_date column exists
        if 'exit_date' not in columns:
            print("Adding 'exit_date' column to employees table...")
            cursor.execute("ALTER TABLE employees ADD COLUMN exit_date DATE")
            conn.commit()
            print("✅ Exit_date column added successfully!")
        else:
            print("ℹ️  Exit_date column already exists")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    add_employee_status_column()
