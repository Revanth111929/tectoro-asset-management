# unified_import_processor.py
# Process unified Excel imports with mixed categories
# Routes rows to assets or corporate_sims tables based on CATEGORY

import openpyxl
from datetime import datetime, date
from collections import defaultdict
from datetime_utils import today_ist
from unified_import_template import get_column_mapping, VALID_CATEGORIES, CATEGORY_REQUIRED_FIELDS
from employee_alias_support import EmployeeAliasService
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


def validate_and_parse_excel(file_stream, db=None):
    """
    Parse and validate uploaded Excel file using EXACT business format.
    Returns preview data with row-by-row validation INCLUDING database checks.

    Args:
        file_stream: File stream from Flask request.files (FileStorage object or BytesIO)
        db: SQLAlchemy database instance for validation (optional, recommended)

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

        if 'ASSET NAME' not in column_map:
            return {
                'success': False,
                'errors': ['Missing required "ASSET NAME" column. Please use the correct template.'],
                'total_rows': 0,
                'valid_rows': 0,
                'invalid_rows': 0,
                'category_counts': {},
                'rows': [],
                'warnings': []
            }

        category_idx = column_map['CATEGORY']

        # Build database caches for validation (if db provided)
        existing_employees = set()
        existing_serials = set()
        existing_iccids = set()

        if db:
            try:
                from models import Employee, Asset, CorporateSIM
                # Cache all employee IDs
                for emp in Employee.query.with_entities(Employee.emp_id).all():
                    if emp.emp_id:
                        existing_employees.add(emp.emp_id.strip())

                # Cache all existing serial numbers
                for asset in Asset.query.with_entities(Asset.serial_number).all():
                    if asset.serial_number:
                        existing_serials.add(asset.serial_number.strip())

                # Cache all existing ICCIDs
                for sim in CorporateSIM.query.with_entities(CorporateSIM.iccid).all():
                    if sim.iccid:
                        existing_iccids.add(sim.iccid.strip())
            except Exception as e:
                logger.warning(f"Could not load database caches for validation: {e}")

        # PHASE 1: Collect and normalize all rows
        raw_rows = []
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

            raw_rows.append({
                'row_number': row_num,
                'data': row_data
            })

        # PHASE 2: Group by serial+emp_id to detect duplicate assignments
        serial_assignments = defaultdict(list)  # serial -> list of (row_num, emp_id, emp_name)
        sim_assignments = defaultdict(list)  # mobile -> list of (row_num, emp_id, emp_name)

        for raw_row in raw_rows:
            row_data = raw_row['data']
            row_num = raw_row['row_number']
            category = str(row_data.get('CATEGORY', '')).strip()

            if category and category != 'Corporate SIM':
                serial = str(row_data.get('SERIAL NUMBER', '')).strip()
                emp_id = str(row_data.get('EMP ID', '')).strip()
                emp_name = str(row_data.get('EMPLOYEE NAME', '')).strip()

                if serial:
                    serial_assignments[serial].append({
                        'row': row_num,
                        'emp_id': emp_id,
                        'emp_name': emp_name,
                        'data': row_data
                    })
            elif category == 'Corporate SIM':
                mobile = str(row_data.get('MOBILE NUMBER', '')).strip()
                emp_id = str(row_data.get('EMP ID', '')).strip()
                emp_name = str(row_data.get('EMPLOYEE NAME', '')).strip()

                if mobile:
                    sim_assignments[mobile].append({
                        'row': row_num,
                        'emp_id': emp_id,
                        'emp_name': emp_name,
                        'data': row_data
                    })

        # PHASE 3: Detect conflicts and duplicates
        serial_conflicts = {}  # serial -> list of conflicting emp_ids
        legitimate_duplicates = {}  # serial -> list of duplicate rows (same emp_id)

        for serial, assignments in serial_assignments.items():
            if len(assignments) > 1:
                # Multiple rows with same serial - check if same employee
                emp_ids = set([a['emp_id'] for a in assignments if a['emp_id']])

                if len(emp_ids) > 1:
                    # CONFLICT: Same serial assigned to different employees
                    serial_conflicts[serial] = {
                        'emp_ids': list(emp_ids),
                        'rows': [a['row'] for a in assignments],
                        'details': assignments
                    }
                elif len(emp_ids) == 1:
                    # LEGITIMATE: Same serial, same employee (duplicate rows)
                    legitimate_duplicates[serial] = {
                        'emp_id': list(emp_ids)[0],
                        'rows': [a['row'] for a in assignments],
                        'count': len(assignments)
                    }

        # Similar for SIMs
        sim_conflicts = {}
        legitimate_sim_duplicates = {}

        for mobile, assignments in sim_assignments.items():
            if len(assignments) > 1:
                emp_ids = set([a['emp_id'] for a in assignments if a['emp_id']])

                if len(emp_ids) > 1:
                    sim_conflicts[mobile] = {
                        'emp_ids': list(emp_ids),
                        'rows': [a['row'] for a in assignments]
                    }
                elif len(emp_ids) == 1:
                    legitimate_sim_duplicates[mobile] = {
                        'emp_id': list(emp_ids)[0],
                        'rows': [a['row'] for a in assignments],
                        'count': len(assignments)
                    }

        # PHASE 4: Validate each row with proper duplicate detection
        parsed_rows = []
        category_counts = {}
        valid_count = 0
        invalid_count = 0
        errors = []
        warnings = []

        # Track which rows are part of legitimate duplicates (don't error)
        legitimate_dup_rows = set()
        for dup in legitimate_duplicates.values():
            legitimate_dup_rows.update(dup['rows'])
        for dup in legitimate_sim_duplicates.values():
            legitimate_dup_rows.update(dup['rows'])

        for raw_row in raw_rows:
            row_num = raw_row['row_number']
            row_data = raw_row['data']

            # Validate row
            row_errors = []
            row_warnings = []

            # Check CATEGORY
            category = str(row_data.get('CATEGORY', '')).strip()
            if not category:
                row_errors.append('Missing CATEGORY')
            elif category not in VALID_CATEGORIES:
                row_errors.append(f'Invalid CATEGORY: "{category}"')
            else:
                # Count categories
                category_counts[category] = category_counts.get(category, 0) + 1

                # Check category-specific required fields
                required_fields = CATEGORY_REQUIRED_FIELDS.get(category, [])
                for field in required_fields:
                    if field == 'CATEGORY':
                        continue  # Already checked
                    if not row_data.get(field):
                        row_errors.append(f'Missing {field}')

                # Validate Employee ID if provided
                emp_id = str(row_data.get('EMP ID', '')).strip()
                if emp_id:
                    if db and existing_employees and emp_id not in existing_employees:
                        row_errors.append(f'Employee ID "{emp_id}" not found')

                # Check for serial conflicts (NOT legitimate duplicates)
                if category != 'Corporate SIM':
                    serial = str(row_data.get('SERIAL NUMBER', '')).strip()
                    if serial:
                        # Check if this serial is in conflicts (different employees)
                        if serial in serial_conflicts:
                            conflict = serial_conflicts[serial]
                            row_errors.append(f'Serial assigned to multiple employees: {", ".join(conflict["emp_ids"])}')

                        # Check against database
                        if db and serial in existing_serials:
                            # Check if the database assignment matches this row's employee
                            try:
                                from models import Asset
                                existing_asset = Asset.query.filter_by(serial_number=serial).first()
                                if existing_asset and existing_asset.emp_id and emp_id:
                                    if existing_asset.emp_id != emp_id:
                                        row_errors.append(f'Serial already assigned to {existing_asset.emp_id}')
                                elif existing_asset:
                                    row_errors.append(f'Serial already exists')
                            except:
                                row_errors.append(f'Serial already exists')
                else:
                    # Corporate SIM - check mobile conflicts
                    mobile = str(row_data.get('MOBILE NUMBER', '')).strip()
                    if mobile:
                        if mobile in sim_conflicts:
                            conflict = sim_conflicts[mobile]
                            row_errors.append(f'Mobile assigned to multiple employees: {", ".join(conflict["emp_ids"])}')

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

        # Add summary warnings about legitimate duplicates
        if legitimate_duplicates:
            warnings.append(f'{len(legitimate_duplicates)} serials have duplicate rows (will be merged)')
        if legitimate_sim_duplicates:
            warnings.append(f'{len(legitimate_sim_duplicates)} SIM mobiles have duplicate rows (will be merged)')

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
    Import assets from unified Excel file with PARTIAL-SUCCESS support.
    Routes each row to correct table based on CATEGORY.

    PARTIAL-SUCCESS BEHAVIOR:
    - Validates all rows first
    - Separates valid rows from invalid rows
    - Imports ONLY valid rows (no rollback if some rows fail)
    - Returns error rows with original Excel row numbers for download

    Args:
        file_stream: File stream from Flask request.files (FileStorage object or BytesIO)
        db: SQLAlchemy database instance
        current_username: Username of person performing import

    Returns:
        dict: {
            'success': bool,  # True if at least 1 row imported successfully
            'message': str,
            'imported': int,  # Count of successfully imported rows
            'skipped': int,   # Count of rows skipped due to validation errors
            'failed': int,    # Count of rows that failed during import
            'category_breakdown': dict,
            'errors': list of error messages (for backward compatibility),
            'error_rows': list of dicts with full error row details for download
        }
    """
    from models import Asset, CorporateSIM, Employee, AuditLog
    from services.audit_service import AuditService
    from io import BytesIO

    # Convert file stream to BytesIO if needed
    if hasattr(file_stream, 'read'):
        file_content = file_stream.read()
        file_stream = BytesIO(file_content)

    # First validate and parse WITH database checks
    validation_result = validate_and_parse_excel(file_stream, db=db)

    if not validation_result['success']:
        return {
            'success': False,
            'message': 'Validation failed',
            'imported': 0,
            'skipped': 0,
            'failed': 0,
            'category_breakdown': {},
            'errors': validation_result['errors'],
            'error_rows': []
        }

    # Get field mappings
    mappings = get_column_mapping()
    asset_mapping = mappings['asset']
    sim_mapping = mappings['corporate_sim']

    # PARTIAL-SUCCESS: Separate valid and invalid rows
    valid_rows = [row for row in validation_result['rows'] if row['is_valid']]
    invalid_rows = [row for row in validation_result['rows'] if not row['is_valid']]

    # Prepare error rows for download (from validation phase)
    error_rows = []
    for row in invalid_rows:
        error_row = {
            'row_number': row['row_number'],
            'category': row.get('category', ''),
            'serial_number': str(row['data'].get('SERIAL NUMBER', '')).strip(),
            'emp_id': str(row['data'].get('EMP ID', '')).strip(),
            'employee_name': str(row['data'].get('EMPLOYEE NAME', '')).strip(),
            'asset_name': str(row['data'].get('ASSET NAME', '')).strip(),
            'mobile_number': str(row['data'].get('MOBILE NUMBER', '')).strip(),
            'errors': '; '.join(row['errors'])
        }
        error_rows.append(error_row)

    # Import valid rows ONLY
    imported_count = 0
    failed_during_import = 0
    category_breakdown = {}
    errors = []

    try:
        for row in valid_rows:
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
                    failed_during_import += 1
                    error_msg = "Failed to import"
                    errors.append(f"Row {row_num}: {error_msg}")
                    error_rows.append({
                        'row_number': row_num,
                        'category': category,
                        'serial_number': str(row_data.get('SERIAL NUMBER', '')).strip(),
                        'emp_id': str(row_data.get('EMP ID', '')).strip(),
                        'employee_name': str(row_data.get('EMPLOYEE NAME', '')).strip(),
                        'asset_name': str(row_data.get('ASSET NAME', '')).strip(),
                        'mobile_number': str(row_data.get('MOBILE NUMBER', '')).strip(),
                        'errors': error_msg
                    })

            except ValueError as e:
                # Business validation errors (duplicate serial, etc.)
                failed_during_import += 1
                error_msg = str(e)
                errors.append(f"Row {row_num}: {error_msg}")
                logger.warning(f"Row {row_num} validation failed: {e}")

                # Add to error rows for download
                error_rows.append({
                    'row_number': row_num,
                    'category': row.get('category', ''),
                    'serial_number': str(row_data.get('SERIAL NUMBER', '')).strip(),
                    'emp_id': str(row_data.get('EMP ID', '')).strip(),
                    'employee_name': str(row_data.get('EMPLOYEE NAME', '')).strip(),
                    'asset_name': str(row_data.get('ASSET NAME', '')).strip(),
                    'mobile_number': str(row_data.get('MOBILE NUMBER', '')).strip(),
                    'errors': error_msg
                })
                # CONTINUE to next row (don't rollback)

            except Exception as e:
                # Unexpected errors including FK constraints
                failed_during_import += 1
                # Extract user-friendly error message
                error_msg = str(e)
                if 'FOREIGN KEY constraint failed' in error_msg:
                    error_msg = 'Employee ID not found in database'
                elif 'UNIQUE constraint failed' in error_msg:
                    if 'serial_number' in error_msg:
                        error_msg = 'Serial number already exists'
                    elif 'iccid' in error_msg:
                        error_msg = 'ICCID already exists'
                    else:
                        error_msg = 'Duplicate value constraint violated'
                else:
                    # Keep first 100 chars of error
                    error_msg = error_msg[:100]

                errors.append(f"Row {row_num}: {error_msg}")
                logger.error(f"Error importing row {row_num}: {e}", exc_info=True)

                # Add to error rows for download
                error_rows.append({
                    'row_number': row_num,
                    'category': row.get('category', ''),
                    'serial_number': str(row_data.get('SERIAL NUMBER', '')).strip(),
                    'emp_id': str(row_data.get('EMP ID', '')).strip(),
                    'employee_name': str(row_data.get('EMPLOYEE NAME', '')).strip(),
                    'asset_name': str(row_data.get('ASSET NAME', '')).strip(),
                    'mobile_number': str(row_data.get('MOBILE NUMBER', '')).strip(),
                    'errors': error_msg
                })
                # CONTINUE to next row (don't rollback valid imports)

        # PARTIAL-SUCCESS: Commit whatever succeeded
        if imported_count > 0:
            db.session.commit()

            total_errors = len(invalid_rows) + failed_during_import

            if total_errors == 0:
                message = f'Successfully imported {imported_count} items'
            else:
                message = f'{imported_count} rows uploaded successfully. {total_errors} rows skipped due to errors'

            return {
                'success': True,
                'message': message,
                'imported': imported_count,
                'skipped': len(invalid_rows),  # Validation errors
                'failed': failed_during_import,  # Import errors
                'category_breakdown': category_breakdown,
                'errors': errors,
                'error_rows': error_rows  # Full error row data for download
            }
        else:
            # Nothing imported - all rows had errors
            db.session.rollback()
            total_errors = len(invalid_rows) + failed_during_import
            return {
                'success': False,
                'message': f'Import failed: All {total_errors} rows had errors',
                'imported': 0,
                'skipped': len(invalid_rows),
                'failed': failed_during_import,
                'category_breakdown': {},
                'errors': errors[:50],
                'error_rows': error_rows
            }

    except Exception as e:
        db.session.rollback()
        logger.error(f"Import transaction failed: {e}", exc_info=True)
        error_msg = str(e)
        if 'FOREIGN KEY constraint failed' in error_msg:
            error_msg = 'Employee ID validation failed - database constraint error'
        return {
            'success': False,
            'message': f'Import failed: {error_msg[:100]}',
            'imported': 0,
            'skipped': len(invalid_rows),
            'failed': len(valid_rows),
            'category_breakdown': {},
            'errors': [error_msg[:200]],
            'error_rows': error_rows
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

    # Validate employee if EMP ID provided - CRITICAL FK CHECK + ALIAS SUPPORT
    if emp_id:
        # Use alias service for validation (supports shared IDs)
        is_valid, error_msg, normalized_name = EmployeeAliasService.validate_employee_for_asset(
            db, emp_id, emp_name
        )

        if not is_valid:
            raise ValueError(error_msg)

        # For assets, use the SPECIFIC employee_name provided (denormalized storage)
        # This allows TT → Server Room, TT → Fiddler to show different names per asset
        if emp_name:
            emp_name = normalized_name or emp_name
        else:
            # If no name provided in Excel, use employee's primary name
            from models import Employee
            employee = Employee.query.filter_by(emp_id=emp_id).first()
            emp_name = employee.employee_name if employee else ''

        # Get mobile number from employee if not provided
        if not mobile_number:
            from models import Employee
            employee = Employee.query.filter_by(emp_id=emp_id).first()
            mobile_number = employee.mobile_number if employee else ''

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
        date=assigned_date or today_ist()  # Use 'Assigned Date' if provided, otherwise today
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
        # Use existing LifecycleService for lifecycle tracking
        try:
            from services.audit_service import LifecycleService
            LifecycleService.record_event(
                asset_id=asset.id,
                event_type='ASSIGNED',
                from_status='Available',
                to_status='Assigned',
                to_employee_id=emp_id,
                to_employee_name=emp_name,
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

    # Validate employee if EMP ID provided - CRITICAL FK CHECK
    if emp_id:
        employee = Employee.query.filter_by(emp_id=emp_id).first()
        if not employee:
            raise ValueError(f'Employee ID "{emp_id}" not found')
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
