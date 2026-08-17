#!/usr/bin/env python3
"""
Database Migration: Add Donor Asset Support to Part Replacements
Created: 2026-08-17
Description: Adds support for tracking donor/source assets, custom components, and custom reasons
"""

import sqlite3
import sys
import os

# Add parent directory to path to import db_config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db_config import resolve_database_uri

def get_db_path():
    """Get the database path from config"""
    basedir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    database_uri, app_env = resolve_database_uri(basedir)
    # Extract path from sqlite:/// URI
    if database_uri.startswith('sqlite:///'):
        return database_uri[10:]  # Remove 'sqlite:///'
    return database_uri

def migrate():
    """Add new columns to asset_part_replacements table"""
    db_path = get_db_path()
    print(f"Connecting to database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(asset_part_replacements)")
        columns = [col[1] for col in cursor.fetchall()]
        
        migrations_applied = []
        
        # Add custom_component_name column
        if 'custom_component_name' not in columns:
            print("Adding custom_component_name column...")
            cursor.execute("""
                ALTER TABLE asset_part_replacements 
                ADD COLUMN custom_component_name VARCHAR(200)
            """)
            migrations_applied.append('custom_component_name')
        else:
            print("✓ custom_component_name already exists")
        
        # Add custom_reason column
        if 'custom_reason' not in columns:
            print("Adding custom_reason column...")
            cursor.execute("""
                ALTER TABLE asset_part_replacements 
                ADD COLUMN custom_reason VARCHAR(200)
            """)
            migrations_applied.append('custom_reason')
        else:
            print("✓ custom_reason already exists")
        
        # Add part_source column
        if 'part_source' not in columns:
            print("Adding part_source column...")
            cursor.execute("""
                ALTER TABLE asset_part_replacements 
                ADD COLUMN part_source VARCHAR(100)
            """)
            migrations_applied.append('part_source')
        else:
            print("✓ part_source already exists")
        
        # Add source_asset_id column
        if 'source_asset_id' not in columns:
            print("Adding source_asset_id column...")
            cursor.execute("""
                ALTER TABLE asset_part_replacements 
                ADD COLUMN source_asset_id INTEGER
            """)
            migrations_applied.append('source_asset_id')
        else:
            print("✓ source_asset_id already exists")
        
        # Add source_asset_serial column
        if 'source_asset_serial' not in columns:
            print("Adding source_asset_serial column...")
            cursor.execute("""
                ALTER TABLE asset_part_replacements 
                ADD COLUMN source_asset_serial VARCHAR(100)
            """)
            migrations_applied.append('source_asset_serial')
        else:
            print("✓ source_asset_serial already exists")
        
        # Add source_asset_name column
        if 'source_asset_name' not in columns:
            print("Adding source_asset_name column...")
            cursor.execute("""
                ALTER TABLE asset_part_replacements 
                ADD COLUMN source_asset_name VARCHAR(200)
            """)
            migrations_applied.append('source_asset_name')
        else:
            print("✓ source_asset_name already exists")
        
        # Add source_asset_model column
        if 'source_asset_model' not in columns:
            print("Adding source_asset_model column...")
            cursor.execute("""
                ALTER TABLE asset_part_replacements 
                ADD COLUMN source_asset_model VARCHAR(150)
            """)
            migrations_applied.append('source_asset_model')
        else:
            print("✓ source_asset_model already exists")
        
        # Create index on source_asset_id if it was just added
        if 'source_asset_id' in migrations_applied:
            print("Creating index on source_asset_id...")
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_part_replacements_source_asset 
                ON asset_part_replacements(source_asset_id)
            """)
        
        conn.commit()
        
        if migrations_applied:
            print(f"\n✓ Migration completed successfully!")
            print(f"  Added columns: {', '.join(migrations_applied)}")
        else:
            print("\n✓ All columns already exist. No migration needed.")
        
        # Verify the migration
        cursor.execute("PRAGMA table_info(asset_part_replacements)")
        all_columns = [col[1] for col in cursor.fetchall()]
        
        required_columns = [
            'custom_component_name', 'custom_reason', 'part_source',
            'source_asset_id', 'source_asset_serial', 'source_asset_name', 'source_asset_model'
        ]
        
        print("\nVerifying columns:")
        for col in required_columns:
            status = "✓" if col in all_columns else "✗"
            print(f"  {status} {col}")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        conn.rollback()
        return False
    
    finally:
        conn.close()

def rollback():
    """
    Note: SQLite does not support DROP COLUMN directly.
    To rollback, you would need to:
    1. Create a new table without the new columns
    2. Copy data from old table to new table
    3. Drop old table
    4. Rename new table
    
    This is not implemented to preserve existing data safety.
    """
    print("Rollback not implemented for SQLite ALTER TABLE ADD COLUMN.")
    print("Columns added by this migration will remain in the table.")
    return False

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Part Replacement Donor Support Migration')
    parser.add_argument('action', choices=['migrate', 'rollback'], 
                        help='Action to perform')
    
    args = parser.parse_args()
    
    if args.action == 'migrate':
        success = migrate()
        sys.exit(0 if success else 1)
    elif args.action == 'rollback':
        success = rollback()
        sys.exit(0 if success else 1)
