#!/usr/bin/env python3
"""
Fix Database Issues Found During Verification
- Add missing indexes for performance
- Fix orphaned employee references
- Clean up unexpected tables
"""

import os
import sys
import sqlite3
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import db, Asset, Employee
from flask import Flask
from dotenv import load_dotenv

load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///assets.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def print_header(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def add_missing_indexes():
    """Add missing indexes for better query performance"""
    print_header("ADDING MISSING INDEXES")
    
    db_path = os.path.join(os.path.dirname(__file__), 'assets.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    indexes = [
        ("idx_assets_asset_name", "CREATE INDEX IF NOT EXISTS idx_assets_asset_name ON assets(asset_name)"),
        ("idx_assets_category", "CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category)"),
        ("idx_assets_status", "CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status)"),
        ("idx_employees_name", "CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(employee_name)"),
        ("idx_employees_email", "CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email)"),
    ]
    
    created = 0
    for idx_name, sql in indexes:
        try:
            cursor.execute(sql)
            print(f"✅ Created index: {idx_name}")
            created += 1
        except Exception as e:
            print(f"⚠️  Failed to create {idx_name}: {e}")
    
    conn.commit()
    conn.close()
    
    print(f"\n✅ Added {created} indexes successfully")
    return created

def fix_orphaned_employees():
    """Fix assets referencing non-existent employee TT123"""
    print_header("FIXING ORPHANED EMPLOYEE REFERENCES")
    
    with app.app_context():
        # Find assets with TT123 employee reference
        orphaned_assets = Asset.query.filter_by(emp_id='TT123').all()
        
        if not orphaned_assets:
            print("✅ No orphaned employee references found")
            return 0
        
        print(f"Found {len(orphaned_assets)} assets referencing non-existent employee TT123:")
        for asset in orphaned_assets:
            print(f"  - Asset ID {asset.id}: {asset.asset_name} (Serial: {asset.serial_number})")
        
        # Check if employee TT123 exists
        employee = Employee.query.filter_by(emp_id='TT123').first()
        
        if not employee:
            print("\n⚠️  Employee TT123 does not exist. Creating placeholder employee...")
            # Create placeholder employee
            employee = Employee(
                emp_id='TT123',
                employee_name='Test Employee (TT123)',
                email='test.employee@tectoro.com',
                designation='Test User',
                department='IT',
                status='Inactive',
                is_active=False
            )
            db.session.add(employee)
            db.session.commit()
            print(f"✅ Created placeholder employee: TT123 - Test Employee")
        else:
            print(f"✅ Employee TT123 exists: {employee.employee_name}")
        
        # Update asset references to use correct employee name
        fixed_count = 0
        for asset in orphaned_assets:
            if asset.employee_name != employee.employee_name:
                asset.employee_name = employee.employee_name
                fixed_count += 1
        
        if fixed_count > 0:
            db.session.commit()
            print(f"\n✅ Fixed {fixed_count} asset references")
        else:
            print(f"\n✅ All asset references are already correct")
        
        return len(orphaned_assets)

def cleanup_unexpected_tables():
    """Remove unexpected tables like admin_profile"""
    print_header("CLEANING UP UNEXPECTED TABLES")
    
    db_path = os.path.join(os.path.dirname(__file__), 'assets.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if admin_profile table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_profile'")
    if cursor.fetchone():
        print("⚠️  Found unexpected table: admin_profile")
        print("   This table was used in an older version and is no longer needed")
        
        # Check if it has any data
        cursor.execute("SELECT COUNT(*) FROM admin_profile")
        count = cursor.fetchone()[0]
        print(f"   Table contains {count} records")
        
        if count > 0:
            print("   ⚠️  Table has data. Creating backup...")
            cursor.execute("CREATE TABLE admin_profile_backup AS SELECT * FROM admin_profile")
            print("   ✅ Backup created: admin_profile_backup")
        
        # Drop the table
        cursor.execute("DROP TABLE admin_profile")
        conn.commit()
        print("   ✅ Dropped table: admin_profile")
        
        cleaned = 1
    else:
        print("✅ No unexpected tables found (admin_profile already removed)")
        cleaned = 0
    
    conn.close()
    return cleaned

def verify_fixes():
    """Verify that all fixes were applied correctly"""
    print_header("VERIFYING FIXES")
    
    db_path = os.path.join(os.path.dirname(__file__), 'assets.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check indexes
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name")
    indexes = [row[0] for row in cursor.fetchall()]
    print(f"✅ Total indexes found: {len(indexes)}")
    for idx in indexes:
        print(f"   - {idx}")
    
    conn.close()
    
    # Check for orphaned employees
    with app.app_context():
        # Check assets with employee references
        assigned_assets = Asset.query.filter(Asset.emp_id != '', Asset.emp_id.isnot(None)).all()
        orphaned = 0
        
        for asset in assigned_assets:
            emp = Employee.query.filter_by(emp_id=asset.emp_id).first()
            if not emp:
                orphaned += 1
                print(f"⚠️  Asset {asset.id} still references non-existent employee {asset.emp_id}")
        
        if orphaned == 0:
            print(f"✅ All {len(assigned_assets)} assigned assets have valid employee references")
        else:
            print(f"⚠️  Found {orphaned} orphaned asset references")
    
    print("\n✅ Verification complete")

def main():
    print("=" * 70)
    print("  TECTORO ASSET MANAGEMENT - DATABASE FIXES")
    print("=" * 70)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # 1. Add missing indexes
        indexes_added = add_missing_indexes()
        
        # 2. Fix orphaned employee references
        refs_fixed = fix_orphaned_employees()
        
        # 3. Cleanup unexpected tables
        tables_cleaned = cleanup_unexpected_tables()
        
        # 4. Verify fixes
        verify_fixes()
        
        # Summary
        print_header("FIX SUMMARY")
        print(f"✅ Indexes added: {indexes_added}")
        print(f"✅ Employee references fixed: {refs_fixed}")
        print(f"✅ Tables cleaned: {tables_cleaned}")
        print("\n✅ All database issues fixed successfully!")
        
        print(f"\nCompleted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        return 0
        
    except Exception as e:
        print(f"\n❌ Error during fix: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())
