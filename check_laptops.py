#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect('assets.db')
cursor = conn.cursor()

# Check total laptops
cursor.execute("SELECT COUNT(*) FROM assets WHERE category='Laptop'")
total = cursor.fetchone()[0]
print(f"Total Laptops: {total}")

# Check by status
cursor.execute("SELECT status, COUNT(*) FROM assets WHERE category='Laptop' GROUP BY status")
print("\nLaptops by status:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

# Check all categories
cursor.execute("SELECT category, COUNT(*) FROM assets GROUP BY category")
print("\nAll assets by category:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

conn.close()
