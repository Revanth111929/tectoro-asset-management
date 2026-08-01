#!/usr/bin/env python3
"""
Test DATABASE_URL configuration
Simulates Render with PostgreSQL
"""
import os
import sys

# Clear environment
if 'FLASK_ENV' in os.environ:
    del os.environ['FLASK_ENV']
if 'DATABASE_URL' in os.environ:
    del os.environ['DATABASE_URL']

# Set production with DATABASE_URL
os.environ['FLASK_ENV'] = 'production'
os.environ['DATABASE_URL'] = 'postgresql://user:pass@host.render.com:5432/asset_db'

print("=" * 70)
print("TESTING DATABASE_URL CONFIGURATION")
print("=" * 70)

# Import app
from app import create_app

app = create_app()

print("\n✓ Application created successfully")
print("\n✓ Verify above output shows:")
print("  - Environment: production")
print("  - Database: Using DATABASE_URL (external/managed database)")
print("  - Type: PostgreSQL")
print("  - Seed data: DISABLED")

print("\n" + "=" * 70)
print("DATABASE_URL TEST COMPLETE")
print("=" * 70)
