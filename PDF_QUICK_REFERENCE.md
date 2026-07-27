# Asset Assignment PDF - Quick Reference Guide

## How to Use

### Option 1: Single Asset PDF

**Method A: Download**
1. Go to **Assets** page
2. Click **View Details** for any asset
3. Click **"Download Assignment Form"** button (green)
4. PDF downloads to your computer

**Method B: Print**
1. Go to **Assets** page
2. Click **View Details** for any asset
3. Click **"Print Assignment Form"** button (blue)
4. Browser print dialog opens
5. Choose printer or "Save as PDF"

### Option 2: Bulk PDF Download

1. Go to **Asset Import** page
2. Import assets using Excel template
3. After successful import, click **"Download Assignment Forms (Bulk)"**
4. ZIP file downloads containing individual PDFs for all imported assets

---

## What's in the PDF?

### Sections Included:
- ✅ **Company Name:** Tectoro
- ✅ **Asset Information** - Asset ID, Name, Category, Serial Number, Model, RAM, Storage, OS, Charger S/N
- ✅ **Employee Information** - Employee ID, Name, Department, Mobile, Email, Location
- ✅ **Assignment Details** - Assignment Date, Issued By
- ✅ **Signatures** - Employee Signature, Authorized Signature with date fields

### What's NOT Included:
- ❌ Status
- ❌ Processor
- ❌ Invoice Date
- ❌ Invoice Number
- ❌ Warranty Date
- ❌ Terms & Conditions
- ❌ Acknowledgment section

---

## Technical Details

**PDF Format:**
- Single page (A4)
- Professional layout
- ~2.7KB per asset
- PDF 1.4 format

**File Naming:**
- Single: `Assignment_Form_{AssetID}_{AssetName}.pdf`
- Bulk: `Assignment_Forms_{timestamp}.zip`

**Browser Support:**
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari

---

## Troubleshooting

### PDF is blank or not downloading
1. Hard refresh browser: **Ctrl + Shift + R** (Windows/Linux) or **Cmd + Shift + R** (Mac)
2. Check backend is running on port 5000
3. Check browser console for errors (F12)
4. Try a different asset

### Print not working
1. Ensure popup blocker is disabled
2. Try "Download" instead, then print the downloaded PDF
3. Check browser print settings

### Bulk download not working
1. Ensure you imported assets successfully first
2. Check that asset IDs were returned after import
3. Try downloading single PDFs instead

---

## Quick Test

Run this test to verify everything works:

```bash
cd /home/administrator/Desktop/asset-management
source venv/bin/activate
python3 test_pdf_system_complete.py
```

Expected output: `✅ ALL TESTS PASSED`

---

## URLs

- **Application:** http://192.168.20.180:3000
- **Backend API:** http://192.168.20.180:5000/api
- **Login:** admin / admin123

---

## Key Files

- **PDF Template:** `services/pdf_generator.py`
- **API Endpoints:** `api_server.py` (lines 2253-2450)
- **Frontend (Single):** `frontend/src/pages/AssetEdit.js`
- **Frontend (Bulk):** `frontend/src/pages/AssetImport.js`

---

**Last Updated:** July 24, 2026  
**Status:** Production Ready ✅
