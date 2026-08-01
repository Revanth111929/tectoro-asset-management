"""
demo_seed.py
Seeds small, clearly-synthetic demo data into the PUBLIC RENDER DEMO
database ONLY. This must never be called against the office database —
callers are responsible for gating this on APP_ENV == 'render'
(see db_config.is_render_env).

Seeding is idempotent: it does nothing if the database already has a User.
"""

from datetime import date
from werkzeug.security import generate_password_hash


def seed_demo_data(db):
    from models import User, Asset, ActivityLog

    if User.query.first():
        return False  # already has data — never overwrite

    admin = User(
        username='admin',
        email='admin@example.com',
        password_hash=generate_password_hash('admin123'),
        role='admin'
    )
    db.session.add(admin)

    assets_data = [
        ('EMP001', 'Alice Johnson', '+1-555-0101', 'Dell Laptop XPS 15', 'Laptop', 'SN-DEMO-001', 'XPS 15 9520', 'Windows 11', '22H2', '16GB', 'Demo Office', 'INV-DEMO-001', date(2023, 1, 15), date(2026, 1, 15), 'CHG-DEMO-001', '', date(2023, 1, 20), '', 'Demo data — not real office inventory', 'Assigned'),
        ('EMP002', 'Bob Williams', '+1-555-0102', 'HP EliteBook 840', 'Laptop', 'SN-DEMO-002', 'EliteBook 840 G9', 'Windows 11', '23H2', '32GB', 'Demo Office', 'INV-DEMO-002', date(2023, 3, 10), date(2026, 3, 10), 'CHG-DEMO-002', '', date(2023, 3, 15), '', 'Demo data — not real office inventory', 'Assigned'),
        ('', '', '', 'Lenovo ThinkPad X1', 'Laptop', 'SN-DEMO-003', 'ThinkPad X1 Carbon Gen 10', 'Ubuntu 22.04', '22.04 LTS', '16GB', 'Demo Office', 'INV-DEMO-003', date(2023, 5, 5), date(2026, 5, 5), 'CHG-DEMO-003', '', date(2023, 5, 10), '', 'Demo data — not real office inventory', 'Available'),
        ('EMP004', 'David Brown', '+1-555-0104', 'Apple MacBook Pro', 'Laptop', 'SN-DEMO-004', 'MacBook Pro 14" M2', 'macOS Ventura', '13.2', '16GB', 'Demo Office', 'INV-DEMO-004', date(2023, 7, 12), date(2026, 7, 12), 'CHG-DEMO-004', '', date(2023, 7, 20), '', 'Demo data — not real office inventory', 'Assigned'),
        ('', '', '', 'Dell Monitor 27"', 'Monitor', 'SN-DEMO-005', 'UltraSharp U2723DE', '', '', '', 'Demo Office', 'INV-DEMO-005', date(2022, 6, 20), date(2025, 6, 20), '', '', date(2022, 6, 25), '', 'Demo data — not real office inventory', 'Available'),
    ]

    for a in assets_data:
        obj = Asset(
            emp_id=a[0], employee_name=a[1], mobile_number=a[2],
            asset_name=a[3], category=a[4], serial_number=a[5],
            model_name=a[6], os=a[7], version=a[8], ram=a[9],
            location=a[10], invoice_number=a[11], invoice_date=a[12],
            warranty_date=a[13], charger_serial=a[14], old_user=a[15],
            date=a[16], old_device=a[17], comments=a[18], status=a[19]
        )
        db.session.add(obj)

    logs = [
        ActivityLog(user='admin', action='CREATE', module='Asset', description='Added Dell Laptop XPS 15 (demo)'),
        ActivityLog(user='admin', action='ASSIGN', module='Asset', description='Assigned Dell Laptop to Alice Johnson (demo)'),
        ActivityLog(user='admin', action='CREATE', module='Asset', description='Added HP EliteBook 840 (demo)'),
    ]
    db.session.add_all(logs)
    db.session.commit()
    return True
