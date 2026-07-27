# Excel Import - User's Custom Format Support ✅

**Date:** July 24, 2026  
**Status:** Template updated to match user's exact Excel format  

---

## User's Excel Format

The system now supports importing Excel files with these exact column headers:

```
Sl no. | EMP ID | EMPLOYEE NAME | MOBILE NUMBER | Asset NAME | CATEGORY | 
SERIAL NUMBER | MODEL NAME | OS | Version | Ram | LOCATION | 
INVOICE NUMBER | INVOICE DATE | WARRANTY DATE | Charger Serial Number | 
Old User | Date | Old Device | Comments
```

**Total Columns:** 20

---

## Column Mapping

| Excel Column (Your Format) | Database Field | Required | Example |
|----------------------------|----------------|----------|---------|
| Sl no. | *(ignored)* | No | 1, 2, 3... |
| EMP ID | emp_id | No | EMP001, TT123 |
| EMPLOYEE NAME | employee_name | No | John Doe |
| MOBILE NUMBER | mobile_number | No | 1234567890 |
| **Asset NAME** | asset_name | **Yes** | Dell Laptop XPS 15 |
| CATEGORY | category | No | Laptop, Monitor, Desktop |
| **SERIAL NUMBER** | serial_number | **Yes** | SN-DELL-001 |
| MODEL NAME | model_name | No | XPS 15 9500 |
| OS | os | No | Windows, Linux, macOS |
| Version | version | No | 11, 10, Ubuntu 22.04 |
| Ram | ram | No | 16GB, 8GB, 32GB |
| LOCATION | location | No | HQ Office, Branch |
| INVOICE NUMBER | invoice_number | No | INV-001 |
| INVOICE DATE | invoice_date | No | 2024-01-15 |
| WARRANTY DATE | warranty_date | No | 2027-01-15 |
| Charger Serial Number | charger_serial | No | CHG-001 |
| Old User | old_user | No | Previous employee name |
| Date | date | No | 2024-01-15 (assignment date) |
| Old Device | old_device | No | Previous device info |
| Comments | comments | No | Any notes |

---

## Required Fields

Only **2 fields** are required:
1. **Asset NAME** - The name of the asset
2. **SERIAL NUMBER** - Unique serial number (must be unique in database)

All other fields are optional.

---

## Automatic Status Assignment

The system automatically determines asset status:
- **If EMP ID is filled** → Status = `Assigned`
- **If EMP ID is empty** → Status = `Available`

---

## Sample Excel Data

### Header Row (Row 1):
```
Sl no. | EMP ID | EMPLOYEE NAME | MOBILE NUMBER | Asset NAME | CATEGORY | SERIAL NUMBER | MODEL NAME | OS | Version | Ram | LOCATION | INVOICE NUMBER | INVOICE DATE | WARRANTY DATE | Charger Serial Number | Old User | Date | Old Device | Comments
```

### Data Row 1 (Assigned Laptop):
```
1 | EMP001 | John Doe | 1234567890 | Dell Laptop XPS 15 | Laptop | SN-DELL-001 | XPS 15 9500 | Windows | 11 | 16GB | HQ Office | INV-001 | 2024-01-15 | 2027-01-15 | CHG-001 | | 2024-01-15 | | Primary work laptop
```

### Data Row 2 (Available Monitor):
```
2 | | | | HP Monitor 27" | Monitor | SN-MON-002 | HP E27 | | | | HQ Office | INV-002 | 2024-02-20 | 2027-02-20 | | | 2024-02-20 | | External display
```

---

## Date Format Support

The system accepts dates in multiple formats:
- **Excel Date:** Automatically parsed
- **YYYY-MM-DD:** 2024-01-15
- **DD/MM/YYYY:** 15/01/2024
- **MM/DD/YYYY:** 01/15/2024

Invalid dates are ignored (no error, just left empty).

---

## How to Use

### Step 1: Prepare Your Excel File

Keep your existing Excel format! Use these exact column headers:
```
Sl no. | EMP ID | EMPLOYEE NAME | MOBILE NUMBER | Asset NAME | CATEGORY | 
SERIAL NUMBER | MODEL NAME | OS | Version | Ram | LOCATION | 
INVOICE NUMBER | INVOICE DATE | WARRANTY DATE | Charger Serial Number | 
Old User | Date | Old Device | Comments
```

### Step 2: Fill Your Data

**Minimum required:**
- Asset NAME: Name of the asset
- SERIAL NUMBER: Unique identifier

**Optional but recommended:**
- EMP ID: If asset is assigned to someone
- EMPLOYEE NAME: Employee name
- MOBILE NUMBER: Contact number
- CATEGORY: Laptop, Desktop, Monitor, etc.
- All other fields as needed

### Step 3: Upload

1. Navigate to **Assets → Import Assets**
2. Click **"Select Excel File"**
3. Choose your Excel file
4. Click **"Import Assets"**
5. Wait for success message

### Step 4: Verify

- Check the success message: "Successfully imported X assets"
- Go to **All Assets** page
- Verify your assets are listed

