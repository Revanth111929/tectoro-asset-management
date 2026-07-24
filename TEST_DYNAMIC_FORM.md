# Dynamic Form Testing Checklist

## ✅ Pre-Test Verification

- [x] Backend running on http://192.168.20.180:5000
- [x] Frontend running on http://192.168.20.180:3000
- [x] Database migrated (33 new columns added)
- [x] Models updated with new fields
- [x] API endpoints updated
- [x] Frontend components created/updated

## 🧪 Test Scenarios

### Test 1: Category Dropdown Visibility
**Steps:**
1. Go to http://192.168.20.180:3000/assets
2. Click "Add Asset"
3. Click "New Device" tab

**Expected Result:**
- ✅ Category dropdown should be visible
- ✅ Should show all 13 categories when clicked
- ✅ Form should show message: "Please select a category to display the appropriate fields"

**Status:** ⬜ Not Tested

---

### Test 2: Laptop Category Fields
**Steps:**
1. Select "Laptop" from Category dropdown

**Expected Result:**
- ✅ Basic Details section appears with:
  - Brand Name
  - Model Name
  - Serial Number
  - Status
- ✅ Specifications section appears with:
  - Processor
  - RAM (dropdown: 4GB, 8GB, 16GB, 32GB, 64GB, 128GB, 256GB, Other)
  - Storage Type (dropdown: SSD, HDD, Hybrid, NVMe SSD)
  - Storage Capacity
  - Operating System (dropdown)
  - OS Version
  - Screen Size
- ✅ Purchase & Warranty section appears with:
  - Purchase Vendor
  - Purchase Price (₹)
  - Purchase Date
  - Warranty Start Date
  - Warranty End Date
- ✅ Assignment section appears with:
  - Assigned Employee
- ✅ Additional Information section appears with:
  - Remarks

**Status:** ⬜ Not Tested

---

### Test 3: Phone Category Fields
**Steps:**
1. Change category from "Laptop" to "Phone"

**Expected Result:**
- ✅ Form updates immediately
- ✅ Laptop fields (Processor, Screen Size) disappear
- ✅ Phone fields appear:
  - IMEI 1
  - IMEI 2
  - RAM
  - Storage Capacity
  - Operating System
  - OS Version
  - Mobile Number (Optional)

**Status:** ⬜ Not Tested

---

### Test 4: Printer Category Fields
**Steps:**
1. Change category to "Printer"

**Expected Result:**
- ✅ Specifications section shows:
  - Printer Type (Laser, Inkjet, Dot Matrix, Thermal, 3D Printer, Other)
  - Color or Monochrome
  - Network Enabled (Yes/No)
- ✅ Assignment section shows "Location" instead of "Assigned Employee"
- ✅ No computer-specific fields (RAM, Processor, etc.)

**Status:** ⬜ Not Tested

---

### Test 5: Laptop Bag Category (Special Case)
**Steps:**
1. Change category to "Laptop Bag"

**Expected Result:**
- ✅ Basic Details section does NOT show "Serial Number" field
- ✅ Shows: Brand Name, Model Name, Status only
- ✅ Specifications shows: Size Compatibility, Color
- ✅ Purchase shows: Vendor, Price, Date, Warranty Period (not start/end dates)

**Status:** ⬜ Not Tested

---

### Test 6: Server Category (No Assignment)
**Steps:**
1. Change category to "Server"

**Expected Result:**
- ✅ Specifications shows:
  - Processor
  - CPU Count (number input)
  - RAM
  - Storage Capacity
  - RAID Configuration
  - Operating System
  - OS Version
  - IP Address
  - Rack Location
- ✅ Assignment section is empty (no employee or location field)

**Status:** ⬜ Not Tested

---

### Test 7: Form Submission - Laptop
**Steps:**
1. Select "Laptop" category
2. Fill in required fields:
   - Brand Name: "Dell"
   - Model Name: "Latitude 5540"
   - Serial Number: "TEST-LAPTOP-001"
   - Status: "Available"
3. Fill optional fields:
   - Processor: "Intel Core i7-12th Gen"
   - RAM: "16GB"
   - Storage Type: "SSD"
   - Storage Capacity: "512GB"
   - OS: "Windows 11"
   - OS Version: "22H2"
   - Screen Size: "15.6 inches"
4. Click "Add to Inventory"

