# Invoice File Corruption - Debug Guide

## Issue
Downloaded invoice files are corrupted and cannot be opened.
Ubuntu Image Viewer shows: "Could not load image - Unrecognized image file format"

## Comprehensive Logging Added

### Upload Logging (`utils/file_upload.py`)

When a file is uploaded, the backend now logs:
- Original filename and content type
- File size (original vs saved)
- File type detection using `file` command
- First 16 bytes in hexadecimal
- Signature verification (PNG/PDF/JPEG)

### Download Logging (`api_server.py`)

When a file is downloaded, the backend now logs:
- Requested filename
- File path and existence
- File size
- File type detection
- First 16 bytes in hexadecimal
- Signature verification
- Response headers

## Testing Instructions

### Step 1: Upload an Invoice

1. Go to: http://localhost:3000
2. Navigate to: Assets → Edit any asset
3. Scroll to "Invoice Attachment" section
4. Upload a PNG/PDF/JPG file
5. **Check Backend Terminal** for upload logs

### Step 2: Check Backend Upload Logs

Look for output like:

```
[UPLOAD] Original filename: Tectoro.png
[UPLOAD] Content type: image/png
[UPLOAD] Original file size: 12345 bytes (12.06 KB)
[UPLOAD] Unique filename: 20260806_150530_Tectoro.png
[UPLOAD] Saving to: uploads/invoices/20260806_150530_Tectoro.png
[UPLOAD] File saved successfully!
[UPLOAD] Saved file size: 12345 bytes (12.06 KB)
[UPLOAD] Size match: True
[UPLOAD] File type detection: uploads/invoices/20260806_150530_Tectoro.png: PNG image data, 1200 x 800, 8-bit/color RGBA, non-interlaced
[UPLOAD] First 16 bytes (hex): 89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48 44 52
[UPLOAD] ✅ Valid PNG signature detected
```

**What to Look For:**

✅ **Size match: True** - File saved correctly
✅ **Valid PNG/PDF/JPEG signature** - File is not corrupted
✅ **File type detection shows correct format** - Binary data preserved

⚠️ **WARNING Signs:**
- `Size match: False` - Upload is corrupting data
- `Invalid signature!` - File header is wrong
- `File type detection: ASCII text` or `JSON` or `data` - File saved as text
- First bytes are `7B` (JSON), `3C` (HTML), or `22` (text) - Wrong encoding

### Step 3: Verify Saved File Directly

Open terminal and run:

```bash
cd /home/administrator/Desktop/asset-management

# List uploaded files
ls -lh uploads/invoices/

# Check file type
file uploads/invoices/20260806_150530_Tectoro.png

# Check first bytes
xxd -l 32 uploads/invoices/20260806_150530_Tectoro.png
```

**Expected for PNG:**
```
89 50 4e 47 0d 0a 1a 0a  ...(PNG signature)
```

**Expected for PDF:**
```
25 50 44 46  (%PDF)
```

**Expected for JPEG:**
```
ff d8 ff  (JPEG signature)
```

**If you see:**
- `7b` - File is JSON
- `3c` - File is HTML
- `22` - File is text

Then the upload is saving text instead of binary.

### Step 4: Try Opening File Locally

```bash
# For PNG/JPG
eog uploads/invoices/20260806_150530_Tectoro.png

# For PDF
evince uploads/invoices/20260806_150530_Tectoro.pdf
```

**If file doesn't open locally**, the upload is broken.
**If file opens locally**, the download endpoint is broken.

### Step 5: Download via API

1. In the UI, click "View" or "Download" on the invoice
2. **Check Backend Terminal** for download logs

Look for:

```
[DOWNLOAD] ========== Invoice Download Request ==========
[DOWNLOAD] Requested filename: 20260806_150530_Tectoro.png
[DOWNLOAD] Secured filename: 20260806_150530_Tectoro.png
[DOWNLOAD] Full path: /home/administrator/Desktop/asset-management/uploads/invoices/20260806_150530_Tectoro.png
[DOWNLOAD] File exists: True
[DOWNLOAD] File size: 12345 bytes (12.06 KB)
[DOWNLOAD] File type: uploads/invoices/20260806_150530_Tectoro.png: PNG image data, 1200 x 800, 8-bit/color RGBA, non-interlaced
[DOWNLOAD] First 16 bytes (hex): 89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48 44 52
[DOWNLOAD] ✅ Valid PNG signature
[DOWNLOAD] Download mode: False
[DOWNLOAD] Serving file using send_from_directory...
[DOWNLOAD] Response headers: {'Content-Type': 'image/png', 'Content-Length': '12345', ...}
[DOWNLOAD] Content-Length: 12345
[DOWNLOAD] ✅ File served successfully
```

