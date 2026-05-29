#!/usr/bin/env python3
"""
api_server.py
Flask REST API backend for the IT Asset Management React frontend.
Handles all CRUD operations, authentication, and report exports.
"""

import os, csv, io
from datetime import datetime, date, timedelta
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_

# ── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SECRET_KEY'] = 'assetmgmt-super-secret-2024'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'assets.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Allow React dev server (port 3000) and production
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Import models AFTER app is configured
from models import db, Asset, ActivityLog, User
db.init_app(app)

# ── Helpers ───────────────────────────────────────────────────────────────────
def parse_date(val):
    """Parse YYYY-MM-DD string to date object"""
    if val:
        try:
            return datetime.strptime(val, '%Y-%m-%d').date()
        except ValueError:
            pass
    return None

def log_activity(action, module, description, user='admin'):
    entry = ActivityLog(user=user, action=action, module=module, description=description)
    db.session.add(entry)
    # caller must commit

def get_current_user():
    """Get username from Authorization header token (simple demo auth)"""
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        token = auth[7:]
        # In production use JWT; here we store username in token
        if ':' in token:
            return token.split(':')[1]
    return 'admin'

# ── Seed sample data ──────────────────────────────────────────────────────────
def seed_data():
    if User.query.first():
        return  # already seeded

    print("🌱 Seeding sample data...")

    # Admin user  (password: admin123)
    admin = User(
        username='admin',
        email='admin@company.com',
        password_hash=generate_password_hash('admin123'),
        role='admin'
    )
    db.session.add(admin)

    # Sample assets with all 20 columns
    samples = [
        Asset(
            emp_id='EMP001', employee_name='Alice Johnson', mobile_number='9876543210',
            asset_name='Dell Laptop XPS 15', category='Laptop',
            serial_number='SN-DELL-001', model_name='XPS 15 9500',
            os='Windows 11', version='23H2', ram='16GB',
            location='HQ - Floor 2', invoice_number='INV-2023-001',
            invoice_date=date(2023, 1, 15), warranty_date=date(2026, 1, 15),
            charger_serial='CHG-DELL-001', old_user='', date=date(2023, 1, 20),
            old_device='', comments='Primary work laptop', status='Assigned'
        ),
        Asset(
            emp_id='EMP002', employee_name='Bob Williams', mobile_number='9876543211',
            asset_name='HP EliteBook 840', category='Laptop',
            serial_number='SN-HP-002', model_name='EliteBook 840 G9',
            os='Windows 11', version='22H2', ram='8GB',
            location='HQ - Floor 1', invoice_number='INV-2023-002',
            invoice_date=date(2023, 3, 10), warranty_date=date(2026, 3, 10),
            charger_serial='CHG-HP-002', old_user='Carol Davis', date=date(2023, 3, 15),
            old_device='HP EliteBook 830', comments='Transferred from Carol', status='Assigned'
        ),
        Asset(
            emp_id='', employee_name='', mobile_number='',
            asset_name='Apple MacBook Pro 14"', category='Laptop',
            serial_number='SN-APL-003', model_name='MacBook Pro M2',
            os='macOS', version='Ventura 13.5', ram='16GB',
            location='Store Room', invoice_number='INV-2023-003',
            invoice_date=date(2023, 5, 5), warranty_date=date(2026, 5, 5),
            charger_serial='CHG-APL-003', old_user='', date=date(2023, 5, 10),
            old_device='', comments='Available for assignment', status='Available'
        ),
        Asset(
            emp_id='EMP003', employee_name='Carol Davis', mobile_number='9876543212',
            asset_name='Lenovo ThinkPad X1', category='Laptop',
            serial_number='SN-LEN-004', model_name='ThinkPad X1 Carbon Gen 11',
            os='Ubuntu', version='22.04 LTS', ram='16GB',
            location='HQ - Floor 3', invoice_number='INV-2023-004',
            invoice_date=date(2023, 7, 12), warranty_date=date(2026, 7, 12),
            charger_serial='CHG-LEN-004', old_user='', date=date(2023, 7, 15),
            old_device='', comments='Dev machine', status='Assigned'
        ),
        Asset(
            emp_id='EMP004', employee_name='David Brown', mobile_number='9876543213',
            asset_name='Dell Latitude 5540', category='Laptop',
            serial_number='SN-DELL-005', model_name='Latitude 5540',
            os='Windows 10', version='22H2', ram='8GB',
            location='Branch Office', invoice_number='INV-2022-005',
            invoice_date=date(2022, 9, 1), warranty_date=date(2025, 9, 1),
            charger_serial='CHG-DELL-005', old_user='Eva Martinez', date=date(2022, 9, 5),
            old_device='Dell Latitude 5430', comments='Warranty expiring soon', status='Assigned'
        ),
        Asset(
            emp_id='', employee_name='', mobile_number='',
            asset_name='HP ProBook 450', category='Laptop',
            serial_number='SN-HP-006', model_name='ProBook 450 G10',
            os='Windows 11', version='23H2', ram='8GB',
            location='Store Room', invoice_number='INV-2024-006',
            invoice_date=date(2024, 1, 20), warranty_date=date(2027, 1, 20),
            charger_serial='CHG-HP-006', old_user='', date=date(2024, 1, 25),
            old_device='', comments='New stock', status='Available'
        ),
        Asset(
            emp_id='EMP005', employee_name='Eva Martinez', mobile_number='9876543214',
            asset_name='Asus ZenBook 14', category='Laptop',
            serial_number='SN-ASUS-007', model_name='ZenBook 14 OLED',
            os='Windows 11', version='23H2', ram='16GB',
            location='HQ - Floor 2', invoice_number='INV-2023-007',
            invoice_date=date(2023, 11, 10), warranty_date=date(2026, 11, 10),
            charger_serial='CHG-ASUS-007', old_user='', date=date(2023, 11, 15),
            old_device='', comments='Design team laptop', status='Assigned'
        ),
        Asset(
            emp_id='', employee_name='', mobile_number='',
            asset_name='Lenovo IdeaPad 3', category='Laptop',
            serial_number='SN-LEN-008', model_name='IdeaPad 3 Gen 8',
            os='Windows 11', version='22H2', ram='4GB',
            location='Maintenance', invoice_number='INV-2022-008',
            invoice_date=date(2022, 4, 8), warranty_date=date(2025, 4, 8),
            charger_serial='CHG-LEN-008', old_user='Bob Williams', date=date(2022, 4, 10),
            old_device='', comments='Under repair - keyboard issue', status='Maintenance'
        ),
    ]

    for s in samples:
        db.session.add(s)

    # Activity logs
    logs = [
        ActivityLog(user='admin', action='CREATE', module='Asset', description='Added Dell Laptop XPS 15 [SN-DELL-001]'),
        ActivityLog(user='admin', action='ASSIGN', module='Asset', description='Assigned HP EliteBook 840 to Bob Williams'),
        ActivityLog(user='admin', action='CREATE', module='Asset', description='Added Apple MacBook Pro 14"'),
        ActivityLog(user='admin', action='UPDATE', module='Asset', description='Updated Lenovo IdeaPad 3 status to Maintenance'),
    ]
    db.session.add_all(logs)
    db.session.commit()
    print("✅ Sample data seeded!")

