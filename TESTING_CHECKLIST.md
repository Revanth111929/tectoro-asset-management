# Upload/Import Functionality - Testing Checklist

## Test Date: _____________
## Tested By: _____________
## Environment: `/home/administrator/Desktop/asset-management/`

---

## Pre-Testing Verification

- [ ] Frontend build successful
- [ ] Backend server running (check PID)
- [ ] Database accessible
- [ ] Login with Admin/User account
- [ ] Browser: Chrome/Firefox (latest)

---

## Test 1: Button Visibility

### 1.1 Admin User
- [ ] Login as Admin
- [ ] Navigate to Inventory → Laptop
- [ ] Verify "Upload/Import" button visible (green, next to "Add New")
- [ ] Navigate to Inventory → CPU
- [ ] Verify "Upload/Import" button visible
- [ ] Repeat for all 12 categories

### 1.2 Regular User
- [ ] Login as User (non-admin)
- [ ] Navigate to Inventory → Monitor
- [ ] Verify "Upload/Import" button visible
- [ ] Verify can open modal and import

### 1.3 Viewer User
- [ ] Login as Viewer
- [ ] Navigate to Inventory → Printer
- [ ] Verify "Upload/Import" button NOT visible
- [ ] Verify no import access

---

## Test 2: Modal Functionality

### 2.1 Open Modal
- [ ] Click "Upload/Import" button
- [ ] Modal opens with correct title
- [ ] Modal shows category name (e.g., "Upload/Import Laptop Inventory")
- [ ] Close button (X) works
- [ ] ESC key closes modal
- [ ] Click outside modal closes it (with unsaved warning if file selected)

### 2.2 Template Download
- [ ] Click "Download Template" button
- [ ] Excel file downloads successfully
- [ ] Open file in Excel/LibreOffice
- [ ] Verify all columns present
- [ ] Verify sample data present

### 2.3 File Selection
- [ ] Click "Choose File"
- [ ] Select valid .xlsx file → No error
- [ ] Select valid .xls file → No error
- [ ] Select .csv file → Error: "Invalid file format"
- [ ] Select .pdf file → Error: "Invalid file format"
- [ ] Select no file → Button remains disabled
- [ ] File info displays (name, size)

---

## Test 3: Import - Valid Data

### 3.1 Single Category Import (Laptop)
- [ ] Open template
- [ ] Add 5 new Laptop assets with:
  - Unique serial numbers
  - CATEGORY = "Laptop"
  - All required fields filled
- [ ] Save as test_laptops.xlsx
- [ ] Navigate to Inventory → Laptop
- [ ] Upload file
- [ ] Click "Import Assets"
- [ ] Wait for completion
- [ ] Verify success message: "Imported: 5"
- [ ] Verify asset list refreshes automatically
- [ ] Verify all 5 laptops appear in list
- [ ] View one asset → Verify all data correct

### 3.2 Different Category (CPU)
- [ ] Create file with 3 CPU assets
- [ ] CATEGORY = "CPU"
- [ ] Navigate to Inventory → CPU
- [ ] Import file
- [ ] Verify success: "Imported: 3"
- [ ] Verify CPUs appear in CPU inventory

### 3.3 Monitor
- [ ] Import 4 Monitor assets
- [ ] Verify success and correct category

### 3.4 Printer
- [ ] Import 2 Printer assets
- [ ] Verify success and correct category

### 3.5 Phone
- [ ] Import 3 Phone assets
- [ ] Verify success and correct category

### 3.6 Server
- [ ] Import 2 Server assets
- [ ] Verify success and correct category

### 3.7 Mouse
- [ ] Import 5 Mouse assets
- [ ] Verify success and correct category

### 3.8 Headphones
- [ ] Import 3 Headphones assets
- [ ] Verify success and correct category

### 3.9 Hard Disk
- [ ] Import 4 Hard Disk assets
- [ ] Verify success and correct category

### 3.10 UPS
- [ ] Import 2 UPS assets
- [ ] Verify success and correct category

### 3.11 Laptop Bag
- [ ] Import 3 Laptop Bag assets
- [ ] Verify success and correct category

### 3.12 Other
- [ ] Import 2 Other assets
- [ ] Verify success and correct category

---

## Test 4: Import - Employee Assignment

### 4.1 Valid Employee
- [ ] Get valid EMP ID from Employee Master
- [ ] Create asset with:
  - EMP ID = (valid employee ID)
  - EMPLOYEE NAME = (employee name)
  - MOBILE NUMBER = (employee mobile)
- [ ] Import file
- [ ] Verify asset status = "Assigned"
- [ ] Verify employee info correct on asset view

### 4.2 Invalid Employee
- [ ] Create asset with EMP ID = "INVALID999"
- [ ] Import file
- [ ] Verify error reported
- [ ] Verify asset NOT imported

