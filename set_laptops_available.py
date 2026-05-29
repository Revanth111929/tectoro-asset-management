#!/usr/bin/env python3
"""
Script to set specific laptops to Available status
"""
import sqlite3

def set_laptops_available(laptop_ids):
    """Set specified laptop IDs to Available status"""
    conn = sqlite3.connect('assets.db')
    cursor = conn.cursor()
    
    for laptop_id in laptop_ids:
        # Get current laptop info
        cursor.execute("SELECT id, asset_name, serial_number, status FROM assets WHERE id=? AND category='Laptop'", (laptop_id,))
        laptop = cursor.fetchone()
        
        if not laptop:
            print(f"❌ Laptop ID {laptop_id} not found or not a laptop")
            continue
        
        old_status = laptop[3]
        
        # Update to Available and clear employee info
        cursor.execute("""
            UPDATE assets 
            SET status='Available', 
                emp_id=NULL, 
                employee_name=NULL, 
                employee_email=NULL, 
                mobile_number=NULL 
            WHERE id=?
        """, (laptop_id,))
        
        print(f"✓ Laptop ID {laptop_id}: {laptop[1]} ({laptop[2]})")
        print(f"  Status changed: {old_status} → Available")
        print(f"  Employee info cleared")
        print()
    
    conn.commit()
    conn.close()
    print("✅ Changes saved to database")

if __name__ == '__main__':
    print("=" * 60)
    print("Set Laptops to Available Status")
    print("=" * 60)
    print()
    
    # Show current laptop statuses
    conn = sqlite3.connect('assets.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, asset_name, serial_number, status FROM assets WHERE category='Laptop' ORDER BY id")
    laptops = cursor.fetchall()
    
    print("Current Laptops:")
    print("-" * 60)
    for laptop in laptops:
        print(f"ID {laptop[0]:3d}: {laptop[1]:25s} | {laptop[2]:15s} | {laptop[3]}")
    conn.close()
    
    print()
    print("-" * 60)
    print()
    
    # Get laptop IDs to change
    ids_input = input("Enter laptop IDs to set as Available (comma-separated, e.g., 7,8): ").strip()
    
    if not ids_input:
        print("No IDs entered. Exiting.")
        exit(0)
    
    try:
        laptop_ids = [int(id.strip()) for id in ids_input.split(',')]
    except ValueError:
        print("❌ Invalid input. Please enter numbers separated by commas.")
        exit(1)
    
    print()
    confirm = input(f"Set {len(laptop_ids)} laptop(s) to Available status? (yes/no): ").strip().lower()
    
    if confirm == 'yes':
        print()
        set_laptops_available(laptop_ids)
        print()
        print("📊 Updated laptop status summary:")
        conn = sqlite3.connect('assets.db')
        cursor = conn.cursor()
        cursor.execute("SELECT status, COUNT(*) FROM assets WHERE category='Laptop' GROUP BY status")
        for row in cursor.fetchall():
            print(f"  {row[0]:15s}: {row[1]}")
        conn.close()
        print()
        print("🔄 Refresh your dashboard to see the changes!")
    else:
        print("Cancelled.")
