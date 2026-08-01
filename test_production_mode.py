#!/usr/bin/env python3
"""
Test production mode configuration
Simulates Render production environment
"""
import os
import sys

# Clear environment to simulate production
if 'FLASK_ENV' in os.environ:
    del os.environ['FLASK_ENV']
if 'DATABASE_URL' in os.environ:
    del os.environ['DATABASE_URL']

# Set production environment
os.environ['FLASK_ENV'] = 'production'

print("=" * 70)
print("TESTING PRODUCTION MODE")
print("=" * 70)

# Import app
from app import create_app
from models import db, User, Asset

app = create_app()

print("\n✓ Application created successfully")

with app.app_context():
    print(f"\n📊 DATABASE STATUS:")
    
    # Check if tables exist
    try:
        user_count = User.query.count()
        asset_count = Asset.query.count()
        print(f"  Users: {user_count}")
        print(f"  Assets: {asset_count}")
    except Exception as e:
        print(f"  Database tables not yet created: {e}")

print("\n" + "=" * 70)
print("PRODUCTION MODE TEST COMPLETE")
print("=" * 70)
print("\n✓ Verify above output shows:")
print("  - Environment: production")
print("  - Seed data: DISABLED")
print("  - No sample assets created")
