# bulk_import_templates.py
# Category-specific Excel template generation and bulk import validation

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from datetime import date
from io import BytesIO

# ═══════════════════════════════════════════════════════════════════════════
# CATEGORY FIELD DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════

# Define which fields are required for each category
CATEGORY_FIELDS = {
    'Laptop': [
        'sl_no', 'emp_id', 'employee_name', 'mobile_number', 'asset_name',
        'category', 'serial_number', 'model_name', 'os', 'version', 'ram',
        'location', 'invoice_number', 'invoice_date', 'warranty_date',
        'charger_serial', 'comments'
    ],
    'Desktop': [
        'sl_no', 'emp_id', 'employee_name', 'mobile_number', 'asset_name',
        'category', 'serial_number', 'model_name', 'os', 'version', 'ram',
        'location', 'invoice_number', 'invoice_date', 'warranty_date',
        'comments'
    ],
    'Monitor': [
        'sl_no', 'emp_id', 'employee_name', 'mobile_number', 'asset_name',
        'category', 'serial_number', 'model_name', 'location',
        'invoice_number', 'invoice_date', 'warranty_date', 'comments'
    ],
    'Desktop': [
        'sl_no', 'emp_id', 'employee_name', 'mobile_number', 'asset_name',
        'category', 'serial_number', 'model_name', 'processor', 'ram',
        'storage_type', 'storage_capacity', 'location',
        'invoice_number', 'invoice_date', 'warranty_date', 'comments'
    ],
    'Mouse': [
        'sl_no', 'emp_id', 'employee_name', 'mobile_number', 'asset_name',
        'category', 'serial_number', 'model_name', 'location',
        'invoice_number', 'invoice_date', 'warranty_date', 'comments'
    ],
    'Headphones': [
        'sl_no', 'emp_id', 'employee_name', 'mobile_number', 'asset_name',
        'category', 'serial_number', 'model_name', 'location',
        'invoice_number', 'invoice_date', 'warranty_date', 'comments'
    ],
    'Printer': [
        'sl_no', 'emp_id', 'employee_name', 'mobile_number', 'asset_name',
        'category', 'serial_number', 'model_name', 'printer_type',
        'location', 'invoice_number', 'invoice_date', 'warranty_date',
        'comments'
    ],
    'Phone': [
        'sl_no', 'emp_id', 'employee_name', 'mobile_number', 'asset_name',
        'category', 'serial_number', 'model_name', 'imei_1', 'imei_2',
        'mobile_number_sim', 'location', 'invoice_number', 'invoice_date',
        'warranty_date', 'comments'
    ],
    'Server': [
        'sl_no', 'emp_id', 'employee_name', 'mobile_number', 'asset_name',
        'category', 'serial_number', 'model_name', 'processor', 'ram',
        'storage_capacity', 'ip_address', 'rack_location', 'location',
        'invoice_number', 'invoice_date', 'warranty_date', 'comments'
    ],
    'Hard Disk': [
        'sl_no', 'emp_id', 'employee_name', 'mobile_number', 'asset_name',
        'category', 'serial_number', 'model_name', 'storage_capacity',
        'interface_type', 'location', 'invoice_number', 'invoice_date',
        'warranty_date', 'comments'
    ],
    'Corporate SIM': [
        'sl_no', 'iccid', 'mobile_number', 'carrier', 'plan_type',
        'sim_type', 'data_limit_gb', 'monthly_cost', 'corporate_account',
        'account_manager', 'purchase_date', 'activation_date', 'vendor',
        'assigned_employee_id', 'assigned_employee_name', 'remarks'
    ],
}

