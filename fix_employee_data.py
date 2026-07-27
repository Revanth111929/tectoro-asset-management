#!/usr/bin/env python3
"""
Fix Employee Data Migration Script

This script fixes employee records that have NULL values for critical fields:
1. Sets is_active=True for employees where is_active is NULL
2. Sets status='Active' for employees where status is NULL
3. Sets empty strings for NULL email, department, designation fields

Usage:
    python3 fix_employee_data.py
"""

import sqlite3
from datetime import datetime

def fix_employee_data():
    print("🔧 Starting Employee Data Fix...")
    print("=" * 60)
    
    conn = sqlite3.connect('assets.db')
    cursor = conn.cursor()
    
    # 1. Fix is_active NULL values
    print("\n1. Fixing NULL is_active values...")
    cursor.execute("SELECT COUNT(*) FROM employees WHERE is_active IS NULL")
    null_active_count = cursor.fetchone()[0]
    print(f"   Found {null_active_count} employees with NULL is_active")
    
    if null_active_count > 0:
        cursor.execute("UPDATE employees SET is_active = 1 WHERE is_active IS NULL")
        print(f"   ✓ Updated {null_active_count} records to is_active=True")
    
    # 2. Fix status NULL values
    print("\n2. Fixing NULL status values...")
    cursor.execute("SELECT COUNT(*) FROM employees WHERE status IS NULL")
    null_status_count = cursor.fetchone()[0]
    print(f"   Found {null_status_count} employees with NULL status")
    
    if null_status_count > 0:
        cursor.execute("UPDATE employees SET status = 'Active' WHERE status IS NULL")
        print(f"   ✓ Updated {null_status_count} records to status='Active'")
    
    # 3. Fix NULL email values (set to empty string for consistency)
    print("\n3. Fixing NULL email values...")
    cursor.execute("SELECT COUNT(*) FROM employees WHERE email IS NULL")
    null_email_count = cursor.fetchone()[0]
    print(f"   Found {null_email_count} employees with NULL email")
    
    if null_email_count > 0:
        cursor.execute("UPDATE employees SET email = '' WHERE email IS NULL")
        print(f"   ✓ Updated {null_email_count} records to email=''")
    
    # 4. Fix NULL department values
    print("\n4. Fixing NULL department values...")
    cursor.execute("SELECT COUNT(*) FROM employees WHERE department IS NULL")
    null_dept_count = cursor.fetchone()[0]
    print(f"   Found {null_dept_count} employees with NULL department")
    
    if null_dept_count > 0:
        cursor.execute("UPDATE employees SET department = '' WHERE department IS NULL")
        print(f"   ✓ Updated {null_dept_count} records to department=''")
    
    # 5. Fix NULL designation values
    print("\n5. Fixing NULL designation values...")
    cursor.execute("SELECT COUNT(*) FROM employees WHERE designation IS NULL")
    null_desig_count = cursor.fetchone()[0]
    print(f"   Found {null_desig_count} employees with NULL designation")
    
    if null_desig_count > 0:
        cursor.execute("UPDATE employees SET designation = '' WHERE designation IS NULL")
        print(f"   ✓ Updated {null_desig_count} records to designation=''")
    
    # 6. Fix NULL location values
    print("\n6. Fixing NULL location values...")
    cursor.execute("SELECT COUNT(*) FROM employees WHERE location IS NULL")
    null_loc_count = cursor.fetchone()[0]
    print(f"   Found {null_loc_count} employees with NULL location")
    
    if null_loc_count > 0:
        cursor.execute("UPDATE employees SET location = '' WHERE location IS NULL")
        print(f"   ✓ Updated {null_loc_count} records to location=''")
    
    # 7. Fix NULL mobile_number values
    print("\n7. Fixing NULL mobile_number values...")
    cursor.execute("SELECT COUNT(*) FROM employees WHERE mobile_number IS NULL")
    null_mobile_count = cursor.fetchone()[0]
    print(f"   Found {null_mobile_count} employees with NULL mobile_number")
    
    if null_mobile_count > 0:
        cursor.execute("UPDATE employees SET mobile_number = '' WHERE mobile_number IS NULL")
        print(f"   ✓ Updated {null_mobile_count} records to mobile_number=''")
    
    # Commit all changes
    conn.commit()
    
    # Show sample of fixed records
    print("\n" + "=" * 60)
    print("✅ Migration Complete!")
    print("=" * 60)
    print("\nSample of fixed records:")
    cursor.execute("""
        SELECT emp_id, employee_name, email, is_active, status 
        FROM employees 
        ORDER BY id DESC 
        LIMIT 5
    """)
    rows = cursor.fetchall()
    print("\nEmp ID | Name | Email | Active | Status")
    print("-" * 60)
    for row in rows:
        print(f"{row[0]} | {row[1][:30]} | {row[2] or '(empty)'} | {row[3]} | {row[4]}")
    
    # Show total employee count
    cursor.execute("SELECT COUNT(*) FROM employees WHERE is_active = 1")
    total_active = cursor.fetchone()[0]
    print(f"\nTotal active employees: {total_active}")
    
    conn.close()
    print("\n✅ All employee records have been fixed!")
    print("   You can now search for all employees in the application.")

if __name__ == '__main__':
    fix_employee_data()