# ══════════════════════════════════════════════════════════════════════════════
# AUTH ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password):
        # Simple token: "demo:<username>"  (use JWT in production)
        token = f'demo:{username}'
        return jsonify({
            'success': True,
            'token': token,
            'user': {'username': user.username, 'email': user.email, 'role': user.role}
        }), 200

    return jsonify({'success': False, 'message': 'Invalid username or password'}), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    return jsonify({'success': True}), 200

# ══════════════════════════════════════════════════════════════════════════════
# DASHBOARD ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/dashboard/stats', methods=['GET'])
def dashboard_stats():
    total       = Asset.query.count()
    assigned    = Asset.query.filter_by(status='Assigned').count()
    available   = Asset.query.filter_by(status='Available').count()
    maintenance = Asset.query.filter_by(status='Maintenance').count()

    today = date.today()
    soon  = today + timedelta(days=90)
    expiring = Asset.query.filter(
        Asset.warranty_date != None,
        Asset.warranty_date <= soon,
        Asset.warranty_date >= today
    ).count()

    # Category breakdown (only assigned assets)
    from sqlalchemy import func
    cat_rows = db.session.query(Asset.category, func.count(Asset.id))\
                         .filter(Asset.status == 'Assigned')\
                         .group_by(Asset.category).all()
    categories = [{'name': r[0] or 'Unknown', 'count': r[1]} for r in cat_rows]

    # Laptop status breakdown
    laptop_total = Asset.query.filter_by(category='Laptop').count()
    laptop_available = Asset.query.filter_by(category='Laptop', status='Available').count()
    laptop_assigned = Asset.query.filter_by(category='Laptop', status='Assigned').count()
    laptop_maintenance = Asset.query.filter_by(category='Laptop', status='Maintenance').count()
    laptop_retired = Asset.query.filter_by(category='Laptop', status='Retired').count()

    return jsonify({
        'totalAssets':       total,
        'assignedAssets':    assigned,
        'availableAssets':   available,
        'maintenanceAssets': maintenance,
        'expiringWarranties': expiring,
        'categories':        categories,
        'laptopStats': {
            'total': laptop_total,
            'available': laptop_available,
            'assigned': laptop_assigned,
            'maintenance': laptop_maintenance,
            'retired': laptop_retired
        }
    }), 200

