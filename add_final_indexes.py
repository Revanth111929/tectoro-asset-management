#!/usr/bin/env python3
"""
Add final indexes for complete optimization
"""

import os
import sqlite3
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()

from db_config import resolve_database_uri, DatabaseConfigError

try:
    _db_uri, _app_env = resolve_database_uri(os.path.dirname(os.path.abspath(__file__)))
except DatabaseConfigError as exc:
    raise SystemExit(str(exc))
db_path = _db_uri.replace('sqlite:///', '')
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
