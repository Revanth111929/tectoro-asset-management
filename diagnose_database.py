#!/usr/bin/env python3
"""
Database Diagnostic Script
Simulates production environment to identify database issues
"""
import os
import sys

def diagnose():
    print("=" * 70)
    print("DATABASE DIAGNOSTIC REPORT")
    print("=" * 70)
    
    # Environment Variables
    print("\n📋 ENVIRONMENT VARIABLES:")
    print(f"  FLASK_ENV: {os.environ.get('FLASK_ENV', 'NOT SET')}")
    print(f"  DATABASE_URL: {os.environ.get('DATABASE_URL', 'NOT SET')}")
    print(f"  SECRET_KEY: {'SET' if os.environ.get('SECRET_KEY') else 'NOT SET'}")
    
    # Simulate production (Render would not have FLASK_ENV set)
    print("\n🔄 SIMULATING RENDER ENVIRONMENT:")
    print("  - Clearing FLASK_ENV (Render doesn't set it)")
    if 'FLASK_ENV' in os.environ:
        original_env = os.environ['FLASK_ENV']
        del os.environ['FLASK_ENV']
    else:
        original_env = None
    
    if 'DATABASE_URL' in os.environ:
        original_db = os.environ['DATABASE_URL']
        del os.environ['DATABASE_URL']
    else:
        original_db = None
    
    # Import after clearing env
    from app import create_app
    from models import db, Asset, User
    
    app = create_app()
    
    with app.app_context():
        # Check database URI
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        print(f"\n📁 DATABASE CONNECTION STRING:")
        print(f"  {db_uri}")
        
        # Extract database filename
        if 'sqlite:///' in db_uri:
            db_path = db_uri.replace('sqlite:///', '')
            db_filename = os.path.basename(db_path)
            print(f"\n📄 DATABASE FILE:")
            print(f"  Filename: {db_filename}")
            print(f"  Full Path: {db_path}")
            
            # Check if file exists
            if os.path.exists(db_path):
                size = os.path.getsize(db_path)
                print(f"  File Exists: YES")
                print(f"  File Size: {size:,} bytes ({size/1024:.2f} KB)")
            else:
                print(f"  File Exists: NO (will be created)")
        
        # Check if tables exist
        print(f"\n🗄️  DATABASE STATUS:")
        try:
            user_count = User.query.count()
            asset_count = Asset.query.count()
            print(f"  Users: {user_count}")
            print(f"  Assets: {asset_count}")
            
            if user_count == 0 and asset_count == 0:
                print(f"\n⚠️  DATABASE IS EMPTY!")
                print(f"  This triggers seed_data() which adds sample assets")
            else:
                print(f"\n✓ DATABASE HAS DATA")
                
                # Show sample assets
                print(f"\n📦 SAMPLE ASSETS (first 5):")
                assets = Asset.query.limit(5).all()
                for a in assets:
                    print(f"  - {a.serial_number}: {a.asset_name}")
        
        except Exception as e:
            print(f"  ERROR: {e}")
    
    # Restore environment
    if original_env:
        os.environ['FLASK_ENV'] = original_env
    if original_db:
        os.environ['DATABASE_URL'] = original_db
    
    print("\n" + "=" * 70)
    print("DIAGNOSIS COMPLETE")
    print("=" * 70)
    
    # Analysis
    print("\n🔍 ROOT CAUSE ANALYSIS:")
    print("\n1. SEED DATA FUNCTION:")
    print("   ├─ Location: app.py, seed_data()")
    print("   ├─ Trigger: Runs on EVERY startup")
    print("   ├─ Condition: if User.query.first() returns None")
    print("   └─ Action: Inserts 5 sample assets + 1 admin user")
    
    print("\n2. RENDER DEPLOYMENT ISSUE:")
    print("   ├─ Render uses ephemeral filesystem")
    print("   ├─ SQLite database is lost on restart/redeploy")
    print("   ├─ On each deploy: NEW empty database created")
    print("   ├─ Empty database triggers seed_data()")
    print("   └─ Result: Same 5 sample assets appear every time")
    
    print("\n3. LOCAL vs RENDER:")
    print("   ├─ Local: Persistent filesystem, keeps its resolved database (see db_config.py)")
    print("   ├─ Render: Ephemeral filesystem, loses database")
    print("   └─ Both see SAME seed data because seed function runs")
    
    print("\n4. WHY THEY LOOK THE SAME:")
    print("   ├─ NOT because of shared database")
    print("   ├─ NOT because of git tracking database")
    print("   └─ BECAUSE: seed_data() inserts identical sample assets")

if __name__ == '__main__':
    diagnose()
