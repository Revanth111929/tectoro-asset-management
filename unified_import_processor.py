# unified_import_processor.py
# Process unified Excel imports with mixed categories
# Routes rows to assets or corporate_sims tables based on CATEGORY

import openpyxl
from datetime import datetime, date
from unified_import_template import get_column_mapping, VALID_CATEGORIES, CATEGORY_REQUIRED_FIELDS
import logging

logger = logging.getLogger(__name__)


def parse_date_safe(value):
    """Safely parse various date formats"""
    if not value:
        return None
    
    if isinstance(value, date):
        return value
    
    if isinstance(value, datetime):
        return value.date()
    
    # Try parsing string dates
    value_str = str(value).strip()
    if not value_str:
        return None
    
    # Try YYYY-MM-DD
    try:
        return datetime.strptime(value_str, '%Y-%m-%d').date()
    except:
        pass
    
    # Try DD/MM/YYYY
    try:
        return datetime.strptime(value_str, '%d/%m/%Y').date()
    except:
        pass
    
    # Try MM/DD/YYYY
    try:
        return datetime.strptime(value_str, '%m/%d/%Y').date()
    except:
        pass
    
    return None


def normalize_column_name(col_name):
    """
    Normalize column name for comparison.
    Handles variations in whitespace and special characters.
    """
    if not col_name:
        return ''
    
    # Convert to string and strip
    name = str(col_name).strip()
    
    # Normalize common variations
    # Handle "Old User/ New" vs "Old User/New" vs "Old User / New"
    name = name.replace(' / ', '/ ').replace('/ ', '/ ')
    
    # Replace multiple spaces with single space
    import re
    name = re.sub(r'\s+', ' ', name)
    
    return name


def get_column_index_map(headers):
    """
    Create a mapping from normalized column names to Excel column indices.
    Handles exact business format column names.
    """
    from unified_import_template import UNIFIED_COLUMNS
    
    # Create mapping of normalized expected names to indices
    column_map = {}
    
    for idx, header in enumerate(headers):
        normalized = normalize_column_name(header)
        
        # Try to match against expected columns
        for expected_col in UNIFIED_COLUMNS:
            if normalize_column_name(expected_col) == normalized:
                column_map[expected_col] = idx
                break
    
    return column_map


