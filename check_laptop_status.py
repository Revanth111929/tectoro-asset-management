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
