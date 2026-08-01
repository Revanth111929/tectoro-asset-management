#!/usr/bin/env python3
import sqlite3
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()

from db_config import resolve_database_uri, DatabaseConfigError

try:
    _db_uri, _app_env = resolve_database_uri(os.path.dirname(os.path.abspath(__file__)))
except DatabaseConfigError as exc:
    raise SystemExit(str(exc))

conn = sqlite3.connect(_db_uri.replace('sqlite:///', ''))
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
