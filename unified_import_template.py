# unified_import_template.py
# Unified Excel template generation for ALL asset categories
# Single template, CATEGORY column routes to correct destination

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from io import BytesIO

# ═══════════════════════════════════════════════════════════════════════════
# UNIFIED FIELD DEFINITIONS
# Union of all fields from assets table and corporate_sims table
# ═══════════════════════════════════════════════════════════════════════════

# EXACT business format - columns as required
UNIFIED_COLUMNS = [
    'SI No.',                    # Row number (for reference only, not stored)
    'EMP ID',                    # Employee ID
    'EMPLOYEE NAME',             # Employee name
    'MOBILE NUMBER',             # Employee mobile number
    'ASSET NAME',                # Asset name (required for assets)
    'CATEGORY',                  # Category - routes to correct inventory
    'SERIAL NUMBER',             # Serial number (required for assets)
    'MODEL NAME',                # Model name
    'OS',                        # Operating system
    'VERSION',                   # OS/software version
    'RAM',                       # RAM
    'CLIENT',                    # Client/project location
    'INVOICE NUMBER',            # Invoice number
    'INVOICE DATE',              # Invoice/purchase date
    'WARRANTY DATE',             # Warranty expiry date
    'CHARGER SERIAL NUMBER',     # Charger serial (for laptops)
    'ASSIGNED ON',               # Assignment date
    'WARRANTY STATUS',           # Warranty status
]

# Valid categories
VALID_CATEGORIES = [
    'Laptop',
    'Desktop',
    'Monitor',
    'Printer',
    'Phone',
    'Server',
    'Mouse',
    'Headphones',
    'Hard Disk',
    'Corporate SIM',
]

# Category-specific required fields (using exact column names)
CATEGORY_REQUIRED_FIELDS = {
    'Laptop': ['CATEGORY', 'ASSET NAME', 'SERIAL NUMBER'],
    'Desktop': ['CATEGORY', 'ASSET NAME', 'SERIAL NUMBER'],
    'Monitor': ['CATEGORY', 'ASSET NAME', 'SERIAL NUMBER'],
    'Printer': ['CATEGORY', 'ASSET NAME', 'SERIAL NUMBER'],
    'Phone': ['CATEGORY', 'ASSET NAME', 'SERIAL NUMBER'],
    'Server': ['CATEGORY', 'ASSET NAME', 'SERIAL NUMBER'],
    'Mouse': ['CATEGORY', 'ASSET NAME', 'SERIAL NUMBER'],
    'Headphones': ['CATEGORY', 'ASSET NAME', 'SERIAL NUMBER'],
    'Hard Disk': ['CATEGORY', 'ASSET NAME', 'SERIAL NUMBER'],
    'Corporate SIM': ['CATEGORY', 'ASSET NAME'],  # Corporate SIM doesn't use SERIAL NUMBER
}

# Category-specific important fields (used but not required)
CATEGORY_IMPORTANT_FIELDS = {
    'Laptop': ['MODEL NAME', 'OS', 'RAM', 'CHARGER SERIAL NUMBER', 'EMP ID', 'EMPLOYEE NAME'],
    'Desktop': ['MODEL NAME', 'OS', 'RAM', 'EMP ID', 'EMPLOYEE NAME'],
    'Monitor': ['MODEL NAME', 'CLIENT', 'EMP ID', 'EMPLOYEE NAME'],
    'Printer': ['MODEL NAME', 'CLIENT'],
    'Phone': ['MODEL NAME', 'EMP ID', 'EMPLOYEE NAME'],
    'Server': ['MODEL NAME', 'CLIENT'],
    'Mouse': ['MODEL NAME', 'EMP ID', 'EMPLOYEE NAME'],
    'Headphones': ['MODEL NAME', 'EMP ID', 'EMPLOYEE NAME'],
    'Hard Disk': ['MODEL NAME'],
    'Corporate SIM': ['MOBILE NUMBER', 'EMP ID', 'EMPLOYEE NAME'],
}