**Expected Result:**
- ✅ Success message appears
- ✅ Redirected to Assets list
- ✅ New laptop appears in list with all fields saved
- ✅ Can view/edit asset and see all field values preserved

**Status:** ⬜ Not Tested

---

### Test 8: Form Submission - Phone
**Steps:**
1. Select "Phone" category
2. Fill required fields:
   - Brand Name: "Samsung"
   - Model Name: "Galaxy S23"
   - Serial Number: "TEST-PHONE-001"
   - Status: "Available"
3. Fill phone-specific fields:
   - IMEI 1: "123456789012345"
   - IMEI 2: "543210987654321"
   - RAM: "8GB"
   - Storage Capacity: "256GB"
   - OS: "Android"
   - OS Version: "14"
   - Mobile Number: "+91 9876543210"
4. Click "Add to Inventory"

**Expected Result:**
- ✅ Phone saved successfully with IMEI numbers
- ✅ Mobile number saved correctly
- ✅ No laptop fields in database for this asset

**Status:** ⬜ Not Tested

---

### Test 9: Field Validation
**Steps:**
1. Select "Monitor" category
2. Leave required fields empty
3. Try to submit form

**Expected Result:**
- ✅ Validation errors appear for required fields
- ✅ Required fields marked with red asterisk (*)
- ✅ Form does not submit until required fields filled

**Status:** ⬜ Not Tested

---

### Test 10: Category Change Clears Data
**Steps:**
1. Select "Laptop"
2. Fill some fields (e.g., Processor: "Intel i7", RAM: "16GB")
3. Change category to "Phone"
4. Change back to "Laptop"

**Expected Result:**
- ✅ When switching categories, category-specific fields are cleared
- ✅ Basic fields (Serial Number, Model Name) are preserved
- ✅ Previous values not carried over between incompatible categories

**Status:** ⬜ Not Tested

---

## 🔧 Troubleshooting Tests

### Test 11: Backend API Check
**Steps:**
```bash
curl http://192.168.20.180:5000/api/health
```

**Expected Result:**
```json
{"status": "healthy"}
```

**Status:** ⬜ Not Tested

---

### Test 12: Database Schema Verification
**Steps:**
```bash
sqlite3 assets.db ".schema assets" | grep -E "(brand_name|processor|imei_1|imei_2)"
```

**Expected Result:**
- Should show all new field columns
- Example: `brand_name TEXT, processor TEXT, imei_1 TEXT, imei_2 TEXT`

**Status:** ⬜ Not Tested

---

### Test 13: Browser Console Check
**Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to Add Asset page
4. Select a category

**Expected Result:**
- ✅ No JavaScript errors in console
- ✅ No network errors (404, 500)
- ✅ Category change triggers form update

**Status:** ⬜ Not Tested

---

## 📊 Test Summary

| Test | Status | Notes |
|------|--------|-------|
| Category Dropdown | ⬜ Not Tested | |
| Laptop Fields | ⬜ Not Tested | |
| Phone Fields | ⬜ Not Tested | |
| Printer Fields | ⬜ Not Tested | |
| Laptop Bag (No Serial) | ⬜ Not Tested | |
| Server (No Assignment) | ⬜ Not Tested | |
| Laptop Submission | ⬜ Not Tested | |
| Phone Submission | ⬜ Not Tested | |
| Field Validation | ⬜ Not Tested | |
| Category Change | ⬜ Not Tested | |
| Backend API | ⬜ Not Tested | |
| Database Schema | ⬜ Not Tested | |
| Browser Console | ⬜ Not Tested | |

---

## 🎯 Quick Start Testing

**Fastest way to verify it's working:**

1. Open: http://192.168.20.180:3000/assets
2. Click: "Add Asset" button
3. Click: "New Device" tab
4. Select: "Laptop" from dropdown
5. **Look for**: Processor, RAM, Screen Size fields appearing
6. Change to: "Phone"
7. **Look for**: IMEI 1, IMEI 2 fields appearing, Processor field disappearing

**If you see fields changing → ✅ IT WORKS!**

---

## 📝 Report Issues

If any test fails, note:
1. Which test failed
2. What you expected to see
3. What actually happened
4. Any error messages in browser console (F12)
5. Any error messages in backend logs

---

## ✅ Sign-Off

Tester: ________________
Date: ________________
Overall Status: ⬜ Pass | ⬜ Fail | ⬜ Partial

Notes:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
