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

# EXACT business format - 19 columns as used in production
# These are the EXACT column headers from the existing system
UNIFIED_COLUMNS = [
    'Sl no.',                    # Row number (for reference only, not stored)
    'EMP ID',                    # Employee ID
    'EMPLOYEE NAME',             # Employee name
    'MOBILE NUMBER',             # Employee mobile number
    'Asset NAME',                # Asset name (required for assets)
    'CATEGORY',                  # Category - routes to correct inventory
    'SERIAL NUMBER',             # Serial number (required for assets)
    'MODEL NAME',                # Model name
    'OS',                        # Operating system
    'Version',                   # OS/software version
    'Ram',                       # RAM
    'LOCATION',                  # Physical location
    'INVOICE NUMBER',            # Invoice number
    'INVOICE DATE',              # Invoice/purchase date
    'WARRANTY DATE',             # Warranty expiry date
    'Charger Serial Number',     # Charger serial (for laptops)
    'Old User/ New',             # Old user/new asset information
    'Assigned Date',             # Assignment date
    'Comment',                   # Comments/remarks
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
    'Laptop': ['CATEGORY', 'Asset NAME', 'SERIAL NUMBER'],
    'Desktop': ['CATEGORY', 'Asset NAME', 'SERIAL NUMBER'],
    'Monitor': ['CATEGORY', 'Asset NAME', 'SERIAL NUMBER'],
    'Printer': ['CATEGORY', 'Asset NAME', 'SERIAL NUMBER'],
    'Phone': ['CATEGORY', 'Asset NAME', 'SERIAL NUMBER'],
    'Server': ['CATEGORY', 'Asset NAME', 'SERIAL NUMBER'],
    'Mouse': ['CATEGORY', 'Asset NAME', 'SERIAL NUMBER'],
    'Headphones': ['CATEGORY', 'Asset NAME', 'SERIAL NUMBER'],
    'Hard Disk': ['CATEGORY', 'Asset NAME', 'SERIAL NUMBER'],
    'Corporate SIM': ['CATEGORY', 'Asset NAME'],  # Corporate SIM doesn't use SERIAL NUMBER
}

# Category-specific important fields (used but not required)
CATEGORY_IMPORTANT_FIELDS = {
    'Laptop': ['MODEL NAME', 'OS', 'Ram', 'Charger Serial Number', 'EMP ID', 'EMPLOYEE NAME'],
    'Desktop': ['MODEL NAME', 'OS', 'Ram', 'EMP ID', 'EMPLOYEE NAME'],
    'Monitor': ['MODEL NAME', 'LOCATION', 'EMP ID', 'EMPLOYEE NAME'],
    'Printer': ['MODEL NAME', 'LOCATION'],
    'Phone': ['MODEL NAME', 'EMP ID', 'EMPLOYEE NAME'],
    'Server': ['MODEL NAME', 'LOCATION'],
    'Mouse': ['MODEL NAME', 'EMP ID', 'EMPLOYEE NAME'],
    'Headphones': ['MODEL NAME', 'EMP ID', 'EMPLOYEE NAME'],
    'Hard Disk': ['MODEL NAME'],
    'Corporate SIM': ['MOBILE NUMBER', 'EMP ID', 'EMPLOYEE NAME'],
}