def validate_and_parse_excel(file_stream):
    """
    Parse and validate uploaded Excel file using EXACT business format.
    Returns preview data with row-by-row validation.
    
    Args:
        file_stream: File stream from Flask request.files (FileStorage object or BytesIO)
    
    Returns:
        dict: {
            'success': bool,
            'total_rows': int,
            'valid_rows': int,
            'invalid_rows': int,
            'category_counts': dict,
            'rows': list of dicts with row data and validation,
            'errors': list of error messages,
            'warnings': list of warning messages
        }
    """
    from io import BytesIO
    
    try:
        # If file_stream is a FileStorage object, read it into BytesIO
        if hasattr(file_stream, 'read'):
            file_content = file_stream.read()
            file_stream = BytesIO(file_content)
        
        wb = openpyxl.load_workbook(file_stream, data_only=True)
        ws = wb.active
        
        # Read headers from first row
        headers = []
        for cell in ws[1]:
            header = normalize_column_name(cell.value) if cell.value else ''
            headers.append(header)
        
        if not headers or all(h == '' for h in headers):
            return {
                'success': False,
                'errors': ['Excel file has no headers in row 1'],
                'total_rows': 0,
                'valid_rows': 0,
                'invalid_rows': 0,
                'category_counts': {},
                'rows': [],
                'warnings': []
            }
        
        # Get column mapping
        column_map = get_column_index_map(headers)
        
        # Check for required columns
        if 'CATEGORY' not in column_map:
            return {
                'success': False,
                'errors': ['Missing required CATEGORY column. Please use the correct template.'],
                'total_rows': 0,
                'valid_rows': 0,
                'invalid_rows': 0,
                'category_counts': {},
                'rows': [],
                'warnings': []
            }
        
        if 'Asset NAME' not in column_map:
            return {
                'success': False,
                'errors': ['Missing required "Asset NAME" column. Please use the correct template.'],
                'total_rows': 0,
                'valid_rows': 0,
                'invalid_rows': 0,
                'category_counts': {},
                'rows': [],
                'warnings': []
            }
        
        category_idx = column_map['CATEGORY']
        
        # Parse all data rows
        parsed_rows = []
        category_counts = {}
        valid_count = 0
        invalid_count = 0
        all_serials = set()
        errors = []
        warnings = []
        
        for row_num, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            # Skip completely empty rows
            if not row or all(cell is None or str(cell).strip() == '' for cell in row):
                continue
            
            # Create dict from row using exact column names
            row_data = {}
            for col_name, col_idx in column_map.items():
                if col_idx < len(row):
                    value = row[col_idx]
                    if value is not None and str(value).strip() != '':
                        row_data[col_name] = value
            
            # Validate row
            row_errors = []
            row_warnings = []
            
            # Check CATEGORY
            category = str(row_data.get('CATEGORY', '')).strip()
            if not category:
                row_errors.append('Missing CATEGORY')
            elif category not in VALID_CATEGORIES:
                row_errors.append(f'Invalid CATEGORY: "{category}". Must be one of: {", ".join(VALID_CATEGORIES)}')
            else:
                # Count categories
                category_counts[category] = category_counts.get(category, 0) + 1
                
                # Check category-specific required fields
                required_fields = CATEGORY_REQUIRED_FIELDS.get(category, [])
                for field in required_fields:
                    if field == 'CATEGORY':
                        continue  # Already checked
                    if not row_data.get(field):
                        row_errors.append(f'Missing required field for {category}: {field}')
                
                # Check for duplicates within file (only for non-Corporate SIM)
                if category != 'Corporate SIM':
                    serial = str(row_data.get('SERIAL NUMBER', '')).strip()
                    if serial:
                        if serial in all_serials:
                            row_warnings.append(f'Duplicate SERIAL NUMBER in file: {serial}')
                        all_serials.add(serial)
            
            # Determine if row is valid
            is_valid = len(row_errors) == 0
            if is_valid:
                valid_count += 1
            else:
                invalid_count += 1
            
            # Add parsed row
            parsed_rows.append({
                'row_number': row_num,
                'category': category,
                'data': row_data,
                'is_valid': is_valid,
                'errors': row_errors,
                'warnings': row_warnings
            })
        
        total_rows = len(parsed_rows)
        
        return {
            'success': True,
            'total_rows': total_rows,
            'valid_rows': valid_count,
            'invalid_rows': invalid_count,
            'category_counts': category_counts,
            'rows': parsed_rows,
            'errors': [],
            'warnings': warnings
        }
        
    except Exception as e:
        logger.error(f"Error parsing Excel: {e}", exc_info=True)
        return {
            'success': False,
            'errors': [f'Failed to parse Excel file: {str(e)}'],
            'total_rows': 0,
            'valid_rows': 0,
            'invalid_rows': 0,
            'category_counts': {},
            'rows': [],
            'warnings': []
        }


