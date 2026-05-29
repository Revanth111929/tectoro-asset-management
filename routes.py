# routes.py - Simplified routes for IT Asset Management
import os, csv, io
from datetime import datetime, date, timedelta
from flask import (Blueprint, render_template, redirect, url_for,
                   request, flash, send_file, jsonify, current_app)
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_, func
from models import db, User, Asset, ActivityLog
from flask_cors import cross_origin
from werkzeug.utils import secure_filename

# Helper: write to activity log
def log_activity(action, module, description):
    entry = ActivityLog(
        user=current_user.username if current_user.is_authenticated else 'system',
        action=action, module=module, description=description
    )
    db.session.add(entry)
    db.session.commit()

def _parse_date(val):
    if val:
        try:
            return datetime.strptime(val, '%Y-%m-%d').date()
        except ValueError:
            pass
    return None

# AUTH BLUEPRINT
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/')
def landing():
    return render_template('landing.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        remember = request.form.get('remember') == 'on'

        user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password_hash, password):
            login_user(user, remember=remember)
            flash(f'Welcome back, {user.username}!', 'success')
            next_page = request.args.get('next')
            return redirect(next_page or url_for('main.dashboard'))
        else:
            flash('Invalid username or password.', 'danger')

    return render_template('login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('auth.login'))

# MAIN BLUEPRINT
main_bp = Blueprint('main', __name__)

@main_bp.route('/dashboard')
@login_required
def dashboard():
    total_assets     = Asset.query.count()
    assigned_assets  = Asset.query.filter_by(status='Assigned').count()
    available_assets = Asset.query.filter_by(status='Available').count()
    maintenance      = Asset.query.filter_by(status='Maintenance').count()

    recent_logs = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(10).all()

    # Assets by category
    cat_data = db.session.query(Asset.category, func.count(Asset.id))\
        .filter(Asset.category != None)\
        .group_by(Asset.category).all()
    cat_labels = [c[0] for c in cat_data]
    cat_counts = [c[1] for c in cat_data]

    # Warranty expiring within 90 days
    today = date.today()
    soon = today + timedelta(days=90)
    expiring = Asset.query.filter(
        Asset.warranty_date != None,
        Asset.warranty_date <= soon,
        Asset.warranty_date >= today
    ).count()

    return render_template('dashboard.html',
        total_assets=total_assets,
        assigned_assets=assigned_assets,
        available_assets=available_assets,
        maintenance=maintenance,
        recent_logs=recent_logs,
        cat_labels=cat_labels,
        cat_counts=cat_counts,
        expiring_soon=expiring
    )

# ASSET BLUEPRINT
asset_bp = Blueprint('asset', __name__, url_prefix='/assets')

@asset_bp.route('/')
@login_required
def list_assets():
    search   = request.args.get('search', '')
    category = request.args.get('category', '')
    status   = request.args.get('status', '')
    location = request.args.get('location', '')
    page     = request.args.get('page', 1, type=int)

    query = Asset.query

    if search:
        query = query.filter(or_(
            Asset.asset_name.ilike(f'%{search}%'),
            Asset.serial_number.ilike(f'%{search}%'),
            Asset.emp_id.ilike(f'%{search}%'),
            Asset.employee_name.ilike(f'%{search}%')
        ))
    if category:
        query = query.filter_by(category=category)
    if status:
        query = query.filter_by(status=status)
    if location:
        query = query.filter_by(location=location)

    assets = query.order_by(Asset.created_at.desc()).paginate(page=page, per_page=20, error_out=False)
    
    categories = db.session.query(Asset.category).distinct().filter(Asset.category != None).all()
    locations = db.session.query(Asset.location).distinct().filter(Asset.location != None).all()

    return render_template('assets/list.html',
        assets=assets,
        categories=[c[0] for c in categories],
        locations=[l[0] for l in locations],
        search=search, sel_category=category, sel_status=status, sel_location=location
    )

@asset_bp.route('/add', methods=['GET', 'POST'])
@login_required
def add_asset():
    if request.method == 'POST':
        serial = request.form['serial_number'].strip()
        
        asset = Asset(
            emp_id           = request.form.get('emp_id', '').strip(),
            employee_name    = request.form.get('employee_name', '').strip(),
            mobile_number    = request.form.get('mobile_number', '').strip(),
            asset_name       = request.form['asset_name'].strip(),
            category         = request.form.get('category', '').strip(),
            serial_number    = serial,
            model_name       = request.form.get('model_name', '').strip(),
            os               = request.form.get('os', '').strip(),
            version          = request.form.get('version', '').strip(),
            ram              = request.form.get('ram', '').strip(),
            location         = request.form.get('location', '').strip(),
            invoice_number   = request.form.get('invoice_number', '').strip(),
            invoice_date     = _parse_date(request.form.get('invoice_date')),
            warranty_date    = _parse_date(request.form.get('warranty_date')),
            charger_serial   = request.form.get('charger_serial', '').strip(),
            old_user         = request.form.get('old_user', '').strip(),
            date             = _parse_date(request.form.get('date')) or date.today(),
            old_device       = request.form.get('old_device', '').strip(),
            comments         = request.form.get('comments', '').strip(),
            status           = request.form.get('status', 'Available')
        )
        db.session.add(asset)
        db.session.commit()
        log_activity('CREATE', 'Asset', f'Added asset: {asset.asset_name} [{serial}]')
        flash(f'Asset "{asset.asset_name}" added successfully!', 'success')
        return redirect(url_for('asset.list_assets'))

    return render_template('assets/add.html')

@asset_bp.route('/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit_asset(id):
    asset = Asset.query.get_or_404(id)

    if request.method == 'POST':
        asset.emp_id         = request.form.get('emp_id', '').strip()
        asset.employee_name  = request.form.get('employee_name', '').strip()
        asset.mobile_number  = request.form.get('mobile_number', '').strip()
        asset.asset_name     = request.form['asset_name'].strip()
        asset.category       = request.form.get('category', '').strip()
        asset.serial_number  = request.form['serial_number'].strip()
        asset.model_name     = request.form.get('model_name', '').strip()
        asset.os             = request.form.get('os', '').strip()
        asset.version        = request.form.get('version', '').strip()
        asset.ram            = request.form.get('ram', '').strip()
        asset.location       = request.form.get('location', '').strip()
        asset.invoice_number = request.form.get('invoice_number', '').strip()
        asset.invoice_date   = _parse_date(request.form.get('invoice_date'))
        asset.warranty_date  = _parse_date(request.form.get('warranty_date'))
        asset.charger_serial = request.form.get('charger_serial', '').strip()
        asset.old_user       = request.form.get('old_user', '').strip()
        asset.date           = _parse_date(request.form.get('date'))
        asset.old_device     = request.form.get('old_device', '').strip()
        asset.comments       = request.form.get('comments', '').strip()
        asset.status         = request.form.get('status', 'Available')
        asset.updated_at     = datetime.utcnow()
        db.session.commit()
        log_activity('UPDATE', 'Asset', f'Updated asset: {asset.asset_name}')
        flash('Asset updated successfully!', 'success')
        return redirect(url_for('asset.list_assets'))

    return render_template('assets/edit.html', asset=asset)

@asset_bp.route('/delete/<int:id>', methods=['POST'])
@login_required
def delete_asset(id):
    asset = Asset.query.get_or_404(id)
    name  = asset.asset_name
    db.session.delete(asset)
    db.session.commit()
    log_activity('DELETE', 'Asset', f'Deleted asset: {name}')
    flash(f'Asset "{name}" deleted.', 'warning')
    return redirect(url_for('asset.list_assets'))

@asset_bp.route('/view/<int:id>')
@login_required
def view_asset(id):
    asset = Asset.query.get_or_404(id)
    return render_template('assets/view.html', asset=asset)

# REPORT BLUEPRINT
report_bp = Blueprint('report', __name__, url_prefix='/reports')

@report_bp.route('/')
@login_required
def reports():
    return render_template('reports/index.html')

@report_bp.route('/export/csv')
@login_required
def export_csv():
    assets = Asset.query.all()
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(['Sl No','EMP ID','Employee Name','Mobile','Asset Name','Category',
                     'Serial Number','Model','OS','Version','RAM','Location',
                     'Invoice Number','Invoice Date','Warranty Date','Charger Serial',
                     'Old User','Date','Old Device','Comments','Status'])

    for a in assets:
        writer.writerow([
            a.id, a.emp_id or '', a.employee_name or '', a.mobile_number or '',
            a.asset_name, a.category or '', a.serial_number, a.model_name or '',
            a.os or '', a.version or '', a.ram or '', a.location or '',
            a.invoice_number or '', a.invoice_date or '', a.warranty_date or '',
            a.charger_serial or '', a.old_user or '', a.date or '',
            a.old_device or '', a.comments or '', a.status
        ])

    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'assets_{date.today()}.csv'
    )

@report_bp.route('/activity')
@login_required
def activity_log():
    page = request.args.get('page', 1, type=int)
    logs = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).paginate(page=page, per_page=20, error_out=False)
    return render_template('reports/activity.html', logs=logs)

