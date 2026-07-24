#!/usr/bin/env python3
"""
Add final indexes for complete optimization
"""

import os
import sqlite3

db_path = os.path.join(os.path.dirname(__file__), 'assets.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Adding final indexes...")

# Add remaining indexes
indexes = [
    ("idx_assets_emp_id", "CREATE INDEX IF NOT EXISTS idx_assets_emp_id ON assets(emp_id)"),
    ("idx_assets_employee_name", "CREATE INDEX IF NOT EXISTS idx_assets_employee_name ON assets(employee_name)"),
]

for idx_name, sql in indexes:
    try:
        cursor.execute(sql)
        print(f"✅ Created index: {idx_name}")
    except Exception as e:
        print(f"⚠️  Index {idx_name}: {e}")

conn.commit()
conn.close()

print("\n✅ Final indexes added successfully!")