**What to Look For:**

✅ **Valid signature before serving** - File is correct on server
✅ **Content-Type matches file type** - Correct MIME type
✅ **Content-Length matches file size** - Full file being sent

⚠️ **WARNING Signs:**
- Invalid signature before serving - File corrupted on disk
- Content-Type is wrong (e.g., text/plain for image)
- Content-Length is 0 or very small

### Step 6: Compare File Hashes

```bash
cd /home/administrator/Desktop/asset-management

# Original file hash (if you still have it)
sha256sum /path/to/original.png

# Saved file hash
sha256sum uploads/invoices/20260806_150530_Tectoro.png

# Downloaded file hash (from browser Downloads)
sha256sum ~/Downloads/20260806_150530_Tectoro.png
```

**All three hashes MUST match exactly.**

If hashes don't match:
- Original ≠ Saved → Upload is corrupting
- Saved ≠ Downloaded → Download is corrupting

### Step 7: Check Browser Network Tab

1. Open DevTools (F12) → Network tab
2. Download the invoice
3. Find the request to `/api/assets/invoice/...`
4. Click on it → Headers tab

Check:
- **Response Headers:**
  - `Content-Type`: Should be `image/png`, `image/jpeg`, or `application/pdf`
  - `Content-Length`: Should match file size
  - `Content-Disposition`: Check if present

- **Preview Tab:**
  - For images: Should show the image
  - For PDFs: Should show PDF viewer

If Preview shows JSON or error, the response is wrong.

## Common Issues & Solutions

### Issue 1: File Saved as Text

**Symptoms:**
- `file` command shows: "ASCII text"
- First bytes are `22` or `7B` or `3C`
- File doesn't open

**Cause:** Upload code opening file in text mode

**Solution:** Verify `file_obj.save()` is used (handles binary automatically)

### Issue 2: File Size Mismatch

**Symptoms:**
- Original size ≠ Saved size
- Saved file is larger or smaller

**Cause:** Encoding conversion during save

**Solution:** Ensure binary mode throughout

### Issue 3: Wrong MIME Type

**Symptoms:**
- Browser tries to open PNG as text
- Content-Type header is wrong

**Cause:** `send_from_directory()` misconfigured

**Solution:** Let Flask auto-detect MIME type (don't force wrong type)

### Issue 4: File Opened Locally But Not in Browser

**Symptoms:**
- `eog uploads/invoices/file.png` works
- Browser shows corrupted image

**Cause:** Download endpoint issue or browser cache

**Solution:**
1. Clear browser cache
2. Check Network tab for correct Content-Type
3. Verify `send_from_directory()` is used

## Diagnostic Checklist

| Check | Command | Expected | If Failed |
|-------|---------|----------|-----------|
| Upload logs show correct size | Check terminal | Size match: True | Upload corrupting |
| Upload logs show valid signature | Check terminal | ✅ Valid PNG signature | Wrong encoding |
| File opens locally | `eog uploads/invoices/file.png` | Opens correctly | Upload broken |
| File command shows correct type | `file uploads/invoices/file.png` | PNG image data | Saved as text |
| First bytes are correct | `xxd -l 8 uploads/invoices/file.png` | 89 50 4e 47... | Wrong signature |
| Download logs show valid signature | Check terminal | ✅ Valid PNG signature | File corrupted on disk |
| Response Content-Type is correct | Browser DevTools | image/png | Wrong MIME type |
| Preview shows image | Browser DevTools | Shows image | Response broken |
| Downloaded file opens | Open from Downloads | Opens correctly | Download corrupting |
| Hashes match | `sha256sum` | All equal | Data corruption |

## Files Modified

1. **`utils/file_upload.py`** - Added comprehensive upload logging
2. **`api_server.py`** - Added comprehensive download logging

## Status

✅ Comprehensive logging added to upload process  
✅ Comprehensive logging added to download process  
✅ File signature verification on upload  
✅ File signature verification on download  
✅ Backend restarted  
✅ **READY FOR TESTING WITH FULL TRACEABILITY**  

## Next Steps

1. Upload an invoice file (PNG/PDF/JPG)
2. Check backend terminal for upload logs
3. Verify file locally: `eog uploads/invoices/filename.png`
4. Download via browser
5. Check backend terminal for download logs
6. Try opening downloaded file
7. **Share all logs if file is still corrupted**

The logs will show exactly where the corruption occurs (upload vs download) and what the file signatures look like at each step.