@report_bp.route('/warranty')
@login_required
def warranty_alerts():
    today = date.today()
    soon = today + timedelta(days=90)
    expiring = Asset.query.filter(
        Asset.warranty_date != None,
        Asset.warranty_date <= soon,
        Asset.warranty_date >= today
    ).order_by(Asset.warranty_date).all()
    return render_template('reports/warranty.html', assets=expiring)

# API BLUEPRINT (for React frontend)
api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/dashboard/stats')
@cross_origin()
def api_dashboard_stats():
    total     = Asset.query.count()
    assigned  = Asset.query.filter_by(status='Assigned').count()
    available = Asset.query.filter_by(status='Available').count()
    maintenance = Asset.query.filter_by(status='Maintenance').count()

    today = date.today()
    soon  = today + timedelta(days=90)
    expiring = Asset.query.filter(
        Asset.warranty_date != None,
        Asset.warranty_date <= soon,
        Asset.warranty_date >= today
    ).count()

    # Category breakdown (only assigned assets)
    cat_data = db.session.query(Asset.category, func.count(Asset.id))\
        .filter(Asset.status == 'Assigned')\
        .filter(Asset.category != None)\
        .group_by(Asset.category).all()

    # Laptop status breakdown
    laptop_total = Asset.query.filter_by(category='Laptop').count()
    laptop_available = Asset.query.filter_by(category='Laptop', status='Available').count()
    laptop_assigned = Asset.query.filter_by(category='Laptop', status='Assigned').count()
    laptop_maintenance = Asset.query.filter_by(category='Laptop', status='Maintenance').count()
    laptop_retired = Asset.query.filter_by(category='Laptop', status='Retired').count()

    return jsonify({
        'totalAssets': total,
        'assignedAssets': assigned,
        'availableAssets': available,
        'maintenanceAssets': maintenance,
        'expiringWarranties': expiring,
        'categories': [{'name': c[0], 'count': c[1]} for c in cat_data],
        'laptopStats': {
            'total': laptop_total,
            'available': laptop_available,
            'assigned': laptop_assigned,
            'maintenance': laptop_maintenance,
            'retired': laptop_retired
        }
    })