# Example data rows (show different categories in same template)
EXAMPLE_ROWS = [
    {
        'SI No.': '1',
        'EMP ID': 'TT919',
        'EMPLOYEE NAME': 'Ajay Budidha',
        'MOBILE NUMBER': '9876543210',
        'ASSET NAME': 'Dell Latitude 5430',
        'CATEGORY': 'Laptop',
        'SERIAL NUMBER': 'LAP-SN-12345',
        'MODEL NAME': 'Latitude 5430',
        'OS': 'Windows 11',
        'VERSION': '23H2',
        'RAM': '16GB',
        'CLIENT': 'Bangalore Office',
        'INVOICE NUMBER': 'INV-2024-001',
        'INVOICE DATE': '2024-01-15',
        'WARRANTY DATE': '2027-01-15',
        'CHARGER SERIAL NUMBER': 'CHG-12345',
        'ASSIGNED ON': '2024-01-15',
        'WARRANTY STATUS': 'Active',
    },
    {
        'SI No.': '2',
        'EMP ID': 'TT925',
        'EMPLOYEE NAME': 'Ruthwik',
        'MOBILE NUMBER': '',
        'ASSET NAME': 'HP EliteDesk 800 G8',
        'CATEGORY': 'Desktop',
        'SERIAL NUMBER': 'DESK-SN-67890',
        'MODEL NAME': 'EliteDesk 800 G8',
        'OS': 'Windows 11',
        'VERSION': '',
        'RAM': '32GB',
        'CLIENT': 'Mumbai Office',
        'INVOICE NUMBER': 'INV-2024-002',
        'INVOICE DATE': '2024-02-01',
        'WARRANTY DATE': '2027-02-01',
        'CHARGER SERIAL NUMBER': '',
        'ASSIGNED ON': '2024-02-01',
        'WARRANTY STATUS': 'Active',
    },
    {
        'SI No.': '3',
        'EMP ID': '',
        'EMPLOYEE NAME': '',
        'MOBILE NUMBER': '',
        'ASSET NAME': 'Dell P2722H Monitor',
        'CATEGORY': 'Monitor',
        'SERIAL NUMBER': 'MON-SN-11111',
        'MODEL NAME': 'P2722H',
        'OS': '',
        'VERSION': '',
        'RAM': '',
        'CLIENT': 'Bangalore Office',
        'INVOICE NUMBER': 'INV-2024-003',
        'INVOICE DATE': '2024-03-01',
        'WARRANTY DATE': '2027-03-01',
        'CHARGER SERIAL NUMBER': '',
        'ASSIGNED ON': '',
        'WARRANTY STATUS': 'Active',
    },
    {
        'SI No.': '4',
        'EMP ID': 'TT926',
        'EMPLOYEE NAME': 'Balaji',
        'MOBILE NUMBER': '9876543211',
        'ASSET NAME': 'Logitech MX Master 3',
        'CATEGORY': 'Mouse',
        'SERIAL NUMBER': 'MOU-SN-22222',
        'MODEL NAME': 'MX Master 3',
        'OS': '',
        'VERSION': '',
        'RAM': '',
        'CLIENT': 'Mumbai Office',
        'INVOICE NUMBER': 'INV-2024-004',
        'INVOICE DATE': '2024-03-15',
        'WARRANTY DATE': '2025-03-15',
        'CHARGER SERIAL NUMBER': '',
        'ASSIGNED ON': '2024-03-15',
        'WARRANTY STATUS': 'Expired',
    },
    {
        'SI No.': '5',
        'EMP ID': 'TT927',
        'EMPLOYEE NAME': 'Suresh',
        'MOBILE NUMBER': '9876543212',
        'ASSET NAME': 'Airtel Corporate SIM',
        'CATEGORY': 'Corporate SIM',
        'SERIAL NUMBER': '',  # Corporate SIM doesn't use this
        'MODEL NAME': '',
        'OS': '',
        'VERSION': '',
        'RAM': '',
        'CLIENT': '',
        'INVOICE NUMBER': 'INV-2024-005',
        'INVOICE DATE': '2024-01-20',
        'WARRANTY DATE': '',
        'CHARGER SERIAL NUMBER': '',
        'ASSIGNED ON': '2024-01-25',
        'WARRANTY STATUS': '',
    },
]


