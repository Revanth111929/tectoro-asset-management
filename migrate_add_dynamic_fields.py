#!/usr/bin/env python3
"""
Database Migration: Add Dynamic Category-Specific Fields
Adds all new fields for category-specific asset attributes
"""

import sqlite3
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()

from db_config import resolve_database_uri, DatabaseConfigError

try:
    _db_uri, _app_env = resolve_database_uri(os.path.dirname(os.path.abspath(__file__)))
except DatabaseConfigError as exc:
    raise SystemExit(str(exc))
DB_PATH = _db_uri.replace('sqlite:///', '')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Starting database migration: Adding dynamic category-specific fields...")
    print(f"Timestamp: {datetime.now()}")
    
    # List of new columns to add
    new_columns = [
        # Basic fields
        ("brand_name", "TEXT"),
        
        # Computer specifications
        ("processor", "TEXT"),
        ("storage_type", "TEXT"),
        ("storage_capacity", "TEXT"),
        ("graphics_card", "TEXT"),
        ("os_version", "TEXT"),
        ("screen_size", "TEXT"),
        
        # Mobile/Phone specific
        ("imei_1", "TEXT"),
        ("imei_2", "TEXT"),
        ("mobile_number", "TEXT"),
        
        # Printer specific
        ("color_or_mono", "TEXT"),
        ("network_enabled", "TEXT"),
        
        # Monitor specific
        ("resolution", "TEXT"),
        ("refresh_rate", "TEXT"),
        
        # Server specific
        ("cpu_count", "INTEGER"),
        ("raid_config", "TEXT"),
        ("ip_address", "TEXT"),
        ("rack_location", "TEXT"),
        
        # Hard Disk specific
        ("interface_type", "TEXT"),
        
        # UPS specific
        ("capacity_va", "TEXT"),
        ("battery_type", "TEXT"),
        ("backup_time", "TEXT"),
        
        # Peripherals
        ("connection_type", "TEXT"),
        ("noise_cancellation", "TEXT"),
        
        # Laptop Bag specific
        ("size_compatibility", "TEXT"),
        ("color", "TEXT"),
        ("warranty_period", "TEXT"),
        
        # Purchase & Warranty
        ("purchase_vendor", "TEXT"),
        ("purchase_date", "DATE"),
        ("warranty_start_date", "DATE"),
        ("warranty_end_date", "DATE"),
        
        # Assignment
        ("assigned_employee", "TEXT"),
        
        # Other
        ("custom_description", "TEXT"),
        ("remarks", "TEXT"),
    ]
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(assets)")
    existing_columns = [row[1] for row in cursor.fetchall()]
    print(f"\nFound {len(existing_columns)} existing columns in 'assets' table")
    
    # Add new columns that don't exist
    added_count = 0
    skipped_count = 0
    
    for column_name, column_type in new_columns:
        if column_name in existing_columns:
            print(f"  ⏭  Skipping '{column_name}' - already exists")
            skipped_count += 1
        else:
            try:
                cursor.execute(f"ALTER TABLE assets ADD COLUMN {column_name} {column_type}")
                print(f"  ✅ Added column: {column_name} ({column_type})")
                added_count += 1
            except sqlite3.OperationalError as e:
                print(f"  ⚠️  Error adding '{column_name}': {e}")
    
    conn.commit()
    conn.close()
    
    print(f"\n{'='*60}")
    print(f"Migration completed!")
    print(f"  ✅ Added: {added_count} new columns")
    print(f"  ⏭  Skipped: {skipped_count} existing columns")
    print(f"{'='*60}\n")
    
    print("✅ Database is now ready for dynamic category-specific forms!")

if __name__ == '__main__':
    migrate()