@api_bp.route('/dashboard/activity')
@cross_origin()
def api_dashboard_activity():
    logs = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(20).all()
    return jsonify({'logs': [l.to_dict() for l in logs]})

@api_bp.route('/assets')
@cross_origin()
def api_assets():
    search   = request.args.get('search', '')
    category = request.args.get('category', '')
    status   = request.args.get('status', '')
    location = request.args.get('location', '')
    page     = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    query = Asset.query
    if search:
        query = query.filter(or_(
            Asset.asset_name.ilike(f'%{search}%'),
            Asset.serial_number.ilike(f'%{search}%'),
            Asset.emp_id.ilike(f'%{search}%'),
            Asset.employee_name.ilike(f'%{search}%')
        ))
    if category: query = query.filter_by(category=category)
    if status:   query = query.filter_by(status=status)
    if location: query = query.filter_by(location=location)

    sort = request.args.get('sort', 'id_asc')
    sort_map = {
        'id_asc':   Asset.id.asc(),
        'id_desc':  Asset.id.desc(),
        'emp_asc':  Asset.emp_id.asc(),
        'emp_desc': Asset.emp_id.desc(),
        'name_asc': Asset.asset_name.asc(),
    }
    paginated = query.order_by(sort_map.get(sort, Asset.id.asc())).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'assets': [a.to_dict() for a in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'page': page
    })