@app.route('/api/dashboard/activity', methods=['GET'])
def dashboard_activity():
    logs = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(10).all()
    return jsonify({'logs': [l.to_dict() for l in logs]}), 200

# ══════════════════════════════════════════════════════════════════════════════
# ASSET ROUTES  – full CRUD
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/assets', methods=['GET'])
def get_assets():
    search   = request.args.get('search', '').strip()
    location = request.args.get('location', '').strip()
    category = request.args.get('category', '').strip()
    status   = request.args.get('status', '').strip()
    page     = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    q = Asset.query

    if search:
        q = q.filter(or_(
            Asset.asset_name.ilike(f'%{search}%'),
            Asset.serial_number.ilike(f'%{search}%'),
            Asset.emp_id.ilike(f'%{search}%'),
            Asset.employee_name.ilike(f'%{search}%'),
            Asset.model_name.ilike(f'%{search}%'),
        ))
    if location:
        q = q.filter(Asset.location.ilike(f'%{location}%'))
    if category:
        q = q.filter(Asset.category.ilike(f'%{category}%'))
    if status:
        q = q.filter_by(status=status)

    total  = q.count()
    assets = q.order_by(Asset.created_at.desc()).offset((page-1)*per_page).limit(per_page).all()

    return jsonify({
        'assets': [a.to_dict() for a in assets],
        'total':  total,
        'page':   page,
        'pages':  (total + per_page - 1) // per_page,
    }), 200