def generate_unified_template():
    """
    Generate single unified Excel template for ALL asset categories.
    Uses EXACT business format with 19 columns.
    CATEGORY column determines where each row goes.

    Returns:
        BytesIO: Excel file in memory
    """
    # Create workbook
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Asset Import"

    # Style definitions
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=11)
    header_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    required_fill = PatternFill(start_color="FFC000", end_color="FFC000", fill_type="solid")
    required_font = Font(bold=True, color="000000", size=11)

    border = Border(
        left=Side(style='thin', color="D0D0D0"),
        right=Side(style='thin', color="D0D0D0"),
        top=Side(style='thin', color="D0D0D0"),
        bottom=Side(style='thin', color="D0D0D0")
    )

    # Write headers - EXACT business format
    for idx, column_name in enumerate(UNIFIED_COLUMNS, start=1):
        cell = ws.cell(row=1, column=idx)
        cell.value = column_name

        # Highlight critical required fields
        if column_name in ['CATEGORY', 'ASSET NAME', 'SERIAL NUMBER']:
            cell.fill = required_fill
            cell.font = required_font
        else:
            cell.fill = header_fill
            cell.font = header_font

        cell.alignment = header_alignment
        cell.border = border

        # Set column width
        if column_name in ['ASSET NAME', 'EMPLOYEE NAME']:
            ws.column_dimensions[get_column_letter(idx)].width = 30
        elif column_name in ['SERIAL NUMBER', 'MODEL NAME', 'INVOICE NUMBER']:
            ws.column_dimensions[get_column_letter(idx)].width = 20
        elif column_name == 'CATEGORY':
            ws.column_dimensions[get_column_letter(idx)].width = 15
        elif column_name == 'CHARGER SERIAL NUMBER':
            ws.column_dimensions[get_column_letter(idx)].width = 20
        elif column_name == 'WARRANTY STATUS':
            ws.column_dimensions[get_column_letter(idx)].width = 15
        else:
            ws.column_dimensions[get_column_letter(idx)].width = 14

    # Add example rows
    for row_num, example in enumerate(EXAMPLE_ROWS, start=2):
        for col_num, column_name in enumerate(UNIFIED_COLUMNS, start=1):
            value = example.get(column_name, '')
            cell = ws.cell(row=row_num, column=col_num, value=value)
            cell.border = border

            # Center align SI No. and CATEGORY columns
            if column_name in ['SI No.', 'CATEGORY']:
                cell.alignment = Alignment(horizontal="center")

    # Add instructions sheet
    ws_instructions = wb.create_sheet("Instructions")
    ws_instructions.column_dimensions['A'].width = 80

    instructions = [
        ["UNIFIED ASSET IMPORT TEMPLATE - INSTRUCTIONS"],
        [""],
        ["This template supports ALL asset categories in a single file."],
        [""],
        ["HOW TO USE:"],
        [""],
        ["1. The CATEGORY column determines where each asset is imported:"],
        ["   • Laptop, Desktop, Monitor, Printer, Phone, Server, Mouse, Headphones, Hard Disk, Corporate SIM"],
        [""],
        ["2. You can mix multiple categories in the SAME Excel file:"],
        ["   Row 2: Laptop"],
        ["   Row 3: Desktop"],
        ["   Row 4: Monitor"],
        ["   Row 5: Corporate SIM"],
        ["   Row 6: Mouse"],
        ["   ALL rows will be imported to their correct inventory!"],
        [""],
        ["3. Required fields for all assets:"],
        ["   • CATEGORY (must match exactly)"],
        ["   • ASSET NAME"],
        ["   • SERIAL NUMBER (except Corporate SIM)"],
        [""],
        ["4. Employee assignment (optional):"],
        ["   • Fill EMP ID to assign to an existing employee"],
        ["   • EMPLOYEE NAME used for validation"],
        ["   • Leave empty to add as unassigned inventory"],
        [""],
        ["5. Date format: Use DD/MM/YYYY or YYYY-MM-DD"],
        ["   Examples: 15/01/2024 or 2024-01-15"],
        [""],
        ["6. The 'Asset Import' sheet contains 5 example rows showing different categories."],
        ["   Delete the examples and add your own data."],
        [""],
        ["IMPORTANT NOTES:"],
        ["• SI No. is just for reference - it's not stored as the serial number"],
        ["• SERIAL NUMBER must be unique across all assets"],
        ["• CATEGORY value must match exactly (case-sensitive)"],
        ["• Not all columns are required for every category"],
        ["• Invalid rows will be shown during preview - fix them and re-upload"],
        ["• Empty rows are automatically skipped"],
        [""],
        ["SUPPORTED CATEGORIES (case-sensitive):"],
    ]

    for category in VALID_CATEGORIES:
        instructions.append([f"  • {category}"])

    instructions.extend([
        [""],
        ["COLUMN DESCRIPTIONS:"],
        ["• SI No. - Row number for reference only"],
        ["• EMP ID - Employee ID for assignment"],
        ["• EMPLOYEE NAME - Employee name"],
        ["• MOBILE NUMBER - Employee mobile number"],
        ["• ASSET NAME - Asset name (required)"],
        ["• CATEGORY - Asset category for routing (required)"],
        ["• SERIAL NUMBER - Unique asset serial number (required)"],
        ["• MODEL NAME - Asset model"],
        ["• OS - Operating system"],
        ["• VERSION - OS/software version"],
        ["• RAM - RAM capacity"],
        ["• CLIENT - Client/project location"],
        ["• INVOICE NUMBER - Purchase invoice number"],
        ["• INVOICE DATE - Invoice/purchase date"],
        ["• WARRANTY DATE - Warranty expiry date"],
        ["• CHARGER SERIAL NUMBER - Charger serial (for laptops)"],
        ["• ASSIGNED ON - Asset assignment date"],
        ["• WARRANTY STATUS - Warranty status (Active/Expired)"],
    ])

    for row_num, instruction in enumerate(instructions, start=1):
        for col_num, text in enumerate(instruction, start=1):
            cell = ws_instructions.cell(row=row_num, column=col_num, value=text)
            if row_num == 1:
                cell.font = Font(bold=True, size=14, color="FFFFFF")
                cell.fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
            elif text.startswith("HOW TO USE:") or text.startswith("IMPORTANT NOTES:") or text.startswith("SUPPORTED CATEGORIES") or text.startswith("COLUMN DESCRIPTIONS:"):
                cell.font = Font(bold=True, size=12)

            cell.alignment = Alignment(wrap_text=True, vertical="top")

    # Freeze header row in main sheet
    ws.freeze_panes = "A2"

    # Save to BytesIO
    output = BytesIO()
    wb.save(output)
    output.seek(0)

    return output