@api_bp.route('/assets/<int:asset_id>')
@cross_origin()
def api_asset_detail(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    return jsonify(asset.to_dict())

@api_bp.route('/assets/<int:asset_id>', methods=['DELETE'])
@cross_origin()
def api_delete_asset(asset_id):
    """Delete an asset"""
    try:
        asset = Asset.query.get_or_404(asset_id)
        asset_name = asset.asset_name
        serial = asset.serial_number
        
        db.session.delete(asset)
        db.session.commit()
        
        # Log activity
        log = ActivityLog(
            user='admin',
            action='DELETE',
            module='Asset',
            description=f'Deleted asset: {asset_name} [{serial}]'
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Asset "{asset_name}" deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/assets/<int:asset_id>', methods=['PUT'])
@cross_origin()
def api_update_asset(asset_id):
    """Update an asset"""
    try:
        asset = Asset.query.get_or_404(asset_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Parse dates helper
        def parse_date(val):
            if not val:
                return None
            try:
                return datetime.strptime(val, '%Y-%m-%d').date()
            except:
                return None
        
        # Check serial number uniqueness only if it's being changed
        if 'serial_number' in data:
            new_serial = data['serial_number'].strip()
            if new_serial != asset.serial_number:
                existing = Asset.query.filter_by(serial_number=new_serial).first()
                if existing:
                    return jsonify({'error': 'Serial number already exists'}), 409
                asset.serial_number = new_serial
        
        # Update only fields that are provided in the request
        if 'emp_id' in data:
            asset.emp_id = data['emp_id']
        if 'employee_name' in data:
            asset.employee_name = data['employee_name']
        if 'employee_email' in data:
            asset.employee_email = data['employee_email']
        if 'mobile_number' in data:
            asset.mobile_number = data['mobile_number']
        if 'asset_name' in data:
            asset.asset_name = data['asset_name']
        if 'category' in data:
            asset.category = data['category']
        if 'model_name' in data:
            asset.model_name = data['model_name']
        if 'os' in data:
            asset.os = data['os']
        if 'version' in data:
            asset.version = data['version']
        if 'ram' in data:
            asset.ram = data['ram']
        if 'location' in data:
            asset.location = data['location']
        if 'invoice_number' in data:
            asset.invoice_number = data['invoice_number']
        if 'invoice_date' in data:
            asset.invoice_date = parse_date(data['invoice_date'])
        if 'warranty_date' in data:
            asset.warranty_date = parse_date(data['warranty_date'])
        if 'charger_serial' in data:
            asset.charger_serial = data['charger_serial']
        if 'old_user' in data:
            asset.old_user = data['old_user']
        if 'date' in data:
            asset.date = parse_date(data['date'])
        if 'old_device' in data:
            asset.old_device = data['old_device']
        if 'comments' in data:
            asset.comments = data['comments']
        if 'status' in data:
            asset.status = data['status']
        
        # Update all new fields
        if 'purchase_price' in data:
            asset.purchase_price = data['purchase_price']
        if 'quantity' in data:
            asset.quantity = data['quantity']
        if 'configuration' in data:
            asset.configuration = data['configuration']
        if 'laptop_bag_serial' in data:
            asset.laptop_bag_serial = data['laptop_bag_serial']
        if 'hard_disk_serial' in data:
            asset.hard_disk_serial = data['hard_disk_serial']
        if 'hard_disk_capacity' in data:
            asset.hard_disk_capacity = data['hard_disk_capacity']
        if 'ups_serial' in data:
            asset.ups_serial = data['ups_serial']
        if 'ups_capacity' in data:
            asset.ups_capacity = data['ups_capacity']
        if 'printer_type' in data:
            asset.printer_type = data['printer_type']
        if 'printer_model' in data:
            asset.printer_model = data['printer_model']
        if 'mobile_imei' in data:
            asset.mobile_imei = data['mobile_imei']
        if 'mobile_number_sim' in data:
            asset.mobile_number_sim = data['mobile_number_sim']
        if 'testing_status' in data:
            asset.testing_status = data['testing_status']
        
        asset.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Log activity
        log = ActivityLog(
            user='admin',
            action='UPDATE',
            module='Asset',
            description=f'Updated asset: {asset.asset_name} [{asset.serial_number}]'
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'asset': asset.to_dict(),
            'message': 'Asset updated successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error updating asset {asset_id}: {str(e)}')
        return jsonify({'error': str(e)}), 500

@api_bp.route('/assets', methods=['POST'])
@cross_origin()
def api_create_asset():
    """Create a new asset"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('asset_name') or not data.get('serial_number'):
            return jsonify({'error': 'Asset name and serial number are required'}), 400
        
        # Check duplicate serial number
        if Asset.query.filter_by(serial_number=data['serial_number'].strip()).first():
            return jsonify({'error': 'Serial number already exists'}), 409
        
        # Parse dates
        def parse_date(val):
            if not val:
                return None
            try:
                return datetime.strptime(val, '%Y-%m-%d').date()
            except:
                return None
        
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
        db.session.commit()
        
        # Log activity
        log = ActivityLog(
            user='admin',
            action='CREATE',
            module='Asset',
            description=f'Added asset: {asset.asset_name} [{asset.serial_number}]'
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'asset': asset.to_dict(),
            'message': 'Asset created successfully'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/auth/login', methods=['POST'])
@cross_origin()
def api_login():
    data     = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password):
        return jsonify({
            'success': True,
            'token': f'user-{user.id}-{user.username}',
            'user': {'id': user.id, 'username': user.username, 'role': user.role}
        })
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@api_bp.route('/auth/logout', methods=['POST'])
@cross_origin()
def api_logout():
    return jsonify({'success': True})

@api_bp.route('/health')
@cross_origin()
def api_health():
    return jsonify({'status': 'ok', 'message': 'API running'})

@api_bp.route('/assets/import', methods=['POST'])
@cross_origin()
def api_import_assets():
    """Import assets from Excel file"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        return jsonify({'error': 'Only Excel files (.xlsx, .xls) are allowed'}), 400
    
    try:
        import pandas as pd
        from datetime import datetime
        
        # Read Excel file
        df = pd.read_excel(file)
        
        # Expected columns
        required_cols = ['Asset Name', 'Serial Number']
        for col in required_cols:
            if col not in df.columns:
                return jsonify({'error': f'Missing required column: {col}'}), 400
        
        success_count = 0
        error_count = 0
        errors = []
        
        for idx, row in df.iterrows():
            try:
                # Check if serial number already exists
                if Asset.query.filter_by(serial_number=str(row.get('Serial Number', '')).strip()).first():
                    errors.append(f"Row {idx+2}: Serial number '{row.get('Serial Number')}' already exists")
                    error_count += 1
                    continue
                
                # Parse dates
                def parse_date(val):
                    if pd.isna(val) or val == '':
                        return None
                    if isinstance(val, str):
                        try:
                            return datetime.strptime(val, '%Y-%m-%d').date()
                        except:
                            try:
                                return datetime.strptime(val, '%d/%m/%Y').date()
                            except:
                                return None
                    return val.date() if hasattr(val, 'date') else None
                
                asset = Asset(
                    emp_id           = str(row.get('EMP ID', '')).strip() if not pd.isna(row.get('EMP ID')) else '',
                    employee_name    = str(row.get('Employee Name', '')).strip() if not pd.isna(row.get('Employee Name')) else '',
                    mobile_number    = str(row.get('Mobile Number', '')).strip() if not pd.isna(row.get('Mobile Number')) else '',
                    asset_name       = str(row.get('Asset Name', '')).strip(),
                    category         = str(row.get('Category', '')).strip() if not pd.isna(row.get('Category')) else '',
                    serial_number    = str(row.get('Serial Number', '')).strip(),
                    model_name       = str(row.get('Model Name', '')).strip() if not pd.isna(row.get('Model Name')) else '',
                    os               = str(row.get('OS', '')).strip() if not pd.isna(row.get('OS')) else '',
                    version          = str(row.get('Version', '')).strip() if not pd.isna(row.get('Version')) else '',
                    ram              = str(row.get('RAM', '')).strip() if not pd.isna(row.get('RAM')) else '',
                    location         = str(row.get('Location', '')).strip() if not pd.isna(row.get('Location')) else '',
                    invoice_number   = str(row.get('Invoice Number', '')).strip() if not pd.isna(row.get('Invoice Number')) else '',
                    invoice_date     = parse_date(row.get('Invoice Date')),
                    warranty_date    = parse_date(row.get('Warranty Date')),
                    charger_serial   = str(row.get('Charger Serial Number', '')).strip() if not pd.isna(row.get('Charger Serial Number')) else '',
                    old_user         = str(row.get('Old User', '')).strip() if not pd.isna(row.get('Old User')) else '',
                    date             = parse_date(row.get('Date')) or date.today(),
                    old_device       = str(row.get('Old Device', '')).strip() if not pd.isna(row.get('Old Device')) else '',
                    comments         = str(row.get('Comments', '')).strip() if not pd.isna(row.get('Comments')) else '',
                    status           = str(row.get('Status', 'Available')).strip() if not pd.isna(row.get('Status')) else 'Available'
                )
                db.session.add(asset)
                success_count += 1
            except Exception as e:
                errors.append(f"Row {idx+2}: {str(e)}")
                error_count += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Import completed: {success_count} assets added, {error_count} errors',
            'imported': success_count,
            'errors': error_count,
            'error_details': errors[:10]  # Return first 10 errors
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Import failed: {str(e)}'}), 500

@api_bp.route('/assets/template', methods=['GET'])
@cross_origin()
def api_download_template():
    """Download Excel template for bulk import"""
    try:
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment
        
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = 'Asset Import Template'
        
        # Headers
        headers = [
            'EMP ID', 'Employee Name', 'Mobile Number', 'Asset Name', 'Category',
            'Serial Number', 'Model Name', 'OS', 'Version', 'RAM', 'Location',
            'Invoice Number', 'Invoice Date', 'Warranty Date', 'Charger Serial Number',
            'Old User', 'Date', 'Old Device', 'Comments', 'Status'
        ]
        
        # Style header
        header_fill = PatternFill(start_color='1e3a5f', end_color='1e3a5f', fill_type='solid')
        header_font = Font(color='FFFFFF', bold=True)
        
        for col_idx, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_idx, value=header)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal='center', vertical='center')
        
        # Add sample data
        sample_data = [
            'EMP001', 'John Doe', '9876543210', 'Dell Laptop XPS 15', 'Laptop',
            'SN-DELL-001', 'XPS 15 9520', 'Windows 11', '23H2', '16GB', 'HQ - Floor 2',
            'INV-2024-001', '2024-01-15', '2027-01-15', 'CHG-DELL-001',
            '', '2024-01-20', '', 'Primary work laptop', 'Assigned'
        ]
        
        for col_idx, value in enumerate(sample_data, 1):
            ws.cell(row=2, column=col_idx, value=value)
        
        # Auto-fit columns
        for col_idx in range(1, len(headers) + 1):
            ws.column_dimensions[openpyxl.utils.get_column_letter(col_idx)].width = 18
        
        # Add instructions
        ws2 = wb.create_sheet('Instructions')
        instructions = [
            ['Asset Import Template - Instructions'],
            [''],
            ['Required Fields (must be filled):'],
            ['  • Asset Name'],
            ['  • Serial Number (must be unique)'],
            [''],
            ['Optional Fields:'],
            ['  • All other fields are optional'],
            [''],
            ['Date Format:'],
            ['  • Use YYYY-MM-DD format (e.g., 2024-01-15)'],
            ['  • Or DD/MM/YYYY format (e.g., 15/01/2024)'],
            [''],
            ['Status Options:'],
            ['  • Available'],
            ['  • Assigned'],
            ['  • Maintenance'],
            [''],
            ['Notes:'],
            ['  • Delete the sample row before importing your data'],
            ['  • Serial numbers must be unique'],
            ['  • Maximum 1000 rows per import'],
        ]
        
        for row_idx, row_data in enumerate(instructions, 1):
            ws2.cell(row=row_idx, column=1, value=row_data[0])
        
        ws2.column_dimensions['A'].width = 60
        
        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        
        return send_file(
            buffer,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='Asset_Import_Template.xlsx'
        )
    except Exception as e:
        return jsonify({'error': f'Failed to generate template: {str(e)}'}), 500

# ── USER MANAGEMENT API ───────────────────────────────────────────────────────
@api_bp.route('/users', methods=['GET'])
@cross_origin()
def api_get_users():
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'role': u.role,
        'created_at': u.created_at.isoformat() if hasattr(u, 'created_at') and u.created_at else None
    } for u in users])

