#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect('assets.db')
cursor = conn.cursor()

# Check all laptop statuses
cursor.execute("SELECT id, asset_name, serial_number, status FROM assets WHERE category='Laptop' ORDER BY status, id")
print("All Laptops:")
print("-" * 80)
for row in cursor.fetchall():
    print(f"ID {row[0]:3d}: {row[1]:30s} | Serial: {row[2]:20s} | Status: {row[3]}")

print("\n" + "=" * 80)
cursor.execute("SELECT status, COUNT(*) FROM assets WHERE category='Laptop' GROUP BY status")
print("\nSummary:")
for row in cursor.fetchall():
    print(f"  {row[0]:15s}: {row[1]}")

conn.close()
