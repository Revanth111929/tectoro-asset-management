#!/usr/bin/env python3
"""
migrate_add_onboarding.py
Creates the onboarding and onboarding_asset_assignments tables.
Safe to run multiple times — checks for existing tables first.

Run from the asset-management project root:
    source venv/bin/activate
    python3 migrate_add_onboarding.py
"""

import sqlite3
import sys
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets.db')


def main():
    if not os.path.exists(DB_PATH):
        print(f"ERROR: Database not found at {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Check existing tables
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    existing = {row[0] for row in cur.fetchall()}

    created = []
    skipped = []

    # ── onboarding table ────────────────────────────────────────────────────
    if 'onboarding' not in existing:
        cur.execute("""
            CREATE TABLE onboarding (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(150) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                phone_number VARCHAR(30) NOT NULL,
                designation VARCHAR(100) NOT NULL,
                team VARCHAR(100) NOT NULL,
                application_access TEXT,
                status VARCHAR(30) DEFAULT 'Pending',
                converted_emp_id VARCHAR(50),
                converted_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (converted_emp_id) REFERENCES employees(emp_id)
            )
        """)
        created.append('onboarding')
    else:
        skipped.append('onboarding')

    # ── onboarding_asset_assignments table ──────────────────────────────────
    if 'onboarding_asset_assignments' not in existing:
        cur.execute("""
            CREATE TABLE onboarding_asset_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                onboarding_id INTEGER NOT NULL,
                asset_id INTEGER NOT NULL,
                asset_name VARCHAR(150),
                asset_serial VARCHAR(100),
                asset_category VARCHAR(100),
                assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (onboarding_id) REFERENCES onboarding(id),
                FOREIGN KEY (asset_id) REFERENCES assets(id)
            )
        """)
        created.append('onboarding_asset_assignments')
    else:
        skipped.append('onboarding_asset_assignments')

    # ── Add new columns to existing employees table (per spec: "Add the new
    #    fields (Assets Assigned and Application Access) to the existing
    #    Employee module wherever relevant") ──────────────────────────────────
    cur.execute("PRAGMA table_info(employees)")
    emp_cols = {row[1] for row in cur.fetchall()}

    if 'application_access' not in emp_cols:
        cur.execute("ALTER TABLE employees ADD COLUMN application_access TEXT")
        created.append('employees.application_access')
    else:
        skipped.append('employees.application_access')

    if 'onboarding_id' not in emp_cols:
        cur.execute("ALTER TABLE employees ADD COLUMN onboarding_id INTEGER")
        created.append('employees.onboarding_id')
    else:
        skipped.append('employees.onboarding_id')

    conn.commit()
    conn.close()

    print("=== Migration complete ===")
    if created:
        print("Created:")
        for c in created:
            print(f"  + {c}")
    if skipped:
        print("Already existed (skipped):")
        for s in skipped:
            print(f"  - {s}")


if __name__ == '__main__':
    main()
