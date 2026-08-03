"""
migrations/phase1_create_inventory.py

Phase 1 of the Inventory Management System - production-safe version.
See conversation/commit history for full design rationale.
"""

import sys
import os
import shutil
import time
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app import app
from models import db, Asset

REPORT_LINES = []


def log(msg):
    print(msg)
    REPORT_LINES.append(msg)


def get_sqlite_path():
    uri = app.config['SQLALCHEMY_DATABASE_URI']
    if uri.startswith('sqlite:///'):
        return uri.replace('sqlite:///', '', 1)
    return None


def backup_database():
    db_path = get_sqlite_path()
    if not db_path:
        log("Non-SQLite database detected - automatic file backup not supported here.")
        response = input("Type 'yes' to confirm a verified backup already exists and continue: ")
        if response.strip().lower() != 'yes':
            log("ABORTED: no backup confirmed.")
            sys.exit(1)
        return None

    if not os.path.exists(db_path):
        log("Database file not found at " + db_path + " - nothing to back up.")
        return None

    backups_dir = os.path.join(os.path.dirname(db_path), 'backups')
    os.makedirs(backups_dir, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    base = os.path.basename(db_path).rsplit('.', 1)[0]
    backup_path = os.path.join(backups_dir, base + '_backup_' + timestamp + '.db')
    shutil.copy2(db_path, backup_path)
    log("Backup created: " + backup_path)
    return backup_path


def column_exists(table_name, column_name):
    inspector = inspect(db.engine)
    return column_name in [c['name'] for c in inspector.get_columns(table_name)]


def table_exists(table_name):
    return table_name in inspect(db.engine).get_table_names()


def apply_migration():
    start_time = time.time()
    log("=" * 70)
    log("Phase 1 Inventory Migration - started " + datetime.now().isoformat())
    log("=" * 70)

    backup_database()

    with app.app_context():
        # Use raw SQL, not the ORM, for the "before" count: the Asset
        # model already declares inventory_id (added to models.py ahead
        # of this migration), so any ORM query against Asset will fail
        # with "no such column" until the ALTER TABLE below actually
        # runs. Raw SQL against the real on-disk schema has no such
        # dependency.
        with db.engine.connect() as conn:
            asset_count_before = conn.execute(text('SELECT COUNT(*) FROM assets')).scalar()
        log("Asset row count before migration: " + str(asset_count_before))

        already_applied = table_exists('inventory') and column_exists('assets', 'inventory_id')
        if already_applied:
            log("Migration already applied (inventory table + assets.inventory_id both exist).")
            log("Nothing to do - exiting cleanly (idempotent).")
            _write_report(start_time, 'SKIPPED (already applied)', asset_count_before, asset_count_before)
            return

        tables_changed = []
        columns_added = []
        indexes_created = []

        try:
            with db.engine.begin() as conn:
                if not table_exists('inventory'):
                    conn.execute(text(
                        "CREATE TABLE inventory ("
                        "id INTEGER PRIMARY KEY AUTOINCREMENT, "
                        "category VARCHAR(100), "
                        "asset_type VARCHAR(100), "
                        "manufacturer VARCHAR(150), "
                        "brand_name VARCHAR(150), "
                        "model_name VARCHAR(150), "
                        "part_number VARCHAR(100), "
                        "sku VARCHAR(100), "
                        "description TEXT, "
                        "vendor VARCHAR(200), "
                        "purchase_order_number VARCHAR(100), "
                        "purchase_mode VARCHAR(20), "
                        "quantity_purchased INTEGER, "
                        "currency VARCHAR(10), "
                        "cost FLOAT, "
                        "invoice_number VARCHAR(100), "
                        "invoice_date DATE, "
                        "purchase_date DATE, "
                        "warranty_start_date DATE, "
                        "warranty_end_date DATE, "
                        "stock_quantity INTEGER, "
                        "available_quantity INTEGER, "
                        "reorder_level INTEGER, "
                        "stock_status VARCHAR(30), "
                        "location VARCHAR(150), "
                        "remarks TEXT, "
                        "created_by VARCHAR(100), "
                        "updated_by VARCHAR(100), "
                        "created_at DATETIME, "
                        "updated_at DATETIME"
                        ")"
                    ))
                    tables_changed.append('inventory (created)')

                if not column_exists('assets', 'inventory_id'):
                    conn.execute(text(
                        'ALTER TABLE assets ADD COLUMN inventory_id INTEGER REFERENCES inventory(id)'
                    ))
                    columns_added.append('assets.inventory_id')
                    conn.execute(text(
                        'CREATE INDEX IF NOT EXISTS ix_assets_inventory_id ON assets (inventory_id)'
                    ))
                    indexes_created.append('ix_assets_inventory_id')

        except Exception as e:
            log("MIGRATION FAILED, transaction rolled back automatically: " + str(e))
            _write_report(start_time, 'FAILED: ' + str(e), asset_count_before, None)
            raise

        asset_count_after = Asset.query.count()
        from models import Inventory
        inventory_count_after = Inventory.query.count()

        log("Asset row count after migration: " + str(asset_count_after))
        log("Inventory row count after migration: " + str(inventory_count_after))

        verification_ok = True
        if asset_count_after != asset_count_before:
            log("VERIFICATION FAILED: Asset count changed (" + str(asset_count_before) + " -> " + str(asset_count_after) + ")")
            verification_ok = False
        else:
            log("Asset count unchanged - OK")

        if inventory_count_after != 0:
            log("VERIFICATION FAILED: Inventory should be empty in Phase 1, found " + str(inventory_count_after) + " rows")
            verification_ok = False
        else:
            log("Inventory table is empty, as expected for Phase 1 - OK")

        status = 'SUCCESS' if verification_ok else 'SUCCESS WITH VERIFICATION WARNINGS'
        log("Tables changed: " + str(tables_changed))
        log("Columns added: " + str(columns_added))
        log("Indexes created: " + str(indexes_created))

        _write_report(start_time, status, asset_count_before, asset_count_after,
                      tables_changed, columns_added, indexes_created)


def _write_report(start_time, status, count_before, count_after,
                   tables_changed=None, columns_added=None, indexes_created=None):
    elapsed = time.time() - start_time
    log("Execution time: " + str(round(elapsed, 3)) + "s")
    log("Status: " + status)
    log("=" * 70)

    reports_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'migration_reports')
    os.makedirs(reports_dir, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    report_path = os.path.join(reports_dir, 'phase1_migration_report_' + timestamp + '.txt')
    with open(report_path, 'w') as f:
        f.write('\n'.join(REPORT_LINES))
    print("Full report saved to: " + report_path)


def rollback_migration():
    with app.app_context():
        log("=== Rolling back Phase 1 ===")
        with db.engine.begin() as conn:
            if column_exists('assets', 'inventory_id'):
                conn.execute(text('DROP INDEX IF EXISTS ix_assets_inventory_id'))
                conn.execute(text('ALTER TABLE assets DROP COLUMN inventory_id'))
                log("Dropped assets.inventory_id")
            else:
                log("assets.inventory_id does not exist - nothing to drop")

            if table_exists('inventory'):
                conn.execute(text('DROP TABLE inventory'))
                log("Dropped inventory table")
            else:
                log("inventory table does not exist - nothing to drop")
        log("=== Rollback complete ===")


if __name__ == '__main__':
    if '--rollback' in sys.argv:
        rollback_migration()
    else:
        apply_migration()