@api_bp.route('/users', methods=['POST'])
@cross_origin()
def api_create_user():
    data = request.get_json()
    username = data.get('username', '').strip()
    email    = data.get('email', '').strip()
    password = data.get('password', '')
    role     = data.get('role', 'standard')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
    if email and User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400
    if not email:
        email = None

    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        role=role
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User created', 'id': user.id}), 201

@api_bp.route('/users/<int:uid>', methods=['PUT'])
@cross_origin()
def api_update_user(uid):
    user = User.query.get_or_404(uid)
    data = request.get_json()

    if 'username' in data and data['username'].strip():
        existing = User.query.filter_by(username=data['username'].strip()).first()
        if existing and existing.id != uid:
            return jsonify({'error': 'Username already exists'}), 400
        user.username = data['username'].strip()

    if 'email' in data:
        user.email = data['email'].strip()
    if 'role' in data:
        user.role = data['role']
    if 'password' in data and data['password']:
        user.password_hash = generate_password_hash(data['password'])

    db.session.commit()
    return jsonify({'message': 'User updated'})

@api_bp.route('/users/<int:uid>', methods=['DELETE'])
@cross_origin()
def api_delete_user(uid):
    user = User.query.get_or_404(uid)
    if user.username == 'admin':
        return jsonify({'error': 'Cannot delete the main admin user'}), 403
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted'})


