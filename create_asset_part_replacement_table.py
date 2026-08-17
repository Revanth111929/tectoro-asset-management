#!/usr/bin/env python3
"""
Migration Script: Create asset_part_replacements table
"""

import sqlite3
import os

def create_part_replacement_table():
    # Determine database path based on environment
    env = os.getenv('FLASK_ENV', 'office')
    
    if env == 'development':
        db_path = 'databases/dev_assets.db'
    elif env == 'testing':
        db_path = 'databases/test_assets.db'
    else:  # office (production)
        db_path = 'databases/local_assets.db'
    
    print(f"Environment: {env}")
    print(f"Database: {db_path}")
    
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if table already exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='asset_part_replacements'
        """)
        
        if cursor.fetchone():
            print("✓ Table asset_part_replacements already exists")
            conn.close()
            return True
        
        # Create the table
        cursor.execute("""
            CREATE TABLE asset_part_replacements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_id INTEGER NOT NULL,
                
                -- Component Information
                component_name VARCHAR(100) NOT NULL,
                replacement_reason VARCHAR(100) NOT NULL,
                replacement_date DATE NOT NULL,
                
                -- Old Part Details
                old_part_serial VARCHAR(100),
                old_part_number VARCHAR(100),
                old_manufacturer VARCHAR(150),
                old_condition VARCHAR(100),
                old_part_remarks TEXT,
                
                -- New Part Details
                new_part_serial VARCHAR(100),
                new_part_number VARCHAR(100),
                new_manufacturer VARCHAR(150),
                vendor VARCHAR(200),
                invoice_number VARCHAR(100),
                replacement_cost REAL DEFAULT 0.0,
                warranty_expiry DATE,
                installed_by VARCHAR(150),
                
                -- Additional Information
                remarks TEXT,
                
                -- Audit Fields
                performed_by VARCHAR(100) NOT NULL,
                performed_by_role VARCHAR(50),
                ip_address VARCHAR(50),
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Foreign Key
                FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
            )
        """)
        
        # Create indexes for better query performance
        cursor.execute("""
            CREATE INDEX idx_part_replacements_asset_id 
            ON asset_part_replacements(asset_id)
        """)
        
        cursor.execute("""
            CREATE INDEX idx_part_replacements_component 
            ON asset_part_replacements(component_name)
        """)
        
        cursor.execute("""
            CREATE INDEX idx_part_replacements_date 
            ON asset_part_replacements(replacement_date)
        """)
        
        cursor.execute("""
            CREATE INDEX idx_part_replacements_new_serial 
            ON asset_part_replacements(new_part_serial)
        """)
        
        cursor.execute("""
            CREATE INDEX idx_part_replacements_created 
            ON asset_part_replacements(created_at)
        """)
        
        conn.commit()
        print("✓ Table asset_part_replacements created successfully")
        print("✓ Indexes created successfully")
        
        # Verify table structure
        cursor.execute("PRAGMA table_info(asset_part_replacements)")
        columns = cursor.fetchall()
        print(f"✓ Table has {len(columns)} columns")
        
        conn.close()
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        conn.rollback()
        conn.close()
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        conn.rollback()
        conn.close()
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("Creating asset_part_replacements table...")
    print("=" * 60)
    
    success = create_part_replacement_table()
    
    if success:
        print("\n✅ Migration completed successfully!")
    else:
        print("\n❌ Migration failed!")
        exit(1)