def import_unified_excel(file_stream, db, current_username):
    """
    Import assets from unified Excel file.
    Routes each row to correct table based on CATEGORY.
    
    Args:
        file_stream: File stream from Flask request.files (FileStorage object or BytesIO)
        db: SQLAlchemy database instance
        current_username: Username of person performing import
    
    Returns:
        dict: {
            'success': bool,
            'message': str,
            'imported': int,
            'skipped': int,
            'failed': int,
            'category_breakdown': dict,
            'errors': list of error messages
        }
    """
    from models import Asset, CorporateSIM, Employee, AuditLog
    from services.audit_service import AuditService
    from io import BytesIO
    
    # Convert file stream to BytesIO if needed
    if hasattr(file_stream, 'read'):
        file_content = file_stream.read()
        file_stream = BytesIO(file_content)
    
    # First validate and parse
    validation_result = validate_and_parse_excel(file_stream)
    
    if not validation_result['success']:
        return {
            'success': False,
            'message': 'Validation failed',
            'imported': 0,
            'skipped': 0,
            'failed': 0,
            'category_breakdown': {},
            'errors': validation_result['errors']
        }
    
    if validation_result['invalid_rows'] > 0:
        # Collect all row errors
        error_details = []
        for row in validation_result['rows']:
            if not row['is_valid']:
                for error in row['errors']:
                    error_details.append(f"Row {row['row_number']}: {error}")
        
        return {
            'success': False,
            'message': f"Validation failed: {validation_result['invalid_rows']} invalid rows",
            'imported': 0,
            'skipped': 0,
            'failed': validation_result['invalid_rows'],
            'category_breakdown': {},
            'errors': error_details[:50]  # Limit to first 50 errors
        }
    
    # Get field mappings
    mappings = get_column_mapping()
    asset_mapping = mappings['asset']
    sim_mapping = mappings['corporate_sim']
    
    # Import valid rows
    imported_count = 0
    failed_count = 0
    category_breakdown = {}
    errors = []
    
    try:
        for row in validation_result['rows']:
            if not row['is_valid']:
                continue
            
            try:
                category = row['category']
                row_data = row['data']
                row_num = row['row_number']
                
                # Route based on category
                if category == 'Corporate SIM':
                    # Import to corporate_sims table
                    success = import_corporate_sim_row(
                        row_data, sim_mapping, db, current_username, row_num
                    )
                else:
                    # Import to assets table
                    success = import_asset_row(
                        row_data, asset_mapping, category, db, current_username, row_num
                    )
                
                if success:
                    imported_count += 1
                    category_breakdown[category] = category_breakdown.get(category, 0) + 1
                else:
                    failed_count += 1
                    errors.append(f"Row {row_num}: Failed to import {category}")
            
            except Exception as e:
                failed_count += 1
                errors.append(f"Row {row_num}: {str(e)}")
                logger.error(f"Error importing row {row_num}: {e}", exc_info=True)
        
        # Commit all imports
        db.session.commit()
        
        message = f'Successfully imported {imported_count} items'
        if failed_count > 0:
            message += f', {failed_count} failed'
        
        return {
            'success': True,
            'message': message,
            'imported': imported_count,
            'skipped': 0,
            'failed': failed_count,
            'category_breakdown': category_breakdown,
            'errors': errors[:50]  # Limit to first 50 errors
        }
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Import transaction failed: {e}", exc_info=True)
        return {
            'success': False,
            'message': f'Import failed: {str(e)}',
            'imported': 0,
            'skipped': 0,
            'failed': validation_result['total_rows'],
            'category_breakdown': {},
            'errors': [str(e)]
        }