@app.route('/api/assets/<int:asset_id>', methods=['GET'])
def get_asset(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    return jsonify(asset.to_dict()), 200

@app.route('/api/assets', methods=['POST'])
def create_asset():
    data = request.get_json() or {}
    current_user = get_current_user()

    # Validate required fields
    if not data.get('asset_name') or not data.get('serial_number'):
        return jsonify({'error': 'asset_name and serial_number are required'}), 400

    # Check duplicate serial number
    if Asset.query.filter_by(serial_number=data['serial_number'].strip()).first():
        return jsonify({'error': 'Serial number already exists'}), 409

    asset = Asset(
        emp_id          = data.get('emp_id', ''),
        employee_name   = data.get('employee_name', ''),
        mobile_number   = data.get('mobile_number', ''),
        asset_name      = data['asset_name'].strip(),
        category        = data.get('category', ''),
        serial_number   = data['serial_number'].strip(),
        model_name      = data.get('model_name', ''),
        os              = data.get('os', ''),
        version         = data.get('version', ''),
        ram             = data.get('ram', ''),
        location        = data.get('location', ''),
        invoice_number  = data.get('invoice_number', ''),
        invoice_date    = parse_date(data.get('invoice_date')),
        warranty_date   = parse_date(data.get('warranty_date')),
        charger_serial  = data.get('charger_serial', ''),
        old_user        = data.get('old_user', ''),
        date            = parse_date(data.get('date')) or date.today(),
        old_device      = data.get('old_device', ''),
        comments        = data.get('comments', ''),
        status          = data.get('status', 'Available'),
    )
    db.session.add(asset)
    log_activity('CREATE', 'Asset', f'Added asset: {asset.asset_name} [{asset.serial_number}]', current_user)
    db.session.commit()

    return jsonify({'success': True, 'asset': asset.to_dict()}), 201

@app.route('/api/assets/<int:asset_id>', methods=['PUT'])
def update_asset(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    data  = request.get_json() or {}
    current_user = get_current_user()

    # Check serial number uniqueness if changed
    new_serial = data.get('serial_number', asset.serial_number).strip()
    if new_serial != asset.serial_number:
        if Asset.query.filter_by(serial_number=new_serial).first():
            return jsonify({'error': 'Serial number already exists'}), 409

    asset.emp_id         = data.get('emp_id',         asset.emp_id)
    asset.employee_name  = data.get('employee_name',  asset.employee_name)
    asset.mobile_number  = data.get('mobile_number',  asset.mobile_number)
    asset.asset_name     = data.get('asset_name',     asset.asset_name).strip()
    asset.category       = data.get('category',       asset.category)
    asset.serial_number  = new_serial
    asset.model_name     = data.get('model_name',     asset.model_name)
    asset.os             = data.get('os',             asset.os)
    asset.version        = data.get('version',        asset.version)
    asset.ram            = data.get('ram',            asset.ram)
    asset.location       = data.get('location',       asset.location)
    asset.invoice_number = data.get('invoice_number', asset.invoice_number)
    asset.invoice_date   = parse_date(data.get('invoice_date')) or asset.invoice_date
    asset.warranty_date  = parse_date(data.get('warranty_date')) or asset.warranty_date
    asset.charger_serial = data.get('charger_serial', asset.charger_serial)
    asset.old_user       = data.get('old_user',       asset.old_user)
    asset.date           = parse_date(data.get('date')) or asset.date
    asset.old_device     = data.get('old_device',     asset.old_device)
    asset.comments       = data.get('comments',       asset.comments)
    asset.status         = data.get('status',         asset.status)
    asset.updated_at     = datetime.utcnow()

    log_activity('UPDATE', 'Asset', f'Updated asset: {asset.asset_name} [{asset.serial_number}]', current_user)
    db.session.commit()

    return jsonify({'success': True, 'asset': asset.to_dict()}), 200

@app.route('/api/assets/<int:asset_id>', methods=['DELETE'])
def delete_asset(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    current_user = get_current_user()
    name = asset.asset_name
    serial = asset.serial_number
    db.session.delete(asset)
    log_activity('DELETE', 'Asset', f'Deleted asset: {name} [{serial}]', current_user)
    db.session.commit()
    return jsonify({'success': True, 'message': f'Asset "{name}" deleted'}), 200

# ══════════════════════════════════════════════════════════════════════════════
# WARRANTY ALERTS
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/assets/warranty/expiring', methods=['GET'])
def warranty_expiring():
    days  = request.args.get('days', 90, type=int)
    today = date.today()
    soon  = today + timedelta(days=days)
    assets = Asset.query.filter(
        Asset.warranty_date != None,
        Asset.warranty_date <= soon,
        Asset.warranty_date >= today
    ).order_by(Asset.warranty_date).all()
    return jsonify({'assets': [a.to_dict() for a in assets]}), 200

# ══════════════════════════════════════════════════════════════════════════════
# REPORTS – CSV / Excel export
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/reports/export/csv', methods=['GET'])
def export_csv():
    assets = Asset.query.order_by(Asset.id).all()
    output = io.StringIO()
    writer = csv.writer(output)

    # Header – matches the 20 required columns
    writer.writerow([
        'Sl No', 'EMP ID', 'Employee Name', 'Mobile Number',
        'Asset Name', 'Category', 'Serial Number', 'Model Name',
        'OS', 'Version', 'RAM', 'Location',
        'Invoice Number', 'Invoice Date', 'Warranty Date',
        'Charger Serial Number', 'Old User', 'Date', 'Old Device',
        'Comments', 'Status'
    ])

    for a in assets:
        writer.writerow([
            a.id, a.emp_id, a.employee_name, a.mobile_number,
            a.asset_name, a.category, a.serial_number, a.model_name,
            a.os, a.version, a.ram, a.location,
            a.invoice_number, a.invoice_date, a.warranty_date,
            a.charger_serial, a.old_user, a.date, a.old_device,
            a.comments, a.status
        ])

    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),  # utf-8-sig for Excel compatibility
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'IT_Assets_{date.today()}.csv'
    )

@app.route('/api/reports/export/excel', methods=['GET'])
def export_excel():
    """Export as Excel using openpyxl"""
    try:
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
        from openpyxl.utils import get_column_letter
    except ImportError:
        # Fallback to CSV if openpyxl not installed
        return export_csv()

    assets = Asset.query.order_by(Asset.id).all()
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'IT Assets'

    headers = [
        'Sl No', 'EMP ID', 'Employee Name', 'Mobile Number',
        'Asset Name', 'Category', 'Serial Number', 'Model Name',
        'OS', 'Version', 'RAM', 'Location',
        'Invoice Number', 'Invoice Date', 'Warranty Date',
        'Charger Serial Number', 'Old User', 'Date', 'Old Device',
        'Comments', 'Status'
    ]

    # Style header row
    header_fill = PatternFill(start_color='1e3a5f', end_color='1e3a5f', fill_type='solid')
    header_font = Font(color='FFFFFF', bold=True, size=11)
    thin_border = Border(
        left=Side(style='thin'), right=Side(style='thin'),
        top=Side(style='thin'), bottom=Side(style='thin')
    )

    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.fill   = header_fill
        cell.font   = header_font
        cell.border = thin_border
        cell.alignment = Alignment(horizontal='center', vertical='center')

    ws.row_dimensions[1].height = 25

    # Data rows
    for row_idx, a in enumerate(assets, 2):
        row_data = [
            a.id, a.emp_id, a.employee_name, a.mobile_number,
            a.asset_name, a.category, a.serial_number, a.model_name,
            a.os, a.version, a.ram, a.location,
            a.invoice_number,
            a.invoice_date.strftime('%Y-%m-%d') if a.invoice_date else '',
            a.warranty_date.strftime('%Y-%m-%d') if a.warranty_date else '',
            a.charger_serial, a.old_user,
            a.date.strftime('%Y-%m-%d') if a.date else '',
            a.old_device, a.comments, a.status
        ]
        for col_idx, value in enumerate(row_data, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=value)
            cell.border = thin_border
            # Alternate row color
            if row_idx % 2 == 0:
                cell.fill = PatternFill(start_color='EEF2FF', end_color='EEF2FF', fill_type='solid')

    # Auto-fit column widths
    for col_idx, header in enumerate(headers, 1):
        col_letter = get_column_letter(col_idx)
        max_len = len(header)
        for row_idx in range(2, len(assets) + 2):
            val = ws.cell(row=row_idx, column=col_idx).value
            if val:
                max_len = max(max_len, len(str(val)))
        ws.column_dimensions[col_letter].width = min(max_len + 4, 30)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    return send_file(
        buffer,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'IT_Assets_{date.today()}.xlsx'
    )

@app.route('/api/reports/activity', methods=['GET'])
def activity_log():
    page     = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    total    = ActivityLog.query.count()
    logs     = ActivityLog.query.order_by(ActivityLog.timestamp.desc())\
                                .offset((page-1)*per_page).limit(per_page).all()
    return jsonify({
        'logs':  [l.to_dict() for l in logs],
        'total': total,
        'page':  page,
        'pages': (total + per_page - 1) // per_page,
    }), 200

# ── Health check ──────────────────────────────────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'IT Asset Management API running'}), 200

# ── Init DB and run ───────────────────────────────────────────────────────────
with app.app_context():
    db.create_all()
    seed_data()

if __name__ == '__main__':
    print("=" * 60)
    print("🚀  IT Asset Management API")
    print("=" * 60)
    print("✅  API:    http://0.0.0.0:5000")
    print("✅  Health: http://localhost:5000/api/health")
    print("⚛️   React:  http://localhost:3000")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)
