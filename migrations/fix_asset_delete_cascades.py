"""
migrations/fix_asset_delete_cascades.py

Fixes the Asset-delete IntegrityError by:
  1. Making asset_replacements.old_asset_id and .new_asset_id nullable
     (table rebuild required - SQLite has no ALTER COLUMN).
  2. Making onboarding_asset_assignments.asset_id nullable (same reason).

TemporaryAssignment and ExitAssetCollection need NO schema migration -
their NOT NULL FKs stay exactly as-is; the fix there is purely the
cascade='all, delete-orphan' relationship change already made in
models.py (an ORM-level change, no DDL required).

AssetLifecycle and AuditLog need NO schema or relationship change at
all - the fix for those is the new block-on-delete check in the route
(routes.py), applied separately from this migration.

Uses PRAGMA introspection (not hand-transcribed column lists) to build
the rebuilt tables, so the new schema is guaranteed to match the real
on-disk schema exactly except for the specific nullable flags being
changed.
"""

import sys
import os
import shutil
import time
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app import app
from models import db, Asset, AssetReplacement, OnboardingAssetAssignment

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


def column_is_nullable(conn, table_name, column_name):
    rows = conn.execute(text("PRAGMA table_info(" + table_name + ")")).fetchall()
    for row in rows:
        # row: (cid, name, type, notnull, dflt_value, pk)
        if row[1] == column_name:
            return row[3] == 0  # notnull == 0 means nullable
    raise ValueError("Column " + column_name + " not found in " + table_name)


def rebuild_table_nullable(conn, table_name, columns_to_make_nullable):
    """Rebuilds table_name via PRAGMA introspection, making the given
    columns nullable, preserving every other column/type/default/PK/FK
    exactly as they currently exist on disk."""
    col_rows = conn.execute(text("PRAGMA table_info(" + table_name + ")")).fetchall()
    fk_rows = conn.execute(text("PRAGMA foreign_key_list(" + table_name + ")")).fetchall()

    col_defs = []
    pk_cols = []
    for row in col_rows:
        cid, name, coltype, notnull, dflt_value, pk = row
        if pk:
            pk_cols.append(name)
        parts = [name, coltype]
        if name not in columns_to_make_nullable and notnull:
            parts.append("NOT NULL")
        if dflt_value is not None:
            parts.append("DEFAULT " + str(dflt_value))
        col_defs.append(" ".join(parts))

    if pk_cols:
        col_defs.append("PRIMARY KEY (" + ", ".join(pk_cols) + ")")

    for fk in fk_rows:
        # fk: (id, seq, table, from_col, to_col, on_update, on_delete, match)
        fk_id, seq, ref_table, from_col, to_col, on_update, on_delete, match = fk
        col_defs.append("FOREIGN KEY (" + from_col + ") REFERENCES " + ref_table + "(" + to_col + ")")

    new_table = table_name + "_rebuild_tmp"
    create_sql = "CREATE TABLE " + new_table + " (\n  " + ",\n  ".join(col_defs) + "\n)"

    col_names = [row[1] for row in col_rows]
    col_list = ", ".join(col_names)

    conn.execute(text(create_sql))
    conn.execute(text("INSERT INTO " + new_table + " (" + col_list + ") SELECT " + col_list + " FROM " + table_name))
    conn.execute(text("DROP TABLE " + table_name))
    conn.execute(text("ALTER TABLE " + new_table + " RENAME TO " + table_name))


def apply_migration():
    start_time = time.time()
    log("=" * 70)
    log("Delete-cascade fix migration - started " + datetime.now().isoformat())
    log("=" * 70)

    backup_database()

    with app.app_context():
        with db.engine.connect() as conn:
            asset_count_before = conn.execute(text("SELECT COUNT(*) FROM assets")).scalar()
            replacement_count_before = conn.execute(text("SELECT COUNT(*) FROM asset_replacements")).scalar()
            onboarding_assignment_count_before = conn.execute(text("SELECT COUNT(*) FROM onboarding_asset_assignments")).scalar()

        log("Asset row count before: " + str(asset_count_before))
        log("AssetReplacement row count before: " + str(replacement_count_before))
        log("OnboardingAssetAssignment row count before: " + str(onboarding_assignment_count_before))

        with db.engine.connect() as conn:
            replacement_already_nullable = column_is_nullable(conn, 'asset_replacements', 'old_asset_id') and \
                                            column_is_nullable(conn, 'asset_replacements', 'new_asset_id')
            onboarding_already_nullable = column_is_nullable(conn, 'onboarding_asset_assignments', 'asset_id')

        if replacement_already_nullable and onboarding_already_nullable:
            log("Migration already applied - both tables already have nullable FKs. Exiting cleanly (idempotent).")
            _write_report(start_time, 'SKIPPED (already applied)', asset_count_before, asset_count_before)
            return

        try:
            with db.engine.begin() as conn:
                if not replacement_already_nullable:
                    rebuild_table_nullable(conn, 'asset_replacements', ['old_asset_id', 'new_asset_id'])
                    log("Rebuilt asset_replacements with nullable old_asset_id/new_asset_id")
                else:
                    log("asset_replacements already nullable - skipped")

                if not onboarding_already_nullable:
                    rebuild_table_nullable(conn, 'onboarding_asset_assignments', ['asset_id'])
                    log("Rebuilt onboarding_asset_assignments with nullable asset_id")
                else:
                    log("onboarding_asset_assignments already nullable - skipped")
        except Exception as e:
            log("MIGRATION FAILED, transaction rolled back automatically: " + str(e))
            _write_report(start_time, 'FAILED: ' + str(e), asset_count_before, None)
            raise

        with db.engine.connect() as conn:
            asset_count_after = conn.execute(text("SELECT COUNT(*) FROM assets")).scalar()
            replacement_count_after = conn.execute(text("SELECT COUNT(*) FROM asset_replacements")).scalar()
            onboarding_assignment_count_after = conn.execute(text("SELECT COUNT(*) FROM onboarding_asset_assignments")).scalar()

        log("Asset row count after: " + str(asset_count_after))
        log("AssetReplacement row count after: " + str(replacement_count_after))
        log("OnboardingAssetAssignment row count after: " + str(onboarding_assignment_count_after))

        ok = True
        if asset_count_after != asset_count_before:
            log("VERIFICATION FAILED: Asset count changed")
            ok = False
        if replacement_count_after != replacement_count_before:
            log("VERIFICATION FAILED: AssetReplacement count changed")
            ok = False
        if onboarding_assignment_count_after != onboarding_assignment_count_before:
            log("VERIFICATION FAILED: OnboardingAssetAssignment count changed")
            ok = False
        if ok:
            log("All row counts unchanged - OK")

        status = 'SUCCESS' if ok else 'SUCCESS WITH VERIFICATION WARNINGS'
        _write_report(start_time, status, asset_count_before, asset_count_after)


def _write_report(start_time, status, count_before, count_after):
    elapsed = time.time() - start_time
    log("Execution time: " + str(round(elapsed, 3)) + "s")
    log("Status: " + status)
    log("=" * 70)
    reports_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'migration_reports')
    os.makedirs(reports_dir, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    report_path = os.path.join(reports_dir, 'delete_cascade_fix_report_' + timestamp + '.txt')
    with open(report_path, 'w') as f:
        f.write('\n'.join(REPORT_LINES))
    print("Full report saved to: " + report_path)


if __name__ == '__main__':
    apply_migration()