# Field display names
FIELD_LABELS = {
    'sl_no': 'Sl No.',
    'emp_id': 'EMP ID',
    'employee_name': 'EMPLOYEE NAME',
    'mobile_number': 'MOBILE NUMBER',
    'asset_name': 'ASSET NAME',
    'category': 'CATEGORY',
    'serial_number': 'SERIAL NUMBER',
    'model_name': 'MODEL NAME',
    'os': 'OS',
    'version': 'VERSION',
    'ram': 'RAM',
    'location': 'LOCATION',
    'invoice_number': 'INVOICE NUMBER',
    'invoice_date': 'INVOICE DATE',
    'warranty_date': 'WARRANTY DATE',
    'charger_serial': 'CHARGER SERIAL NUMBER',
    'comments': 'COMMENTS',
    'processor': 'PROCESSOR',
    'storage_type': 'STORAGE TYPE',
    'storage_capacity': 'STORAGE CAPACITY',
    'printer_type': 'PRINTER TYPE',
    'imei_1': 'IMEI 1',
    'imei_2': 'IMEI 2',
    'mobile_number_sim': 'SIM NUMBER',
    'ip_address': 'IP ADDRESS',
    'rack_location': 'RACK LOCATION',
    'interface_type': 'INTERFACE TYPE',
    'capacity_va': 'CAPACITY (VA)',
    'backup_time': 'BACKUP TIME',
    # Corporate SIM specific
    'iccid': 'ICCID',
    'carrier': 'CARRIER',
    'plan_type': 'PLAN TYPE',
    'sim_type': 'SIM TYPE',
    'data_limit_gb': 'DATA LIMIT (GB)',
    'monthly_cost': 'MONTHLY COST',
    'corporate_account': 'CORPORATE ACCOUNT',
    'account_manager': 'ACCOUNT MANAGER',
    'activation_date': 'ACTIVATION DATE',
    'vendor': 'VENDOR',
    'assigned_employee_id': 'ASSIGNED EMPLOYEE ID',
    'assigned_employee_name': 'ASSIGNED EMPLOYEE NAME',
    'remarks': 'REMARKS',
}

# Example data for each category
EXAMPLE_DATA = {
    'Laptop': {
        'emp_id': 'EMP001',
        'employee_name': 'John Doe',
        'mobile_number': '9876543210',
        'asset_name': 'Dell Laptop XPS 15',
        'category': 'Laptop',
        'serial_number': 'SN-LAP-001',
        'model_name': 'XPS 15 9500',
        'os': 'Windows 11',
        'version': '23H2',
        'ram': '16GB',
        'location': 'Bangalore Office',
        'invoice_number': 'INV-2024-001',
        'invoice_date': '2024-01-15',
        'warranty_date': '2027-01-15',
        'charger_serial': 'CHG-001',
        'comments': 'New laptop'
    },
    'Monitor': {
        'emp_id': 'EMP002',
        'employee_name': 'Jane Smith',
        'mobile_number': '9876543211',
        'asset_name': 'Dell Monitor 27"',
        'category': 'Monitor',
        'serial_number': 'SN-MON-001',
        'model_name': 'P2722H',
        'location': 'Mumbai Office',
        'invoice_number': 'INV-2024-002',
        'invoice_date': '2024-02-01',
        'warranty_date': '2027-02-01',
        'comments': 'Full HD Monitor'
    },
    'Mouse': {
        'emp_id': 'EMP003',
        'employee_name': 'Bob Williams',
        'mobile_number': '9876543212',
        'asset_name': 'Logitech Mouse',
        'category': 'Mouse',
        'serial_number': 'SN-MOU-001',
        'model_name': 'M185',
        'location': 'Delhi Office',
        'invoice_number': 'INV-2024-003',
        'invoice_date': '2024-03-01',
        'warranty_date': '2025-03-01',
        'comments': 'Wireless mouse'
    },
    'Corporate SIM': {
        'iccid': '8991101200003204510',
        'mobile_number': '9876543210',
        'carrier': 'Airtel',
        'plan_type': 'Postpaid',
        'sim_type': 'Nano',
        'data_limit_gb': '100',
        'monthly_cost': '599',
        'corporate_account': 'CORP-ACC-001',
        'account_manager': 'John Manager',
        'purchase_date': '2024-01-15',
        'activation_date': '2024-01-20',
        'vendor': 'Airtel Business',
        'assigned_employee_id': 'EMP001',
        'assigned_employee_name': 'Jane Doe',
        'remarks': 'Corporate data plan'
    },
}


# ═══════════════════════════════════════════════════════════════════════════
# TEMPLATE GENERATION
# ═══════════════════════════════════════════════════════════════════════════