# Example data rows (show different categories in same template)
EXAMPLE_ROWS = [
    {
        'Sl no.': '1',
        'EMP ID': 'TT919',
        'EMPLOYEE NAME': 'Ajay Budidha',
        'MOBILE NUMBER': '9876543210',
        'Asset NAME': 'Dell Latitude 5430',
        'CATEGORY': 'Laptop',
        'SERIAL NUMBER': 'LAP-SN-12345',
        'MODEL NAME': 'Latitude 5430',
        'OS': 'Windows 11',
        'Version': '23H2',
        'Ram': '16GB',
        'LOCATION': 'Bangalore Office',
        'INVOICE NUMBER': 'INV-2024-001',
        'INVOICE DATE': '2024-01-15',
        'WARRANTY DATE': '2027-01-15',
        'Charger Serial Number': 'CHG-12345',
        'Old User/ New': '',
        'Assigned Date': '2024-01-15',
        'Comment': 'New laptop for employee',
    },
    {
        'Sl no.': '2',
        'EMP ID': 'TT925',
        'EMPLOYEE NAME': 'Ruthwik',
        'MOBILE NUMBER': '',
        'Asset NAME': 'HP EliteDesk 800 G8',
        'CATEGORY': 'Desktop',
        'SERIAL NUMBER': 'DESK-SN-67890',
        'MODEL NAME': 'EliteDesk 800 G8',
        'OS': 'Windows 11',
        'Version': '',
        'Ram': '32GB',
        'LOCATION': 'Mumbai Office',
        'INVOICE NUMBER': 'INV-2024-002',
        'INVOICE DATE': '2024-02-01',
        'WARRANTY DATE': '2027-02-01',
        'Charger Serial Number': '',
        'Old User/ New': '',
        'Assigned Date': '2024-02-01',
        'Comment': 'Workstation for design team',
    },
    {
        'Sl no.': '3',
        'EMP ID': '',
        'EMPLOYEE NAME': '',
        'MOBILE NUMBER': '',
        'Asset NAME': 'Dell P2722H Monitor',
        'CATEGORY': 'Monitor',
        'SERIAL NUMBER': 'MON-SN-11111',
        'MODEL NAME': 'P2722H',
        'OS': '',
        'Version': '',
        'Ram': '',
        'LOCATION': 'Bangalore Office',
        'INVOICE NUMBER': 'INV-2024-003',
        'INVOICE DATE': '2024-03-01',
        'WARRANTY DATE': '2027-03-01',
        'Charger Serial Number': '',
        'Old User/ New': '',
        'Assigned Date': '',
        'Comment': 'Additional display',
    },
    {
        'Sl no.': '4',
        'EMP ID': 'TT926',
        'EMPLOYEE NAME': 'Balaji',
        'MOBILE NUMBER': '9876543211',
        'Asset NAME': 'Logitech MX Master 3',
        'CATEGORY': 'Mouse',
        'SERIAL NUMBER': 'MOU-SN-22222',
        'MODEL NAME': 'MX Master 3',
        'OS': '',
        'Version': '',
        'Ram': '',
        'LOCATION': 'Mumbai Office',
        'INVOICE NUMBER': 'INV-2024-004',
        'INVOICE DATE': '2024-03-15',
        'WARRANTY DATE': '2025-03-15',
        'Charger Serial Number': '',
        'Old User/ New': '',
        'Assigned Date': '2024-03-15',
        'Comment': 'Wireless mouse',
    },
    {
        'Sl no.': '5',
        'EMP ID': 'TT927',
        'EMPLOYEE NAME': 'Suresh',
        'MOBILE NUMBER': '9876543212',
        'Asset NAME': 'Airtel Corporate SIM',
        'CATEGORY': 'Corporate SIM',
        'SERIAL NUMBER': '',  # Corporate SIM doesn't use this
        'MODEL NAME': '',
        'OS': '',
        'Version': '',
        'Ram': '',
        'LOCATION': '',
        'INVOICE NUMBER': 'INV-2024-005',
        'INVOICE DATE': '2024-01-20',
        'WARRANTY DATE': '',
        'Charger Serial Number': '',
        'Old User/ New': '',
        'Assigned Date': '2024-01-25',
        'Comment': 'Corporate data plan with unlimited calls - ICCID: 8991101200003204510, Carrier: Airtel',
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
        if column_name in ['CATEGORY', 'Asset NAME', 'SERIAL NUMBER']:
            cell.fill = required_fill
            cell.font = required_font
        else:
            cell.fill = header_fill
            cell.font = header_font
        
        cell.alignment = header_alignment
        cell.border = border
        
        # Set column width
        if column_name in ['Asset NAME', 'EMPLOYEE NAME', 'Comment']:
            ws.column_dimensions[get_column_letter(idx)].width = 30
        elif column_name in ['SERIAL NUMBER', 'MODEL NAME', 'INVOICE NUMBER']:
            ws.column_dimensions[get_column_letter(idx)].width = 20
        elif column_name == 'CATEGORY':
            ws.column_dimensions[get_column_letter(idx)].width = 15
        elif column_name == 'Charger Serial Number':
            ws.column_dimensions[get_column_letter(idx)].width = 18
        elif column_name == 'Old User/ New':
            ws.column_dimensions[get_column_letter(idx)].width = 15
        else:
            ws.column_dimensions[get_column_letter(idx)].width = 14
    
    # Add example rows
    for row_num, example in enumerate(EXAMPLE_ROWS, start=2):
        for col_num, column_name in enumerate(UNIFIED_COLUMNS, start=1):
            value = example.get(column_name, '')
            cell = ws.cell(row=row_num, column=col_num, value=value)
            cell.border = border
            
            # Center align Sl no. and CATEGORY columns
            if column_name in ['Sl no.', 'CATEGORY']:
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
        ["   • Asset NAME"],
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
        ["• Sl no. is just for reference - it's not stored as the serial number"],
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
        ["• Sl no. - Row number for reference only"],
        ["• EMP ID - Employee ID for assignment"],
        ["• EMPLOYEE NAME - Employee name"],
        ["• MOBILE NUMBER - Employee mobile number"],
        ["• Asset NAME - Asset name (required)"],
        ["• CATEGORY - Asset category for routing (required)"],
        ["• SERIAL NUMBER - Unique asset serial number (required)"],
        ["• MODEL NAME - Asset model"],
        ["• OS - Operating system"],
        ["• Version - OS/software version"],
        ["• Ram - RAM capacity"],
        ["• LOCATION - Physical location"],
        ["• INVOICE NUMBER - Purchase invoice number"],
        ["• INVOICE DATE - Invoice/purchase date"],
        ["• WARRANTY DATE - Warranty expiry date"],
        ["• Charger Serial Number - Charger serial (for laptops)"],
        ["• Old User/ New - Previous user/asset information"],
        ["• Assigned Date - Asset assignment date"],
        ["• Comment - Additional remarks/comments"],
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
    Uses EXACT business column names.
    """
    # Map Excel columns to Asset model fields
    asset_field_mapping = {
        'Sl no.': None,  # Not stored, reference only
        'EMP ID': 'emp_id',
        'EMPLOYEE NAME': 'employee_name',
        'MOBILE NUMBER': 'mobile_number',
        'Asset NAME': 'asset_name',
        'CATEGORY': 'category',
        'SERIAL NUMBER': 'serial_number',
        'MODEL NAME': 'model_name',
        'OS': 'os',
        'Version': 'version',
        'Ram': 'ram',
        'LOCATION': 'location',
        'INVOICE NUMBER': 'invoice_number',
        'INVOICE DATE': 'invoice_date',
        'WARRANTY DATE': 'warranty_date',
        'Charger Serial Number': 'charger_serial',
        'Old User/ New': 'old_user',
        'Assigned Date': 'date',
        'Comment': 'comments',
    }
    
    # Map Excel columns to CorporateSIM model fields
    # Corporate SIM uses same Excel format but interprets differently
    corporate_sim_field_mapping = {
        'Sl no.': None,  # Not stored
        'EMP ID': 'assigned_employee_id',
        'EMPLOYEE NAME': 'assigned_employee_name',
        'MOBILE NUMBER': 'mobile_number',  # SIM's mobile number
        'Asset NAME': None,  # Optional, not directly mapped
        'CATEGORY': None,  # Used for routing only
        'SERIAL NUMBER': None,  # Corporate SIM uses ICCID instead
        'MODEL NAME': None,  # Not used for SIM
        'OS': None,
        'Version': None,
        'Ram': None,
        'LOCATION': None,
        'INVOICE NUMBER': 'invoice_number',  # Can be stored in remarks
        'INVOICE DATE': 'purchase_date',
        'WARRANTY DATE': None,
        'Charger Serial Number': None,
        'Old User/ New': None,
        'Assigned Date': 'assignment_date',
        'Comment': 'remarks',
    }
    
    return {
        'asset': asset_field_mapping,
        'corporate_sim': corporate_sim_field_mapping,
    }
