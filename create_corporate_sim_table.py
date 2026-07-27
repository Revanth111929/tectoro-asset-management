#!/usr/bin/env python3
"""
Database Migration: Create Corporate SIM Table

This script creates the corporate_sims table in the database.
Run this ONCE after adding the CorporateSIM model to models.py.
"""

from app import create_app
from models import db, CorporateSIM

print("🔧 Creating Corporate SIM Table...")
print("=" * 60)

app = create_app()

with app.app_context():
    try:
        # Create the table
        db.create_all()
        print("✅ Corporate SIM table created successfully!")
        
        # Verify table exists
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        
        if 'corporate_sims' in tables:
            print(f"✅ Table 'corporate_sims' confirmed in database")
            
            # Show table columns
            columns = inspector.get_columns('corporate_sims')
            print(f"\n📋 Table Structure ({len(columns)} columns):")
            print("-" * 60)
            for col in columns:
                nullable = "NULL" if col['nullable'] else "NOT NULL"
                print(f"  • {col['name']:<30} {str(col['type']):<20} {nullable}")
            
            # Check for indexes
            indexes = inspector.get_indexes('corporate_sims')
            if indexes:
                print(f"\n🔍 Indexes ({len(indexes)}):")
                print("-" * 60)
                for idx in indexes:
                    cols = ', '.join(idx['column_names'])
                    unique = "UNIQUE" if idx.get('unique') else ""
                    print(f"  • {idx['name']:<30} ({cols}) {unique}")
            
            print("\n" + "=" * 60)
            print("✅ Migration Complete!")
            print("\n📝 Next Steps:")
            print("   1. Restart the backend: ./fix.sh")
            print("   2. Test the API endpoints")
            print("   3. Add sample SIM data (optional)")
            
        else:
            print("❌ Table creation failed - table not found!")
            
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        import traceback
        traceback.print_exc()