### 4.3 No Employee (Available)
- [ ] Create asset with:
  - EMP ID = (empty)
  - EMPLOYEE NAME = (empty)
- [ ] Import file
- [ ] Verify asset status = "Available"

---

## Test 5: Import - Error Handling

### 5.1 Missing Required Fields
- [ ] Create asset with missing Asset NAME
- [ ] Import → Error: "Missing Asset NAME"
- [ ] Create asset with missing SERIAL NUMBER
- [ ] Import → Error: "Missing SERIAL NUMBER"

### 5.2 Duplicate Serial Number
- [ ] Note existing serial number from database
- [ ] Create asset with same serial number
- [ ] Import → Error: "Serial number already exists"
- [ ] Verify asset NOT created

### 5.3 Mixed Valid/Invalid
- [ ] Create file with:
  - Row 1: Valid asset
  - Row 2: Missing Asset NAME (error)
  - Row 3: Duplicate serial (error)
  - Row 4: Valid asset
  - Row 5: Valid asset
- [ ] Import file
- [ ] Verify result: "Imported: 3, Errors: 2"
- [ ] Verify error details shown
- [ ] Verify 3 assets created (rows 1, 4, 5)

### 5.4 Empty Rows
- [ ] Create file with empty rows between data
- [ ] Import file
- [ ] Verify empty rows skipped silently
- [ ] Verify valid rows imported

---

## Test 6: Import - Mixed Categories

### 6.1 Multiple Categories in One File
- [ ] Create file with:
  - 2 Laptops (CATEGORY = "Laptop")
  - 3 CPUs (CATEGORY = "CPU")
  - 2 Monitors (CATEGORY = "Monitor")
- [ ] Import from Inventory → Laptop page
- [ ] Verify all 7 assets imported
- [ ] Check Laptop inventory → 2 laptops present
- [ ] Check CPU inventory → 3 CPUs present
- [ ] Check Monitor inventory → 2 monitors present

### 6.2 Wrong Category for Page
- [ ] Navigate to Inventory → Mouse
- [ ] Import file with CATEGORY = "Keyboard" (if it existed) or "Laptop"
- [ ] Verify assets go to correct category (Laptop)
- [ ] NOT to Mouse inventory

---

## Test 7: Import - Date Handling

### 7.1 Valid Dates
- [ ] Create asset with:
  - INVOICE DATE = 2024-01-15 (text format)
  - WARRANTY DATE = Excel date cell
- [ ] Import file
- [ ] Verify dates saved correctly
- [ ] View asset → Verify dates display correctly

### 7.2 Invalid Dates
- [ ] Create asset with:
  - INVOICE DATE = "invalid date"
- [ ] Import file
- [ ] Verify date field empty (no error)
- [ ] Verify asset still imported

---

## Test 8: Import - Large Files

### 8.1 Medium File (50 assets)
- [ ] Create file with 50 assets
- [ ] Import file
- [ ] Verify upload progress shown
- [ ] Verify all 50 imported successfully
- [ ] Time taken: _____ seconds

### 8.2 Large File (100 assets)
- [ ] Create file with 100 assets
- [ ] Import file
- [ ] Verify upload completes
- [ ] Verify all 100 imported successfully
- [ ] Time taken: _____ seconds

---

## Test 9: UI/UX Verification

### 9.1 Loading States
- [ ] During upload, verify:
  - Button shows spinner
  - Button text = "Importing..."
  - Button disabled
  - Close button disabled
  - Cannot close modal

### 9.2 Success State
- [ ] After successful import:
  - Green success alert shown
  - Import count correct
  - Error count correct (if any)
  - Error details visible (if any)
  - "Close" button available
  - Asset list refreshed

### 9.3 Error State
- [ ] After failed import:
  - Red error alert shown
  - Error message clear
  - Modal remains open
  - Can try again with different file

### 9.4 Modal Reset
- [ ] After successful import, close modal
- [ ] Reopen modal
- [ ] Verify state reset:
  - No file selected
  - No error message
  - No success message
  - File input cleared

---

## Test 10: Backward Compatibility

### 10.1 Existing /assets/import Page
- [ ] Navigate directly to /assets/import
- [ ] Verify page still works
- [ ] Upload file through this page
- [ ] Verify import successful
- [ ] Verify same functionality as modal

### 10.2 Existing Features
- [ ] Verify "Add New" button still works
- [ ] Verify asset list loads correctly
- [ ] Verify search works
- [ ] Verify filter works
- [ ] Verify pagination works
- [ ] Verify edit asset works
- [ ] Verify view asset works
- [ ] Verify delete asset works

---

## Test 11: Permissions

### 11.1 Admin
- [ ] Can see Upload/Import button
- [ ] Can open modal
- [ ] Can download template
- [ ] Can import assets
- [ ] Can access all categories

### 11.2 User
- [ ] Can see Upload/Import button
- [ ] Can import assets
- [ ] Same functionality as Admin

