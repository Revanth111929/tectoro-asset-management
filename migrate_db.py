#!/usr/bin/env python3
"""
Database migration script to add new columns to existing assets table
Run this once to update your database schema
"""
from app import create_app
from models import db

def migrate():
    app = create_app()
    with app.app_context():
        # Add new columns using raw SQL
        try:
            with db.engine.connect() as conn:
                # SQLite doesn't support IF NOT EXISTS, so we try-catch each column
                columns_to_add = [
                    ("purchase_price", "ALTER TABLE assets ADD COLUMN purchase_price FLOAT"),
                    ("quantity", "ALTER TABLE assets ADD COLUMN quantity INTEGER DEFAULT 1"),
                    ("configuration", "ALTER TABLE assets ADD COLUMN configuration TEXT"),
                    ("laptop_bag_serial", "ALTER TABLE assets ADD COLUMN laptop_bag_serial VARCHAR(100)"),
                    ("hard_disk_serial", "ALTER TABLE assets ADD COLUMN hard_disk_serial VARCHAR(100)"),
                    ("hard_disk_capacity", "ALTER TABLE assets ADD COLUMN hard_disk_capacity VARCHAR(50)"),
                    ("ups_serial", "ALTER TABLE assets ADD COLUMN ups_serial VARCHAR(100)"),
                    ("ups_capacity", "ALTER TABLE assets ADD COLUMN ups_capacity VARCHAR(50)"),
                    ("printer_type", "ALTER TABLE assets ADD COLUMN printer_type VARCHAR(100)"),
                    ("printer_model", "ALTER TABLE assets ADD COLUMN printer_model VARCHAR(150)"),
                    ("mobile_imei", "ALTER TABLE assets ADD COLUMN mobile_imei VARCHAR(50)"),
                    ("mobile_number_sim", "ALTER TABLE assets ADD COLUMN mobile_number_sim VARCHAR(30)"),
                    ("testing_status", "ALTER TABLE assets ADD COLUMN testing_status VARCHAR(50)"),
                ]
                
                for col_name, sql in columns_to_add:
                    try:
                        conn.execute(db.text(sql))
                        conn.commit()
                        print(f"✓ Added column: {col_name}")
                    except Exception as e:
                        if "duplicate column" in str(e).lower():
                            print(f"⊙ Column already exists: {col_name}")
                        else:
                            print(f"✗ Error adding {col_name}: {e}")
                
                print("\n✅ Database migration completed!")
                print("New fields added:")
                print("  • Purchase Price & Quantity (Inventory)")
                print("  • Configuration (Detailed specs)")
                print("  • Laptop Bag Serial")
                print("  • Hard Disk Serial & Capacity")
                print("  • UPS Serial & Capacity")
                print("  • Printer Type & Model")
                print("  • Mobile IMEI, SIM Number & Testing Status")
                
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == '__main__':
    migrate()
