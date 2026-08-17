#!/usr/bin/env python3
"""
Migration script to create asset_transfers table
Run this once to add the table to existing database
"""

from api_server import app, db
from models import AssetTransfer

def create_transfer_table():
    with app.app_context():
        # Create the asset_transfers table
        db.create_all()
        print("✅ asset_transfers table created successfully")
        
        # Verify table exists
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        
        if 'asset_transfers' in tables:
            print("✅ Verified: asset_transfers table exists in database")
            
            # Show table structure
            columns = inspector.get_columns('asset_transfers')
            print(f"\nTable structure ({len(columns)} columns):")
            for col in columns:
                print(f"  - {col['name']}: {col['type']}")
        else:
            print("❌ Error: asset_transfers table not found")

if __name__ == '__main__':
    create_transfer_table()