### 11.3 Viewer
- [ ] CANNOT see Upload/Import button
- [ ] CANNOT access import functionality
- [ ] Can only view assets

---

## Test 12: Mobile Responsive (Bonus)

### 12.1 Mobile View
- [ ] Open on mobile device
- [ ] Navigate to inventory category
- [ ] Verify button visible and accessible
- [ ] Tap "Upload/Import"
- [ ] Modal displays correctly
- [ ] Can select file
- [ ] Can import
- [ ] Results display correctly

---

## Test 13: Browser Compatibility

### 13.1 Chrome
- [ ] All tests pass

### 13.2 Firefox
- [ ] All tests pass

### 13.3 Safari (if available)
- [ ] All tests pass

### 13.4 Edge
- [ ] All tests pass

---

## Test 14: Performance

### 14.1 Page Load
- [ ] Inventory page loads quickly (< 2 seconds)
- [ ] Modal opens instantly (< 500ms)

### 14.2 Upload Speed
- [ ] Small file (10 rows): < 2 seconds
- [ ] Medium file (50 rows): < 10 seconds
- [ ] Large file (100 rows): < 20 seconds

### 14.3 List Refresh
- [ ] After import, list refreshes < 2 seconds

---

## Test 15: Security

### 15.1 Authentication
- [ ] Logout and try to access /inventory/laptop
- [ ] Verify redirect to login
- [ ] After login, import works

### 15.2 Token Expiry
- [ ] Wait for token expiry
- [ ] Try to import
- [ ] Verify proper error handling

### 15.3 File Validation
- [ ] Verify only .xlsx/.xls accepted
- [ ] Verify malicious files rejected

---

## Test 16: Edge Cases

### 16.1 Special Characters
- [ ] Asset name with special chars: `Asset™ #123`
- [ ] Import → Verify no error

### 16.2 Very Long Text
- [ ] Asset name with 200 characters
- [ ] Import → Verify handled correctly

### 16.3 Unicode Characters
- [ ] Asset name with emoji: `Laptop 💻`
- [ ] Import → Verify saved correctly

### 16.4 Empty File
- [ ] Upload file with only headers (no data)
- [ ] Import → Verify graceful handling

### 16.5 Malformed Excel
- [ ] Upload corrupted .xlsx file
- [ ] Verify error message

---

## Test 17: Audit Trail

### 17.1 Audit Logging
- [ ] Import assets
- [ ] Check audit logs
- [ ] Verify import logged with:
  - Action type: ASSET_IMPORTED
  - User who imported
  - Asset details
  - Timestamp

---

## Test 18: Database Verification

### 18.1 Data Integrity
- [ ] Import 5 assets
- [ ] Check database directly
- [ ] Verify all fields saved correctly
- [ ] Verify no data corruption

### 18.2 Transaction Safety
- [ ] Import file with mix of valid/invalid
- [ ] Verify valid assets committed
- [ ] Verify invalid assets NOT in database

---

## Test 19: User Workflow

### 19.1 End-to-End: New User
- [ ] Login as new user
- [ ] Navigate to Inventory → CPU
- [ ] Click Upload/Import
- [ ] Download template
- [ ] Fill template (5 CPUs)
- [ ] Upload and import
- [ ] View imported CPUs
- [ ] Edit one CPU
- [ ] Delete one CPU
- [ ] Verify all operations successful

### 19.2 End-to-End: Bulk Add
- [ ] Create 20 new Monitor assets
- [ ] Import from Inventory → Monitor
- [ ] Verify all appear
- [ ] Assign one to employee
- [ ] Transfer one to different location
- [ ] Verify lifecycle tracked

---

## Test 20: Documentation

### 20.1 User Guide
- [ ] Read UPLOAD_FEATURE_GUIDE.txt
- [ ] Verify instructions clear
- [ ] Follow guide step-by-step
- [ ] Verify guide accurate

### 20.2 Implementation Doc
- [ ] Read UPLOAD_IMPORT_IMPLEMENTATION.md
- [ ] Verify technical details accurate
- [ ] Verify files modified list correct

---

## Issues Found

| # | Description | Severity | Category | Status |
|---|-------------|----------|----------|--------|
| 1 |             |          |          |        |
| 2 |             |          |          |        |
| 3 |             |          |          |        |

**Severity:**
- Critical: Blocks core functionality
- High: Major issue, workaround available
- Medium: Moderate issue
- Low: Minor cosmetic/UX issue

---

## Test Summary

**Total Tests:** _____  
**Passed:** _____  
**Failed:** _____  
**Skipped:** _____  

**Pass Rate:** _____%

**Overall Result:** ☐ PASS ☐ FAIL

**Sign-off:**

Tester: _________________ Date: _______

Reviewer: _________________ Date: _______

---

## Notes

(Add any additional observations, suggestions, or comments here)
