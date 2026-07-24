#!/usr/bin/env python3
"""
clean_database.py - Remove dummy data directly using SQL
"""

import sqlite3
import os

db_path = 'assets.db'

def clean_database():
    print("=" * 70)
    print("CLEANING DUMMY DATA FROM DATABASE")
    print("=" * 70)
    
    if not os.path.exists(db_path):
        print(f"\n❌ Database not found: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check current count
    cursor.execute("SELECT COUNT(*) FROM assets")
    total_before = cursor.fetchone()[0]
    print(f"\n📊 Total assets before: {total_before}")
    
    # Dummy names and serials to remove
    dummy_names = ['Alice Johnson', 'Bob Williams', 'Carol Davis', 'David Brown', 'Eva Martinez']
    dummy_serials = ['SN-DELL-001', 'SN-HP-002', 'SN-APL-003', 'SN-LEN-004', 'SN-DELL-005', 
                     'SN-HP-006', 'SN-ASUS-007', 'SN-LEN-008']
    
    # Find dummy assets
    placeholders_names = ','.join(['?' for _ in dummy_names])
    placeholders_serials = ','.join(['?' for _ in dummy_serials])
    
    query = f"""
        SELECT id, emp_id, employee_name, asset_name, serial_number 
        FROM assets 
        WHERE employee_name IN ({placeholders_names})
        OR serial_number IN ({placeholders_serials})
    """
    
    cursor.execute(query, dummy_names + dummy_serials)
    dummy_assets = cursor.fetchall()
    
    if not dummy_assets:
        print("\n✅ No dummy data found! Database is clean.")
        conn.close()
        return
    
    print(f"\n⚠️  Found {len(dummy_assets)} dummy assets:")
    for asset in dummy_assets:
        print(f"   - ID {asset[0]}: {asset[3]} ({asset[4]}) - {asset[2] or 'Unassigned'}")
    
    # Delete dummy assets
    print(f"\n🗑️  Deleting dummy assets...")
    
    delete_query = f"""
        DELETE FROM assets 
        WHERE employee_name IN ({placeholders_names})
        OR serial_number IN ({placeholders_serials})
    """
    
    cursor.execute(delete_query, dummy_names + dummy_serials)
    deleted = cursor.rowcount
    
    # Delete related audit logs
    dummy_ids = [str(asset[0]) for asset in dummy_assets]
    if dummy_ids:
        placeholders_ids = ','.join(['?' for _ in dummy_ids])
        cursor.execute(f"DELETE FROM audit_logs WHERE asset_id IN ({placeholders_ids})", dummy_ids)
        audit_deleted = cursor.rowcount
        print(f"   ✓ Deleted {audit_deleted} related audit logs")
    
    conn.commit()
    
    # Check final count
    cursor.execute("SELECT COUNT(*) FROM assets")
    total_after = cursor.fetchone()[0]
    
    print(f"\n✅ DELETION COMPLETE!")
    print(f"   - Assets before: {total_before}")
    print(f"   - Assets deleted: {deleted}")
    print(f"   - Assets remaining: {total_after}")
    
    # Show sample of remaining assets
    print(f"\n📋 Your real assets (sample):")
    cursor.execute("SELECT id, emp_id, employee_name, asset_name FROM assets ORDER BY id LIMIT 10")
    for asset in cursor.fetchall():
        print(f"   - ID {asset[0]}: {asset[2] or 'Unassigned'} - {asset[3]}")
    
    conn.close()
    
    print("\n" + "=" * 70)
    print("✅ Database cleaned successfully!")
    print("   Restart the application to see your real data.")
    print("=" * 70)

if __name__ == '__main__':
    try:
        clean_database()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
