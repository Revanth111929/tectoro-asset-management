#!/usr/bin/env python3
"""
Migration: Add invoice_attachment column to assets table
Date: 2026-08-05
"""

import sqlite3
import os

def migrate():
    """Add invoice_attachment column to assets table"""
    
    # Database paths
    databases = [
        'databases/local_assets.db',
        'databases/office_assets.db',
        'databases/development.db'
    ]
    
    for db_path in databases:
        if not os.path.exists(db_path):
            print(f"⏭️  Skipping {db_path} (not found)")
            continue
            
        print(f"\n📁 Migrating {db_path}...")
        
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Check if column already exists
            cursor.execute("PRAGMA table_info(assets)")
            columns = [col[1] for col in cursor.fetchall()]
            
            if 'invoice_attachment' in columns:
                print(f"   ℹ️  Column 'invoice_attachment' already exists")
            else:
                # Add the new column
                cursor.execute("""
                    ALTER TABLE assets 
                    ADD COLUMN invoice_attachment VARCHAR(255)
                """)
                conn.commit()
                print(f"   ✅ Added column 'invoice_attachment'")
            
            conn.close()
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False
    
    print("\n✅ Migration complete!")
    return True

if __name__ == '__main__':
    migrate()
