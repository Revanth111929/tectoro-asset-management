# 🧪 UAT Bug #001 - Testing Guide

**Bug:** Invoice Attachment Missing in Inventory Workflow  
**Status:** ✅ Fixed - Ready for Your Testing  
**Version:** 2.0.0-uat

---

## ⚡ QUICK TEST (2 minutes)

### Test the Fix Right Now:

1. **Open your browser** → http://192.168.20.180:3000

2. **Navigate:** Assets → Add Asset → **New Device** tab

3. **Fill minimal required fields:**
   - Category: **Laptop**
   - Brand: **Dell**
   - Model: **Latitude 5420**
   - Serial Number: **TEST-INV-001**

4. **Scroll down to "Invoice Attachment" section** (NEW!)

5. **Click file input** → Select any PDF, JPG, or Excel file (max 10MB)

6. **Verify:**
   - ✅ File preview shows filename and size
   - ✅ You can see a "Remove" button

7. **Click "Add to Inventory"**

8. **Go to:** Inventory → All Devices → Click on your new device

9. **Scroll to "Invoice Attachment" section**

10. **Verify:**
    - ✅ Invoice shows with filename and size
    - ✅ "View" button opens invoice in new tab
    - ✅ "Download" button downloads the file

---

## 📋 COMPLETE TEST SUITE (10 minutes)

### Test 1: Upload PDF Invoice
**Steps:**
1. Add New Device → Laptop
2. Upload a **PDF invoice** (e.g., purchase invoice)
3. Save device
4. Open Inventory Details
5. Click "View" → Verify PDF opens in browser
6. Click "Download" → Verify PDF downloads

**Expected:** ✅ PDF uploads, views, and downloads correctly

---

### Test 2: Upload Image Invoice (JPG/PNG)
**Steps:**
1. Add New Device → Monitor
2. Upload a **JPG or PNG image** (e.g., scanned invoice)
3. Save device
4. View invoice from Inventory Details

**Expected:** ✅ Image uploads and displays correctly

---

### Test 3: Upload Excel Invoice
**Steps:**
1. Add New Device → CPU
2. Upload an **Excel file** (.xls or .xlsx)
3. Save and view invoice

**Expected:** ✅ Excel file uploads and downloads correctly

---

### Test 4: Upload Word Invoice
**Steps:**
1. Add New Device → Printer
2. Upload a **Word document** (.doc or .docx)
3. Save and verify

**Expected:** ✅ Word file uploads successfully

---

### Test 5: File Too Large (>10MB)
**Steps:**
1. Add New Device
2. Try to upload a file **larger than 10MB**

**Expected:** ✅ Alert appears: "File size exceeds 10MB limit"

---

### Test 6: Wrong File Type
**Steps:**
1. Add New Device
2. Try to select a **.txt or .zip file**

**Expected:** ✅ File picker filters out unsupported types

---

### Test 7: Create Device WITHOUT Invoice (Optional)
**Steps:**
1. Add New Device
2. **Skip** the Invoice Attachment section
3. Save device
4. Open Inventory Details

**Expected:** 
- ✅ Device creates successfully
- ✅ Inventory Details shows "No invoice uploaded"

---

### Test 8: Remove Invoice Before Saving
**Steps:**
1. Add New Device
2. Select invoice file
3. Click **"Remove"** button
4. Verify file cleared
5. Save device without invoice

**Expected:** ✅ Device saves without invoice (no errors)

---

### Test 9: Verify Existing Device Form Unaffected
**Steps:**
1. Go to Add Asset → **Existing Device** tab
2. Verify invoice upload section **NOT shown**
3. Test assigning existing device to employee

**Expected:** ✅ Existing Device workflow unchanged

---

### Test 10: Delete Device with Invoice
**Steps:**
1. Create device with invoice
2. Delete the device
3. Verify invoice no longer accessible

**Expected:** ✅ Invoice deleted along with device

---

## ✅ ACCEPTANCE CRITERIA

The fix is **APPROVED** if:

- ✅ You can upload invoice when creating New Device
- ✅ All supported formats work (PDF, DOC, DOCX, XLS, XLSX, JPG, PNG)
- ✅ File size validation works (max 10MB)
- ✅ Invoice appears in Inventory Details page
- ✅ View and Download buttons work correctly
- ✅ Creating device without invoice still works (optional field)
- ✅ No errors or regressions in other forms

---

## 🔴 REJECT THE FIX IF:

- ❌ Upload fails with valid file types
- ❌ View or Download doesn't work
- ❌ File size validation broken
- ❌ Crashes or errors during upload
- ❌ Existing Device form broken
- ❌ Other inventory operations affected

---

## 📸 WHAT TO LOOK FOR

### Invoice Upload Section (New Device Form)
You should see:
```
┌─────────────────────────────────────────────┐
│ 📎 Invoice Attachment (Optional)            │
├─────────────────────────────────────────────┤
│ 📄 Upload Invoice                           │
│ [Choose File] No file chosen                │
│ Supported formats: PDF, DOC, DOCX, XLS,     │
│ XLSX, JPG, JPEG, PNG (Max 10MB)            │
└─────────────────────────────────────────────┘
```

### After Selecting File:
```
┌─────────────────────────────────────────────┐
│ ✅ invoice-12345.pdf  [1.2 MB]  [Remove]   │
└─────────────────────────────────────────────┘
```

### Inventory Details Page (With Invoice):
```
┌─────────────────────────────────────────────┐
│ 📎 Invoice Attachment                       │
├─────────────────────────────────────────────┤
│ 📄 invoice-12345.pdf                        │
│ 1.2 MB • Uploaded Jan 15, 2024             │
│ [View] [Download]                           │
└─────────────────────────────────────────────┘
```

### Inventory Details Page (Without Invoice):
```
┌─────────────────────────────────────────────┐
│ 📎 Invoice Attachment                       │
├─────────────────────────────────────────────┤
│ No invoice uploaded.                        │
└─────────────────────────────────────────────┘
```

---

## 🎯 TESTING PRIORITIES

**MUST TEST (Critical):**
1. ✅ Upload PDF invoice
2. ✅ View invoice from Inventory Details
3. ✅ Download invoice
4. ✅ Create device without invoice (optional)

**SHOULD TEST (Important):**
5. ✅ Upload JPG/PNG invoice
6. ✅ Upload Excel invoice
7. ✅ File size validation (>10MB rejected)

**NICE TO TEST (Edge Cases):**
8. ✅ Remove selected invoice before submit
9. ✅ Verify Existing Device form unchanged
10. ✅ Delete device with invoice

---

## 🐛 HOW TO REPORT ISSUES

If you find any problems, report them like this:

```
Bug Title: Invoice upload fails with PDF files

Steps to Reproduce:
1. Add New Device → Laptop
2. Select PDF file (2MB)
3. Click "Add to Inventory"

Expected: Device created with invoice
Actual: Error message "Failed to upload invoice"

Screenshot: [Attach if possible]
```

---

## ✅ APPROVAL

After testing, please confirm:

**Option 1: APPROVED** ✅
> "Invoice upload works perfectly. All tests passed. Approved for production."

**Option 2: NEEDS FIX** ❌
> "Issue found: [Describe the problem]. Please fix."

---

## 📞 SUPPORT

If you need help testing:
1. Check `UAT_BUG_001_FIX_REPORT.md` for technical details
2. Ask Kiro for clarification or assistance
3. Kiro will fix any issues immediately during UAT

---

**Ready for Your Testing!** 🧪

Test URL: http://192.168.20.180:3000  
Login: Your admin credentials  
Expected Test Time: 5-10 minutes
