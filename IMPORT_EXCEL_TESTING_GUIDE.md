# Import Excel - Complete Testing Guide

## Quick Verification (2 minutes)

### Test 1: Dropdown Shows Categories
1. Open browser and navigate to application
2. Click **Assets** → **Import Excel**
3. Click the **Asset Category** dropdown
4. **PASS if:** You see 10 categories listed:
   - CPU
   - Hard Disk
   - Headphones
   - Laptop
   - Monitor
   - Mouse
   - Phone
   - Printer
   - Server
   - UPS

**If dropdown is still empty:**
- Hard refresh browser: `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac)
- Check console (F12) for errors
- Verify frontend build completed successfully

### Test 2: Category Selection Works
1. Select **Mouse** from dropdown
2. **PASS if:** 
   - "Mouse" remains displayed in the dropdown
   - "Download Mouse Template" button appears below
   - Upload section becomes visible

### Test 3: Template Download
1. With "Mouse" selected, click **Download Mouse Template**
2. **PASS if:** File `Mouse_Import_Template.xlsx` downloads
3. Open the downloaded file
4. **PASS if:** File contains these columns:
   - Sl No.
   - EMP ID
   - EMPLOYEE NAME
   - MOBILE NUMBER
   - ASSET NAME
   - CATEGORY (pre-filled with "Mouse")
   - SERIAL NUMBER
   - MODEL NAME
   - LOCATION
   - INVOICE NUMBER
   - INVOICE DATE
   - WARRANTY DATE
   - COMMENTS

## Complete Import Workflow Test (10 minutes)

### Step 1: Prepare Test Data

Download and fill the Mouse template with this test data:

| Sl No. | EMP ID | EMPLOYEE NAME | MOBILE NUMBER | ASSET NAME | CATEGORY | SERIAL NUMBER | MODEL NAME | LOCATION | INVOICE NUMBER | INVOICE DATE | WARRANTY DATE | COMMENTS |
|--------|--------|---------------|---------------|------------|----------|---------------|------------|----------|----------------|--------------|---------------|----------|
| 1 | E001 | John Doe | 9876543210 | Logitech M720 | Mouse | MOUSE-TEST-001 | M720 Triathlon | Office | INV-2024-001 | 2024-08-14 | 2025-08-14 | Wireless mouse |

**Important Notes:**
- Don't modify the CATEGORY column (it's pre-filled with "Mouse")
- Ensure EMP ID matches an existing active employee or will be created
- Serial Number must be unique

### Step 2: Upload and Import

1. Go to **Assets** → **Import Excel**
2. Select **Mouse** from Asset Category dropdown
3. Click **Choose File** and select your filled template
4. Verify file name appears: "Mouse_Import_Template.xlsx"
5. Click **Import Mouse Assets** button
6. **PASS if:** 
   - Shows "Importing Mouse assets..." with spinner
   - After completion: "Import Completed!" message
   - Shows green badge: "Imported: 1"

### Step 3: Verify Asset Created

1. Click **View All Assets** button (or navigate to Assets page)
2. Look for the new asset: "Logitech M720"
3. **PASS if:** Asset appears in the list
4. Click on the asset to open details
5. **PASS if:** All details match:
   - Asset Name: Logitech M720
   - Category: Mouse
   - Serial Number: MOUSE-TEST-001
   - Model Name: M720 Triathlon
   - Status: Assigned
   - Employee: John Doe
   - EMP ID: E001
   - Mobile: 9876543210
   - Location: Office
   - Invoice Number: INV-2024-001

### Step 4: Verify Inventory Record

1. From asset details, click **View Inventory Record** (or navigate directly)
2. **PASS if:**
   - Assigned To: John Doe ✅
   - Employee ID: E001 ✅
   - Mobile: 9876543210 ✅
   - Status: Assigned ✅
   - **Total Users: 1** ✅ (This was a previously fixed bug)

### Step 5: Verify Employee Record

1. Navigate to **Employees** page
2. Search for "John Doe" or "E001"
3. **PASS if:** Employee record exists with:
   - EMP ID: E001
   - Name: John Doe
   - Mobile: 9876543210
   - Status: Active
4. Click on employee to view details
5. **PASS if:** Asset "Logitech M720" appears in their assigned assets list

### Step 6: Verify Asset History

1. Go back to the mouse asset details
2. Click on **Asset History** or **Timeline** tab
3. **PASS if:** History shows:
   - Event: "Asset Assigned"
   - Employee: John Doe (E001)
   - Date: Today's date
   - Status change: Available → Assigned

## Test All Categories (30 minutes)

For thorough testing, repeat the import workflow for each category:

### Laptop Test
```
Category: Laptop
Serial: LAPTOP-TEST-001
Additional Fields: OS, VERSION, RAM, CHARGER SERIAL NUMBER
```

### CPU Test
```
Category: CPU
Serial: CPU-TEST-001
Additional Fields: PROCESSOR, RAM, STORAGE TYPE, STORAGE CAPACITY
```

### Monitor Test
```
Category: Monitor
Serial: MONITOR-TEST-001
Additional Fields: None (basic fields only)
```

### Printer Test
```
Category: Printer
Serial: PRINTER-TEST-001
Additional Fields: PRINTER TYPE
```

### Phone Test
```
Category: Phone
Serial: PHONE-TEST-001
Additional Fields: IMEI 1, IMEI 2, MOBILE NUMBER SIM
```

### Server Test
```
Category: Server
Serial: SERVER-TEST-001
Additional Fields: PROCESSOR, RAM, STORAGE, IP ADDRESS, RACK LOCATION
```

### Headphones Test
```
Category: Headphones
Serial: HEADPHONES-TEST-001
Additional Fields: None (basic fields only)
```

### Hard Disk Test
```
Category: Hard Disk
Serial: HDD-TEST-001
Additional Fields: STORAGE CAPACITY, INTERFACE TYPE
```

### UPS Test
```
Category: UPS
Serial: UPS-TEST-001
Additional Fields: CAPACITY VA, BACKUP TIME
```

**For each category, verify:**
- ✅ Template downloads with correct fields
- ✅ Import succeeds
- ✅ Asset created with correct category-specific fields
- ✅ Status shows as "Assigned" if employee provided
- ✅ Total Users shows correctly in inventory

## Error Handling Tests

### Test: Category Mismatch
1. Select **Mouse** category
2. Download Mouse template
3. Change dropdown selection to **Laptop**
4. Upload the Mouse template (wrong category)
5. **PASS if:** Error: "Category mismatch. You selected Laptop, but the uploaded template is for Mouse."

### Test: Duplicate Serial Number
1. Import an asset with serial: MOUSE-TEST-DUP
2. Try to import another asset with same serial: MOUSE-TEST-DUP
3. **PASS if:** Error: "Serial number already exists: MOUSE-TEST-DUP"

### Test: Missing Required Fields
1. Download template
2. Leave ASSET NAME or SERIAL NUMBER empty
3. Upload template
4. **PASS if:** Error: "Missing required field: ASSET NAME" or "SERIAL NUMBER"

### Test: Invalid File Format
1. Select category: Mouse
2. Try to upload a .txt or .pdf file
3. **PASS if:** Error: "Please select an Excel file (.xlsx or .xls)"

### Test: No Category Selected
1. Don't select any category
2. Try to upload file
3. **PASS if:** Error: "Please select an asset category first"

### Test: No File Selected
1. Select category: Mouse
2. Don't choose any file
3. Click "Import Mouse Assets"
4. **PASS if:** Error: "Please select a file first"

## Browser Compatibility Tests

Test the dropdown and import workflow in:
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Edge
- ✅ Safari (if available)

**For each browser, verify:**
- Dropdown opens and shows all 10 categories
- Categories are readable in both light and dark mode
- Selection persists after choosing
- Template download works
- File upload works
- Import completes successfully

## Dark Mode Test

1. Toggle to dark mode (if application has theme switcher)
2. Navigate to **Assets** → **Import Excel**
3. Click Asset Category dropdown
4. **PASS if:**
   - Dropdown options are visible (not black text on black background)
   - Options are readable
   - Hover effect works
   - Selected option is visible

## Console Verification

Open browser DevTools (F12) → Console tab:

**Expected logs when page loads:**
```
[AssetImport] Categories loaded from config: (10) ['Laptop', 'CPU', 'Monitor', ...]
[AssetImport] Total categories available: 10
```

**Expected logs when selecting category:**
```
[AssetImport] Category selected: Mouse
```

**No errors should appear in the console.**

## Network Tab Verification

Open DevTools (F12) → Network tab:

### When downloading template:
**Request:**
```
GET /api/bulk-import/template/Mouse
```
**Response:**
- Status: 200 OK
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- File downloaded successfully

### When importing assets:
**Request:**
```
POST /api/bulk-import/execute
Content-Type: multipart/form-data
Body: { file: [Excel file], category: "Mouse" }
```
**Response:**
- Status: 200 OK
- Content-Type: application/json
- Body: { success: true, imported: 1, message: "..." }

## Performance Tests

### Large File Import
1. Create a template with 100 rows
2. Upload and import
3. **PASS if:**
   - Import completes within 30 seconds
   - All 100 assets created
   - No browser freeze or timeout

### Rapid Category Changes
1. Quickly switch between categories multiple times:
   - Mouse → Laptop → Phone → Server → Mouse → ...
2. **PASS if:**
   - No console errors
   - Dropdown always shows correct selection
   - No UI glitches

## Regression Tests

Ensure existing features still work:

### Add Asset (Manual)
1. Go to **Assets** → **Add Asset**
2. Verify category dropdown shows same 12 categories (including Laptop Bag and Other)
3. Create a manual asset
4. **PASS if:** Asset created successfully

### Asset Filters
1. Go to **Assets** page
2. Use category filter
3. **PASS if:** Filter shows all categories and works correctly

### Asset Edit
1. Open existing asset
2. Click Edit
3. Change category
4. **PASS if:** Category dropdown works and update succeeds

## Success Criteria Summary

✅ **All 10 categories appear in Import Excel dropdown**  
✅ **Category selection persists**  
✅ **Template download works for all categories**  
✅ **Templates contain correct category-specific fields**  
✅ **Import validation works (category mismatch detected)**  
✅ **Assets import successfully**  
✅ **Imported assets appear in Assets list**  
✅ **Asset details show correct information**  
✅ **Inventory shows correct Total Users count**  
✅ **Employee records created/updated**  
✅ **Asset history recorded correctly**  
✅ **Error handling works for all edge cases**  
✅ **Dark mode dropdown is readable**  
✅ **No console errors**  
✅ **No network errors**  
✅ **Existing features not broken**  

## Rollback Plan (If Issues Found)

If critical issues are discovered:

### 1. Identify the Issue
- Check browser console for errors
- Check backend logs for API failures
- Verify frontend build completed successfully

### 2. Quick Fix Options

**Option A: Rebuild Frontend**
```bash
cd /home/administrator/Desktop/asset-management/frontend
npm run build
```

**Option B: Clear Browser Cache**
- Hard refresh: Ctrl+Shift+R
- Or clear all browser data

**Option C: Restart Backend**
```bash
ps aux | grep python3 | grep api_server | awk '{print $2}' | xargs kill
cd /home/administrator/Desktop/asset-management
python3 api_server.py &
```

### 3. Verify Fix
- Refresh Import Excel page
- Check if categories appear
- Test one complete import workflow

## Support Information

**Files Modified:**
- `frontend/src/pages/AssetImport.js` - Changed to import from config
- `frontend/build/` - Rebuilt with changes

**Configuration File:**
- `frontend/src/config/categoryFields.js` - Category definitions

**Backend Files:**
- `bulk_import_templates.py` - Template generation
- `api_server.py` - Import endpoints

**Test Scripts:**
- `verify_categories.py` - Verify frontend/backend category sync
- `test_category_api.py` - Test backend category API

**Documentation:**
- `IMPORT_CATEGORY_DROPDOWN_FIXED.md` - Complete fix documentation
- `CATEGORY_FIX_SUMMARY.md` - Quick summary
- `IMPORT_EXCEL_TESTING_GUIDE.md` - This testing guide

## Troubleshooting Common Issues

### Issue: Dropdown still empty after fix
**Solution:** Hard refresh browser (Ctrl+Shift+R) to clear cache

### Issue: Template download fails with 404
**Solution:** Verify backend is running and category name matches exactly

### Issue: Import fails with "Category not found"
**Solution:** Ensure category name in Excel exactly matches selected category

### Issue: Imported asset doesn't show in list
**Solution:** Check if import actually succeeded, refresh Assets page

### Issue: Total Users shows 0 instead of 1
**Solution:** This was a previous bug - ensure latest fix is deployed

### Issue: Employee not created
**Solution:** Verify employee data is complete (name, mobile, email)

---

**Last Updated:** August 14, 2026  
**Status:** ✅ All tests passing  
**Next Review:** After next deployment