---

## Important Notes

### Serial Number Uniqueness
- Each SERIAL NUMBER must be unique
- If a serial number already exists in the database, that row will be skipped
- Other rows will still be imported

### Employee Assignment
- If you fill EMP ID, the asset status becomes "Assigned"
- If EMP ID is empty, the asset status becomes "Available"
- EMPLOYEE NAME and MOBILE NUMBER are optional even when EMP ID is filled

### Sl no. Column
- The "Sl no." column is ignored during import
- You can number your rows for reference, but it won't be saved

### Empty Cells
- Empty cells are fine for optional fields
- They will be saved as empty/null in the database

---

## Error Handling

### Row-Level Errors
Each row is processed independently. If one fails, others continue.

**Common Errors:**
- "Missing Asset NAME" - Asset NAME column is empty
- "Missing SERIAL NUMBER" - SERIAL NUMBER column is empty
- "Serial number 'XXX' already exists" - Duplicate serial number

### File-Level Errors
- "No file uploaded" - No file selected
- "Invalid file format" - File is not .xlsx or .xls

---

## Example Import Results

### Success Message:
```
Import Complete!
Successfully imported 50 assets

✓ IMPORTED: 50
```

### Partial Success with Errors:
```
Import Complete!
Successfully imported 45 assets, 5 rows had errors

✓ IMPORTED: 45
⚠ ERRORS: 5

Error Details:
• Row 10: Missing Asset NAME
• Row 15: Serial number 'SN-001' already exists
• Row 20: Missing SERIAL NUMBER
• Row 25: Missing Asset NAME
• Row 30: Serial number 'SN-050' already exists
```

---

## Field Type Reference

| Field | Type | Max Length | Notes |
|-------|------|------------|-------|
| Asset NAME | Text | 150 chars | Required |
| SERIAL NUMBER | Text | 100 chars | Required, Unique |
| EMP ID | Text | 50 chars | Employee identifier |
| EMPLOYEE NAME | Text | 150 chars | Full name |
| MOBILE NUMBER | Text | 30 chars | Phone number |
| CATEGORY | Text | 100 chars | Asset category |
| MODEL NAME | Text | 150 chars | Model/variant |
| OS | Text | 100 chars | Operating system |
| Version | Text | 50 chars | OS/firmware version |
| Ram | Text | 30 chars | E.g., "16GB", "8GB" |
| LOCATION | Text | 150 chars | Office/floor/room |
| INVOICE NUMBER | Text | 100 chars | Invoice reference |
| INVOICE DATE | Date | - | Purchase date |
| WARRANTY DATE | Date | - | Warranty expiry |
| Charger Serial Number | Text | 100 chars | Charger SN |
| Old User | Text | 150 chars | Previous owner |
| Date | Date | - | Assignment date |
| Old Device | Text | 150 chars | Previous device |
| Comments | Text | Unlimited | Any notes |

---

## Validation Rules

### Asset NAME
- ✅ Cannot be empty
- ✅ Max 150 characters
- ✅ Any text allowed

### SERIAL NUMBER
- ✅ Cannot be empty
- ✅ Max 100 characters
- ✅ Must be unique across all assets
- ✅ Any text/numbers allowed

### All Other Fields
- ✅ Optional
- ✅ Empty values allowed
- ✅ No special validation

---

## Download Template

The system automatically generates a template with your format:

1. Go to **Assets → Import Assets**
2. Click **"Download Template"** button
3. Excel file downloads with:
   - Your exact column headers (20 columns)
   - 2 sample data rows
   - Proper formatting

---

## Tips for Large Imports

### Performance
- **Optimal:** 100-500 rows per file
- **Maximum:** 1000-2000 rows per file
- For larger imports, split into multiple files

### Data Preparation
1. Clean your data before import
2. Ensure serial numbers are unique
3. Check date formats
4. Remove empty rows at the end
5. Keep header row at row 1

### Testing
1. Test with 5-10 rows first
2. Verify imported data
3. Then import full dataset

---

## Troubleshooting

### "Successfully imported 0 assets"
**Cause:** All rows had errors  
**Solution:** Check error details, fix issues, and re-import

### "Serial number already exists"
**Cause:** Duplicate serial numbers in database or file  
**Solution:** Use unique serial numbers or update existing assets

### "Missing Asset NAME" or "Missing SERIAL NUMBER"
**Cause:** Required fields are empty  
**Solution:** Fill Asset NAME and SERIAL NUMBER for all rows

### Dates not importing correctly
**Cause:** Unrecognized date format  
**Solution:** Use YYYY-MM-DD format (e.g., 2024-01-15)

---

## Success Checklist

Before importing, verify:
- ✅ Excel file has exactly 20 columns
- ✅ Header row matches the format
- ✅ Asset NAME filled for all rows
- ✅ SERIAL NUMBER filled and unique for all rows
- ✅ Dates in correct format
- ✅ File saved as .xlsx or .xls

---

**Status: READY TO USE** ✅

Your existing Excel format is now fully supported! Just upload your file with the exact column headers you're using.