def generate_category_template(category):
    """
    Generate category-specific Excel template
    
    Args:
        category (str): Asset category (Laptop, Monitor, Mouse, etc.)
    
    Returns:
        BytesIO: Excel file in memory
    """
    if category not in CATEGORY_FIELDS:
        raise ValueError(f"Unknown category: {category}")
    
    # Create workbook
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = f"{category} Import"
    
    # Get fields for this category
    fields = CATEGORY_FIELDS[category]
    
    # Style definitions
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=11)
    header_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    border = Border(
        left=Side(style='thin', color="D0D0D0"),
        right=Side(style='thin', color="D0D0D0"),
        top=Side(style='thin', color="D0D0D0"),
        bottom=Side(style='thin', color="D0D0D0")
    )
    
    # Write headers
    for idx, field in enumerate(fields, start=1):
        cell = ws.cell(row=1, column=idx)
        cell.value = FIELD_LABELS.get(field, field.upper())
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = header_alignment
        cell.border = border
        
        # Set column width
        ws.column_dimensions[get_column_letter(idx)].width = 18
    
    # Add example row if available
    example = EXAMPLE_DATA.get(category, {})
    if example:
        ws.cell(row=2, column=1, value=1)  # Sl No
        for idx, field in enumerate(fields, start=1):
            if field == 'sl_no':
                continue
            if field == 'category':
                # Pre-fill category
                ws.cell(row=2, column=idx, value=category)
            elif field in example:
                ws.cell(row=2, column=idx, value=example[field])
            
            # Add border to example row
            ws.cell(row=2, column=idx).border = border
    
    # Freeze header row
    ws.freeze_panes = "A2"
    
    # Save to BytesIO
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    return output


def get_available_categories():
    """Get list of all available categories"""
    return sorted(CATEGORY_FIELDS.keys())


# ═══════════════════════════════════════════════════════════════════════════
# IMPORT VALIDATION
# ═══════════════════════════════════════════════════════════════════════════

def validate_import_file(file_path, category):
    """
    Validate uploaded Excel file for category-specific import
    
    Args:
        file_path (str): Path to uploaded file
        category (str): Expected category
    
    Returns:
        dict: Validation result with {success, errors, warnings, data}
    """
    if category not in CATEGORY_FIELDS:
        return {
            'success': False,
            'errors': [f"Unknown category: {category}"],
            'warnings': [],
            'data': []
        }
    
    try:
        wb = openpyxl.load_workbook(file_path, data_only=True)
        ws = wb.active
        
        errors = []
        warnings = []
        data = []
        
        # Get expected fields
        expected_fields = CATEGORY_FIELDS[category]
        
        # Read headers (row 1)
        headers = []
        for col in range(1, ws.max_column + 1):
            cell_value = ws.cell(row=1, column=col).value
            if cell_value:
                # Normalize header
                header = str(cell_value).strip().lower().replace(' ', '_').replace('.', '')
                headers.append(header)
            else:
                headers.append(None)
        
        # Validate headers
        missing_headers = []
        for field in expected_fields:
            # Normalize field name for comparison
            field_normalized = field.lower().replace('_', '')
            header_normalized = [h.replace('_', '') if h else '' for h in headers]
            
            if field_normalized not in header_normalized:
                missing_headers.append(FIELD_LABELS.get(field, field))
        
        if missing_headers:
            errors.append(f"Missing required columns: {', '.join(missing_headers)}")
            return {'success': False, 'errors': errors, 'warnings': warnings, 'data': []}
        
        # Read data rows (starting from row 2)
        for row_idx in range(2, ws.max_row + 1):
            row_data = {}
            row_errors = []
            
            # Check if row is empty
            is_empty = all(ws.cell(row=row_idx, column=col).value is None 
                          for col in range(1, len(headers) + 1))
            if is_empty:
                continue
            
            for col_idx, header in enumerate(headers, start=1):
                if header:
                    cell_value = ws.cell(row=row_idx, column=col_idx).value
                    row_data[header] = cell_value
            
            # Validate category match
            file_category = row_data.get('category', '').strip()
            if file_category and file_category != category:
                row_errors.append(f"Category mismatch: Expected '{category}', found '{file_category}'")
            
            # Validate required fields
            if not row_data.get('serial_number'):
                row_errors.append("Serial Number is required")
            
            if not row_data.get('asset_name'):
                row_errors.append("Asset Name is required")
            
            if row_errors:
                errors.append(f"Row {row_idx}: {'; '.join(row_errors)}")
            else:
                # Add category if not present
                if 'category' not in row_data or not row_data['category']:
                    row_data['category'] = category
                data.append(row_data)
        
        return {
            'success': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'data': data
        }
        
    except Exception as e:
        return {
            'success': False,
            'errors': [f"Failed to read file: {str(e)}"],
            'warnings': [],
            'data': []
        }