# ── EMAIL API ─────────────────────────────────────────────────────────────────
@api_bp.route('/users/<int:uid>/smtp-password', methods=['PUT'])
@cross_origin()
def api_update_smtp_password(uid):
    user = User.query.get_or_404(uid)
    data = request.get_json()
    pwd  = data.get('smtp_password', '').strip()
    if not pwd:
        return jsonify({'error': 'Password is required'}), 400
    from werkzeug.security import generate_password_hash
    user.smtp_password = pwd          # store plain for SMTP use
    db.session.commit()
    return jsonify({'message': 'SMTP password saved'})


@api_bp.route('/assets/<int:asset_id>/send-assignment-email', methods=['POST'])
@cross_origin()
def api_send_assignment_email(asset_id):
    try:
        data             = request.get_json()
        recipient_email  = data.get('recipient_email', '').strip()
        sender_user_id   = data.get('sender_user_id')

        if not recipient_email:
            return jsonify({'error': 'Recipient email is required'}), 400

        asset = Asset.query.get_or_404(asset_id)
        sender = User.query.get(sender_user_id) if sender_user_id else None

        if not sender or not sender.email:
            return jsonify({'error': 'Sender email not configured'}), 400
        if not sender.smtp_password:
            return jsonify({'error': 'SMTP password not set. Please update it in Settings.'}), 400

        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        subject = f"Asset Assignment Acknowledgement – {asset.asset_name}"

        html_body = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <div style="background:#1e3a5f;padding:24px;text-align:center;">
            <h2 style="color:#fff;margin:0;">Tectoro Asset Management</h2>
            <p style="color:#93c5fd;margin:4px 0 0;">Asset Assignment Confirmation</p>
          </div>
          <div style="padding:32px;">
            <p style="font-size:16px;">Dear <strong>{asset.employee_name or recipient_email}</strong>,</p>
            <p>This is to confirm that the following asset has been assigned to you:</p>

            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
              <tr style="background:#f1f5f9;">
                <td style="padding:10px 14px;font-weight:bold;width:40%;">Asset Name</td>
                <td style="padding:10px 14px;">{asset.asset_name}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;font-weight:bold;">Category</td>
                <td style="padding:10px 14px;">{asset.category or '—'}</td>
              </tr>
              <tr style="background:#f1f5f9;">
                <td style="padding:10px 14px;font-weight:bold;">Serial Number</td>
                <td style="padding:10px 14px;">{asset.serial_number}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;font-weight:bold;">Model</td>
                <td style="padding:10px 14px;">{asset.model_name or '—'}</td>
              </tr>
              <tr style="background:#f1f5f9;">
                <td style="padding:10px 14px;font-weight:bold;">Assignment Date</td>
                <td style="padding:10px 14px;">{asset.date or '—'}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;font-weight:bold;">Location</td>
                <td style="padding:10px 14px;">{asset.location or '—'}</td>
              </tr>
              <tr style="background:#f1f5f9;">
                <td style="padding:10px 14px;font-weight:bold;">EMP ID</td>
                <td style="padding:10px 14px;">{asset.emp_id or '—'}</td>
              </tr>
            </table>

            <p style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;">
              Please acknowledge receipt of this asset by replying to this email.
              You are responsible for the safe custody of this asset.
            </p>

            <p style="margin-top:24px;">Regards,<br/>
            <strong>{sender.username}</strong><br/>
            Tectoro Asset Management Team</p>
          </div>
          <div style="background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#94a3b8;">
            This is an automated message from Tectoro Asset Management System.
          </div>
        </div>
        """

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From']    = sender.email
        msg['To']      = recipient_email
        msg.attach(MIMEText(html_body, 'html'))

        with smtplib.SMTP('smtp.office365.com', 587) as server:
            server.starttls()
            server.login(sender.email, sender.smtp_password)
            server.sendmail(sender.email, recipient_email, msg.as_string())

        log = ActivityLog(
            user=sender.username,
            action='EMAIL',
            module='Asset',
            description=f'Assignment email sent to {recipient_email} for {asset.asset_name} [{asset.serial_number}]'
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({'success': True, 'message': f'Email sent to {recipient_email}'})

    except smtplib.SMTPAuthenticationError:
        return jsonify({'error': 'SMTP authentication failed. Check your email/password in Settings.'}), 401
    except smtplib.SMTPException as e:
        return jsonify({'error': f'Email sending failed: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── REPORTS API ───────────────────────────────────────────────────────────────
@api_bp.route('/reports/activity')
@cross_origin()
def api_reports_activity():
    page     = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    logs     = ActivityLog.query.order_by(ActivityLog.timestamp.desc())\
                   .paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'logs':  [l.to_dict() for l in logs.items],
        'total': logs.total,
        'pages': logs.pages,
        'page':  page
    })

@api_bp.route('/reports/export/csv')
@cross_origin()
def api_reports_export_csv():
    assets = Asset.query.all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Sl No','EMP ID','Employee Name','Mobile','Employee Email','Asset Name',
                     'Category','Serial Number','Model','OS','Version','RAM','Location',
                     'Invoice Number','Invoice Date','Warranty Date','Charger Serial',
                     'Old User','Date','Old Device','Comments','Status'])
    for a in assets:
        writer.writerow([
            a.id, a.emp_id or '', a.employee_name or '', a.mobile_number or '',
            a.employee_email or '', a.asset_name, a.category or '', a.serial_number,
            a.model_name or '', a.os or '', a.version or '', a.ram or '', a.location or '',
            a.invoice_number or '', a.invoice_date or '', a.warranty_date or '',
            a.charger_serial or '', a.old_user or '', a.date or '',
            a.old_device or '', a.comments or '', a.status
        ])
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'assets_{date.today()}.csv'
    )

@api_bp.route('/reports/export/excel')
@cross_origin()
def api_reports_export_excel():
    try:
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment
        assets = Asset.query.all()
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = 'Assets'
        headers = ['Sl No','EMP ID','Employee Name','Mobile','Employee Email','Asset Name',
                   'Category','Serial Number','Model','OS','Version','RAM','Location',
                   'Invoice Number','Invoice Date','Warranty Date','Status']
        hfill = PatternFill(start_color='1e3a5f', end_color='1e3a5f', fill_type='solid')
        hfont = Font(color='FFFFFF', bold=True)
        for ci, h in enumerate(headers, 1):
            cell = ws.cell(row=1, column=ci, value=h)
            cell.fill = hfill
            cell.font = hfont
            cell.alignment = Alignment(horizontal='center')
        for ri, a in enumerate(assets, 2):
            row = [a.id, a.emp_id or '', a.employee_name or '', a.mobile_number or '',
                   a.employee_email or '', a.asset_name, a.category or '', a.serial_number,
                   a.model_name or '', a.os or '', a.version or '', a.ram or '', a.location or '',
                   a.invoice_number or '', str(a.invoice_date or ''), str(a.warranty_date or ''), a.status]
            for ci, val in enumerate(row, 1):
                ws.cell(row=ri, column=ci, value=val)
        for ci in range(1, len(headers)+1):
            ws.column_dimensions[openpyxl.utils.get_column_letter(ci)].width = 16
        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        return send_file(buf,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'assets_{date.today()}.xlsx')
    except Exception as e:
        return jsonify({'error': str(e)}), 500