def import_asset_row(row_data, field_mapping, category, db, current_username, row_num):
    """
    Import single row to assets table using EXACT business format column mappings.
    
    Business format columns:
    - 'Asset NAME' → asset_name
    - 'Version' → version
    - 'Ram' → ram
    - 'Charger Serial Number' → charger_serial
    - 'Old User/ New' → old_user
    - 'Assigned Date' → date
    - 'Comment' → comments
    """
    from models import Asset, Employee
    from services.audit_service import AuditService
    
    # Map Excel columns to model fields using EXACT business format
    asset_data = {}
    for excel_col, db_field in field_mapping.items():
        if db_field and excel_col in row_data:
            value = row_data[excel_col]
            if value is not None and str(value).strip() != '':
                asset_data[db_field] = value
    
    # Required fields (using mapped names)
    asset_name = str(asset_data.get('asset_name', '')).strip()
    serial_number = str(asset_data.get('serial_number', '')).strip()
    
    if not asset_name or not serial_number:
        raise ValueError(f"Missing required fields: Asset NAME or SERIAL NUMBER")
    
    # Check for duplicate serial number
    existing = Asset.query.filter_by(serial_number=serial_number).first()
    if existing:
        raise ValueError(f"Serial number '{serial_number}' already exists (Asset ID: {existing.id})")
    
    # Parse dates
    invoice_date = parse_date_safe(asset_data.get('invoice_date'))
    warranty_date = parse_date_safe(asset_data.get('warranty_date'))
    assigned_date = parse_date_safe(asset_data.get('date'))  # 'Assigned Date' → 'date'
    
    # Handle employee assignment
    emp_id = str(asset_data.get('emp_id', '')).strip()
    emp_name = str(asset_data.get('employee_name', '')).strip()
    mobile_number = str(asset_data.get('mobile_number', '')).strip()
    
    # Validate employee if EMP ID provided
    if emp_id:
        employee = Employee.query.filter_by(emp_id=emp_id).first()
        if employee:
            emp_name = employee.employee_name
            mobile_number = employee.mobile_number or mobile_number
    
    # Determine status
    if emp_id or emp_name:
        status = 'Assigned'
    else:
        status = 'Available'
    
    # Get version field (business format: 'Version' → 'version')
    version = str(asset_data.get('version', '')).strip() or None
    
    # Get ram field (business format: 'Ram' → 'ram')
    ram = str(asset_data.get('ram', '')).strip() or None
    
    # Get charger serial (business format: 'Charger Serial Number' → 'charger_serial')
    charger_serial = str(asset_data.get('charger_serial', '')).strip() or None
    
    # Get old user info (business format: 'Old User/ New' → 'old_user')
    old_user = str(asset_data.get('old_user', '')).strip() or None
    
    # Create asset with EXACT mapped fields from business format
    asset = Asset(
        asset_name=asset_name,
        serial_number=serial_number,
        category=category,
        model_name=str(asset_data.get('model_name', '')).strip() or None,
        location=str(asset_data.get('location', '')).strip() or None,
        os=str(asset_data.get('os', '')).strip() or None,
        version=version,  # From 'Version' column
        ram=ram,  # From 'Ram' column
        charger_serial=charger_serial,  # From 'Charger Serial Number' column
        invoice_number=str(asset_data.get('invoice_number', '')).strip() or None,
        invoice_date=invoice_date,
        warranty_date=warranty_date,
        comments=str(asset_data.get('comments', '')).strip() or None,  # From 'Comment' column
        emp_id=emp_id or None,
        employee_name=emp_name or None,
        mobile_number=mobile_number or None,
        status=status,
        date=assigned_date or date.today()  # Use 'Assigned Date' if provided, otherwise today
    )
    
    db.session.add(asset)
    db.session.flush()
    
    # Create audit log
    AuditService.log(
        action_type='ASSET_IMPORTED',
        module='Asset',
        asset_id=asset.id,
        asset_name=asset.asset_name,
        asset_serial=asset.serial_number,
        category=asset.category,
        employee_id=emp_id if status == 'Assigned' else None,
        employee_name=emp_name if status == 'Assigned' else None,
        performed_by=current_username,
        remarks=f'Imported from unified Excel (Row {row_num})'
    )
    
    # Create lifecycle event if assigned
    if status == 'Assigned' and emp_id and emp_name:
        # Using api_lifecycle module for lifecycle tracking
        try:
            from api_lifecycle import record_asset_lifecycle_event
            record_asset_lifecycle_event(
                asset_id=asset.id,
                event_type='ASSIGNED',
                to_employee_id=emp_id,
                to_employee=emp_name,
                from_status='Available',
                to_status='Assigned',
                reason='Asset imported with assignment',
                performed_by=current_username,
                remarks=f'Imported from Excel - Initially assigned to {emp_name}'
            )
        except Exception as e:
            logger.warning(f"Failed to create lifecycle event: {e}")
    
    return True


