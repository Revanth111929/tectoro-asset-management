#!/usr/bin/env python3
"""
remove_dummy_data.py
Permanently removes dummy/seed data from the database
Run this script ONCE to clean up test data
"""

import os
import sys
from datetime import datetime

# Set up paths
basedir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, basedir)

# Import Flask app and models
from api_server import app, db
from models import Asset, ActivityLog, AuditLog

def remove_dummy_data():
    """Remove all dummy/seed data from the database"""
    
    with app.app_context():
        print("=" * 70)
        print("REMOVING DUMMY DATA FROM DATABASE")
        print("=" * 70)
        
        # Count current assets
        total_before = Asset.query.count()
        print(f"\n📊 Total assets in database: {total_before}")
        
        # Define dummy employee names to remove
        dummy_names = [
            'Alice Johnson',
            'Bob Williams',
            'Carol Davis',
            'David Brown',
            'Eva Martinez'
        ]
        
        # Define dummy serial numbers (backup identification)
        dummy_serials = [
            'SN-DELL-001',
            'SN-HP-002',
            'SN-APL-003',
            'SN-LEN-004',
            'SN-DELL-005',
            'SN-HP-006',
            'SN-ASUS-007',
            'SN-LEN-008'
        ]
        
        print(f"\n🔍 Searching for dummy data...")
        print(f"   Looking for: {', '.join(dummy_names)}")
        
        # Find dummy assets by employee name
        dummy_assets_by_name = Asset.query.filter(
            Asset.employee_name.in_(dummy_names)
        ).all()
        
        # Find dummy assets by serial number
        dummy_assets_by_serial = Asset.query.filter(
            Asset.serial_number.in_(dummy_serials)
        ).all()
        
        # Combine and deduplicate
        dummy_assets = list(set(dummy_assets_by_name + dummy_assets_by_serial))
        
        if not dummy_assets:
            print("\n✅ No dummy data found! Database is clean.")
            print("=" * 70)
            return
        
        print(f"\n⚠️  Found {len(dummy_assets)} dummy assets to delete:")
        for asset in dummy_assets:
            print(f"   - ID {asset.id}: {asset.asset_name} ({asset.serial_number}) - {asset.employee_name or 'Unassigned'}")
        
        # Ask for confirmation
        print(f"\n⚠️  WARNING: This will permanently delete {len(dummy_assets)} assets!")
        print("   Your real data (Revanth, Prem Kumar, etc.) will NOT be affected.")
        response = input("\n   Proceed with deletion? (yes/no): ").strip().lower()
        
        if response != 'yes':
            print("\n❌ Deletion cancelled. No changes made.")
            print("=" * 70)
            return
        
        # Delete dummy assets
        print(f"\n🗑️  Deleting {len(dummy_assets)} dummy assets...")
        deleted_ids = []
        for asset in dummy_assets:
            asset_id = asset.id
            asset_name = asset.asset_name
            deleted_ids.append(asset_id)
            db.session.delete(asset)
            print(f"   ✓ Deleted: {asset_name} (ID: {asset_id})")
        
        # Delete related audit logs
        if deleted_ids:
            print(f"\n🗑️  Cleaning up related audit logs...")
            audit_logs = AuditLog.query.filter(AuditLog.asset_id.in_(deleted_ids)).all()
            for log in audit_logs:
                db.session.delete(log)
            print(f"   ✓ Deleted {len(audit_logs)} audit log entries")
        
        # Commit changes
        db.session.commit()
        
        # Count after deletion
        total_after = Asset.query.count()
        
        print(f"\n✅ DELETION COMPLETE!")
        print(f"   - Assets before: {total_before}")
        print(f"   - Assets deleted: {len(dummy_assets)}")
        print(f"   - Assets remaining: {total_after}")
        
        # Show sample of remaining assets
        print(f"\n📋 Sample of remaining assets:")
        real_assets = Asset.query.order_by(Asset.id).limit(10).all()
        for asset in real_assets:
            print(f"   - ID {asset.id}: {asset.employee_name or 'Unassigned'} - {asset.asset_name} ({asset.serial_number})")
        
        print("\n" + "=" * 70)
        print("✅ Database cleaned successfully!")
        print("   Restart the API server to see your real data.")
        print("=" * 70)


if __name__ == '__main__':
    try:
        remove_dummy_data()
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
