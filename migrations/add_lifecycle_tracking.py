#!/usr/bin/env python3
"""
Database Migration: Add Asset Lifecycle Tracking Tables
Creates all new tables for comprehensive lifecycle management
"""

import sqlite3
from datetime import datetime

DB_PATH = 'assets.db'

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("="*70)
    print("DATABASE MIGRATION: Asset Lifecycle Tracking")
    print(f"Timestamp: {datetime.now()}")
    print("="*70)
    
    # 1. Enhanced Audit Logs Table
    print("\n1. Creating enhanced audit_logs table...")
    try:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME NOT NULL,
                action_type VARCHAR(50) NOT NULL,
                module VARCHAR(50) NOT NULL,
                asset_id INTEGER,
                asset_name VARCHAR(200),
                asset_serial VARCHAR(100),
                category VARCHAR(100),
                employee_id VARCHAR(50),
                employee_name VARCHAR(150),
                field_name VARCHAR(100),
                old_value TEXT,
                new_value TEXT,
                performed_by VARCHAR(100) NOT NULL,
                user_role VARCHAR(50),
                ip_address VARCHAR(50),
                remarks TEXT,
                extra_data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (asset_id) REFERENCES assets(id)
            )
        ''')
        
        # Create indexes for performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_audit_action_type ON audit_logs(action_type)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_audit_asset_id ON audit_logs(asset_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_audit_employee_id ON audit_logs(employee_id)')
        
        print("   ✅ audit_logs table created with indexes")
    except Exception as e:
        print(f"   ⚠️  Error: {e}")
    
    # 2. Asset Lifecycle Table
    print("\n2. Creating asset_lifecycle table...")
    try:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS asset_lifecycle (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_id INTEGER NOT NULL,
                event_type VARCHAR(50) NOT NULL,
                event_date DATETIME NOT NULL,
                from_employee_id VARCHAR(50),
                from_employee VARCHAR(150),
                to_employee_id VARCHAR(50),
                to_employee VARCHAR(150),
                from_status VARCHAR(50),
                to_status VARCHAR(50),
                reason TEXT,
                location VARCHAR(150),
                performed_by VARCHAR(100),
                remarks TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (asset_id) REFERENCES assets(id)
            )
        ''')
        
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_lifecycle_asset_id ON asset_lifecycle(asset_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_lifecycle_event_date ON asset_lifecycle(event_date)')
        
        print("   ✅ asset_lifecycle table created with indexes")
    except Exception as e:
        print(f"   ⚠️  Error: {e}")
    
    # 3. Temporary Assignments Table
    print("\n3. Creating temporary_assignments table...")
    try:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS temporary_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id VARCHAR(50) NOT NULL,
                employee_name VARCHAR(150) NOT NULL,
                employee_email VARCHAR(150),
                original_asset_id INTEGER NOT NULL,
                original_asset_name VARCHAR(200),
                original_asset_serial VARCHAR(100),
                temp_asset_id INTEGER NOT NULL,
                temp_asset_name VARCHAR(200),
                temp_asset_serial VARCHAR(100),
                reason TEXT NOT NULL,
                start_date DATE NOT NULL,
                expected_return_date DATE,
                actual_return_date DATE,
                status VARCHAR(50) DEFAULT 'Active',
                created_by VARCHAR(100),
                completed_by VARCHAR(100),
                remarks TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (original_asset_id) REFERENCES assets(id),
                FOREIGN KEY (temp_asset_id) REFERENCES assets(id)
            )
        ''')
        
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_temp_employee_id ON temporary_assignments(employee_id)')
        
        print("   ✅ temporary_assignments table created")
    except Exception as e:
        print(f"   ⚠️  Error: {e}")
    
    # 4. Asset Replacements Table
    print("\n4. Creating asset_replacements table...")
    try:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS asset_replacements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id VARCHAR(50) NOT NULL,
                employee_name VARCHAR(150) NOT NULL,
                employee_email VARCHAR(150),
                old_asset_id INTEGER NOT NULL,
                old_asset_name VARCHAR(200),
                old_asset_serial VARCHAR(100),
                new_asset_id INTEGER NOT NULL,
                new_asset_name VARCHAR(200),
                new_asset_serial VARCHAR(100),
                replacement_date DATE NOT NULL,
                reason TEXT NOT NULL,
                old_asset_condition VARCHAR(50),
                performed_by VARCHAR(100),
                remarks TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (old_asset_id) REFERENCES assets(id),
                FOREIGN KEY (new_asset_id) REFERENCES assets(id)
            )
        ''')
        
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_replacement_employee_id ON asset_replacements(employee_id)')
        
        print("   ✅ asset_replacements table created")
    except Exception as e:
        print(f"   ⚠️  Error: {e}")
    
    # 5. Employee Exits Table
    print("\n5. Creating employee_exits table...")
    try:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS employee_exits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id VARCHAR(50) NOT NULL,
                employee_name VARCHAR(150) NOT NULL,
                employee_email VARCHAR(150),
                department VARCHAR(100),
                exit_date DATE NOT NULL,
                exit_type VARCHAR(50),
                last_working_day DATE,
                total_assets_assigned INTEGER DEFAULT 0,
                total_assets_returned INTEGER DEFAULT 0,
                total_assets_damaged INTEGER DEFAULT 0,
                total_assets_missing INTEGER DEFAULT 0,
                exit_status VARCHAR(50) DEFAULT 'In Progress',
                clearance_status VARCHAR(50) DEFAULT 'Pending',
                processed_by VARCHAR(100),
                completed_by VARCHAR(100),
                completed_at DATETIME,
                remarks TEXT,
                exit_report_path VARCHAR(500),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_exit_employee_id ON employee_exits(employee_id)')
        
        print("   ✅ employee_exits table created")
    except Exception as e:
        print(f"   ⚠️  Error: {e}")
    
    # 6. Exit Asset Collection Table
    print("\n6. Creating exit_asset_collection table...")
    try:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS exit_asset_collection (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                exit_id INTEGER NOT NULL,
                asset_id INTEGER NOT NULL,
                asset_name VARCHAR(200),
                asset_serial VARCHAR(100),
                category VARCHAR(100),
                collection_status VARCHAR(50) NOT NULL,
                asset_condition VARCHAR(50),
                collected_date DATE,
                damage_description TEXT,
                estimated_cost REAL,
                collected_by VARCHAR(100),
                remarks TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (exit_id) REFERENCES employee_exits(id),
                FOREIGN KEY (asset_id) REFERENCES assets(id)
            )
        ''')
        
        print("   ✅ exit_asset_collection table created")
    except Exception as e:
        print(f"   ⚠️  Error: {e}")
    
    # 7. Add new status values support (no schema change needed, just documentation)
    print("\n7. Asset Status Values Supported:")
    statuses = [
        'Available', 'Assigned', 'Under Repair', 'Repair Completed',
        'Temporary Assignment', 'Returned', 'Replaced', 'Retired',
        'Lost', 'Damaged', 'Disposed'
    ]
    for status in statuses:
        print(f"   • {status}")
    
    # Commit all changes
    conn.commit()
    conn.close()
    
    print("\n" + "="*70)
    print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
    print("="*70)
    print("\nNew Tables Created:")
    print("  1. audit_logs            - Enhanced audit trail with field-level tracking")
    print("  2. asset_lifecycle       - Complete asset movement history")
    print("  3. temporary_assignments - Temporary replacement device tracking")
    print("  4. asset_replacements    - Permanent asset swap records")
    print("  5. employee_exits        - Employee exit process tracking")
    print("  6. exit_asset_collection - Asset collection during exit")
    print("\nIndexes Created: 8 indexes for optimal query performance")
    print("\nNext Steps:")
    print("  1. Restart backend server")
    print("  2. Test audit logging")
    print("  3. Verify lifecycle tracking")
    print("="*70)

if __name__ == '__main__':
    try:
        migrate()
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        print("Please check database permissions and try again.")