def import_corporate_sim_row(row_data, field_mapping, db, current_username, row_num):
    """
    Import single row to corporate_sims table using EXACT business format.
    
    Business format for Corporate SIM:
    - MOBILE NUMBER: SIM's mobile number
    - Comment: Contains additional info like ICCID, Carrier, Plan details
    - Asset NAME: Optional descriptive name
    
    The Comment field is parsed to extract ICCID and Carrier if present.
    Format expected: "Plan description - ICCID: 8991101200003204510, Carrier: Airtel"
    """
    from models import CorporateSIM, Employee
    from services.audit_service import AuditService
    import re
    
    # Map Excel columns to model fields using EXACT business format
    sim_data = {}
    for excel_col, db_field in field_mapping.items():
        if db_field and excel_col in row_data:
            value = row_data[excel_col]
            if value is not None and str(value).strip() != '':
                sim_data[db_field] = value
    
    # Get mobile number (required for Corporate SIM)
    mobile_number = str(row_data.get('MOBILE NUMBER', '')).strip()
    
    # Get remarks/comments
    remarks = str(sim_data.get('remarks', '')).strip()
    
    # Extract ICCID and Carrier from Comment field if present
    # Format: "Corporate data plan... - ICCID: 8991101200003204510, Carrier: Airtel"
    iccid = None
    carrier = None
    
    if remarks:
        # Try to extract ICCID
        iccid_match = re.search(r'ICCID:\s*([0-9]{19,20})', remarks, re.IGNORECASE)
        if iccid_match:
            iccid = iccid_match.group(1).strip()
        
        # Try to extract Carrier
        carrier_match = re.search(r'Carrier:\s*([A-Za-z\s]+?)(?:,|$|\n)', remarks, re.IGNORECASE)
        if carrier_match:
            carrier = carrier_match.group(1).strip()
    
    # If ICCID not found in comments, try to use mobile number as fallback identifier
    # or generate a unique identifier
    if not iccid:
        if mobile_number:
            # Use mobile number as ICCID fallback
            iccid = f"MOBILE-{mobile_number}"
        else:
            # Generate a unique identifier using timestamp
            from time import time
            iccid = f"SIM-{int(time()*1000)}"
    
    # If carrier not found, use default or derive from Asset NAME
    if not carrier:
        asset_name = str(row_data.get('Asset NAME', '')).strip()
        if asset_name:
            # Try to extract carrier from asset name (e.g., "Airtel Corporate SIM")
            for known_carrier in ['Airtel', 'Jio', 'Vodafone', 'BSNL', 'Vi']:
                if known_carrier.lower() in asset_name.lower():
                    carrier = known_carrier
                    break
        
        # If still not found, use 'Unknown'
        if not carrier:
            carrier = 'Unknown'
    
    # Check for duplicate ICCID
    existing = CorporateSIM.query.filter_by(iccid=iccid).first()
    if existing:
        raise ValueError(f"ICCID '{iccid}' already exists (SIM ID: {existing.id})")
    
    # Parse dates
    purchase_date = parse_date_safe(row_data.get('INVOICE DATE'))
    assignment_date = parse_date_safe(row_data.get('Assigned Date'))
    
    # Get invoice number and include it in remarks if present
    invoice_number = str(row_data.get('INVOICE NUMBER', '')).strip()
    if invoice_number and remarks:
        remarks = f"Invoice: {invoice_number} | {remarks}"
    elif invoice_number:
        remarks = f"Invoice: {invoice_number}"
    
    # Handle employee assignment
    emp_id = str(row_data.get('EMP ID', '')).strip()
    emp_name = str(row_data.get('EMPLOYEE NAME', '')).strip()
    
    # Validate employee if EMP ID provided
    if emp_id:
        employee = Employee.query.filter_by(emp_id=emp_id).first()
        if employee:
            emp_name = employee.employee_name
    
    # Determine status
    if emp_id or emp_name:
        status = 'Assigned'
    else:
        status = 'Available'
    
    # Create Corporate SIM
    sim = CorporateSIM(
        iccid=iccid,
        mobile_number=mobile_number or None,
        carrier=carrier,
        plan_type='Corporate',  # Default to Corporate since imported via Corporate SIM category
        status=status,
        assigned_employee_id=emp_id or None,
        assigned_employee_name=emp_name or None,
        assignment_date=assignment_date,
        purchase_date=purchase_date,
        remarks=remarks or None,
        created_by=current_username
    )
    
    db.session.add(sim)
    db.session.flush()
    
    # Create audit log
    AuditService.log(
        action_type='CORPORATE_SIM_IMPORTED',
        module='Corporate SIM',
        asset_id=sim.id,
        asset_name=f"SIM {mobile_number or iccid}",
        asset_serial=iccid,
        category='Corporate SIM',
        employee_id=emp_id if status == 'Assigned' else None,
        employee_name=emp_name if status == 'Assigned' else None,
        performed_by=current_username,
        remarks=f'Imported from unified Excel (Row {row_num})'
    )
    
    return True