def get_column_mapping():
    """
    Get mapping from Excel column names to database field names.
    Returns dict with mappings for both assets and corporate_sims tables.
    Supports both old and new header formats for backward compatibility.
    """
    # Map Excel columns to Asset model fields
    # Support both new format and legacy format
    asset_field_mapping = {
        # New format (current)
        'SI No.': None,  # Not stored, reference only
        'EMP ID': 'emp_id',
        'EMPLOYEE NAME': 'employee_name',
        'MOBILE NUMBER': 'mobile_number',
        'ASSET NAME': 'asset_name',
        'CATEGORY': 'category',
        'SERIAL NUMBER': 'serial_number',
        'MODEL NAME': 'model_name',
        'OS': 'os',
        'VERSION': 'version',
        'RAM': 'ram',
        'CLIENT': 'location',  # CLIENT maps to location field in DB
        'INVOICE NUMBER': 'invoice_number',
        'INVOICE DATE': 'invoice_date',
        'WARRANTY DATE': 'warranty_date',
        'CHARGER SERIAL NUMBER': 'charger_serial',
        'ASSIGNED ON': 'date',
        'WARRANTY STATUS': None,  # Calculated field, not stored directly

        # Legacy format (for backward compatibility)
        'Sl no.': None,
        'Asset NAME': 'asset_name',
        'Version': 'version',
        'Ram': 'ram',
        'LOCATION': 'location',  # Old header
        'Charger Serial Number': 'charger_serial',
        'Old User/ New': 'old_user',  # Removed but still supported
        'Assigned Date': 'date',
        'Comment': 'comments',  # Removed but still supported
    }

    # Map Excel columns to CorporateSIM model fields
    corporate_sim_field_mapping = {
        'SI No.': None,
        'EMP ID': 'assigned_employee_id',
        'EMPLOYEE NAME': 'assigned_employee_name',
        'MOBILE NUMBER': 'mobile_number',
        'ASSET NAME': None,
        'CATEGORY': None,
        'SERIAL NUMBER': None,
        'MODEL NAME': None,
        'OS': None,
        'VERSION': None,
        'RAM': None,
        'CLIENT': None,
        'INVOICE NUMBER': 'invoice_number',
        'INVOICE DATE': 'purchase_date',
        'WARRANTY DATE': None,
        'CHARGER SERIAL NUMBER': None,
        'ASSIGNED ON': 'assignment_date',
        'WARRANTY STATUS': None,

        # Legacy format
        'Sl no.': None,
        'Asset NAME': None,
        'Version': None,
        'Ram': None,
        'LOCATION': None,
        'Charger Serial Number': None,
        'Old User/ New': None,
        'Assigned Date': 'assignment_date',
        'Comment': 'remarks',
    }

    return {
        'asset': asset_field_mapping,
        'corporate_sim': corporate_sim_field_mapping,
    }
