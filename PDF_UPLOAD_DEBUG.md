# PDF Upload Corruption - Critical Issue Found

## Issue Discovered

**CRITICAL:** The uploaded "PDF" file is actually HTML - the React app's index.html!

```bash
$ file uploads/invoices/20260806_174224_Assignment_Form_65_Apple_aaa_2.pdf
uploads/invoices/20260806_174224_Assignment_Form_65_Apple_aaa_2.pdf: HTML document, ASCII text

$ xxd -l 64 uploads/invoices/20260806_174224_Assignment_Form_65_Apple_aaa_2.pdf
00000000: 3c21 444f 4354 5950 4520 6874 6d6c 3e0a  <!DOCTYPE html>.
00000010: 3c68 746d 6c20 6c61 6e67 3d22 656e 223e  <html lang="en">
```

First bytes are `3c 21` (`<!`) instead of `25 50 44 46` (`%PDF`).

## Root Cause

The frontend is receiving HTML (React app or error page) instead of the actual PDF file when uploading.

**This means:**
1. User selects a valid PDF file
2. Frontend sends it via multipart/form-data
3. Something goes wrong (routing error, authentication, etc.)
4. Server returns HTML (404 page, React app, or error)
5. **Frontend treats that HTML response as if it were the file data**
6. HTML gets saved to disk as "invoice.pdf"

## Enhanced Logging Added

### Upload Process (`utils/file_upload.py`)

Now logs:
- File object type and stream info
- **First 64 bytes of received data (before save)**
- Hex dump and ASCII representation
- HTML detection in upload stream
- PDF signature verification **before save**
- Comparison of upload stream vs saved file

**Critical New Checks:**
```python
# Check if frontend sent HTML instead of file
if first_bytes[:15] == b'<!DOCTYPE html>':
    print(f"[UPLOAD] ⚠️  CRITICAL ERROR: Received HTML instead of file!")
    return False, "Received HTML instead of binary file data", None
```

## Testing Instructions

### Step 1: Try Uploading a PDF

1. Go to: http://localhost:3000
2. Edit any asset
3. Upload a PDF file
4. **Watch backend terminal carefully**

### Step 2: Check Upload Logs

Look for:

```
================================================================================
[UPLOAD] ========== FILE UPLOAD DEBUG ==========
[UPLOAD] Original filename: test.pdf
[UPLOAD] Content type: application/pdf
[UPLOAD] File object type: <class 'werkzeug.datastructures.FileStorage'>
[UPLOAD] Has stream: True
[UPLOAD] First 32 bytes (hex): 25 50 44 46 2d 31 2e 34 0a 25 c3 a4 ...
[UPLOAD] First 64 bytes (ASCII): %PDF-1.4.%....
[UPLOAD] ✅ Valid PDF signature detected in upload stream
================================================================================
```

**If you see HTML:**
```
[UPLOAD] First 32 bytes (hex): 3c 21 44 4f 43 54 59 50 45 20 68 74 6d 6c 3e ...
[UPLOAD] First 64 bytes (ASCII): <!DOCTYPE html>.<html lang="en">.  <head>.    <m
[UPLOAD] ⚠️  CRITICAL ERROR: Received HTML instead of file!
[UPLOAD] This means the frontend is sending HTML, not the actual file.
```

**This means the problem is in the FRONTEND, not the backend!**

### Step 3: Check Browser Network Tab

1. Open DevTools (F12) → Network tab
2. Upload a PDF
3. Find the PUT/POST request to `/api/assets/...`
4. Click on it → Request tab → Form Data

**Check:**
- Is `invoice_attachment` a File object?
- Or is it a string/text?

**If it's a File object:**
- Click on it to see the preview
- It should say "Binary file"
- NOT "<!DOCTYPE html>"

### Step 4: Check Browser Console

Look for errors like:
- Failed to upload
- Network error
- 404 Not Found
- Authentication failed

The frontend might be:
1. Receiving an error response
2. Mistaking that error for the file content
3. Sending that error as the "file"

### Step 5: Verify Frontend Upload Code

The issue might be in how the frontend handles the file input:

**Check:** `AssetEdit.js` or `AssetAdd.js` file handling

Look for:
```javascript
const handleFileChange = (e) => {
  const file = e.target.files[0];
  setInvoiceFile(file);  // Should be the File object
};
```

**Make sure it's NOT:**
```javascript
// WRONG!
const text = await file.text();  // Converting to text
setInvoiceFile(text);  // Sending text instead of File
```

## Possible Root Causes

### Cause 1: Frontend Sending Wrong Data

Frontend code might be:
- Reading file as text: `await file.text()`
- Converting to base64: `btoa(file)`
- Sending file content as string instead of File object

**Fix:** Ensure FormData receives the actual File object:
```javascript
const formData = new FormData();
formData.append('invoice_attachment', file);  // file must be File object
```

### Cause 2: CORS or Proxy Issue

If frontend is on different port or domain:
- Request might be redirected
- Proxy might be stripping multipart data
- Getting HTML instead of API response

**Fix:** Check proxy configuration in package.json

### Cause 3: Authentication Failure

If auth token is missing or invalid:
- Backend returns 401 HTML page
- Frontend doesn't check response status
- Treats HTML as uploaded file

**Fix:** Check response status before treating as success

### Cause 4: Wrong Content-Type Header

If Axios sets wrong Content-Type:
- Server might not parse multipart correctly
- Returns error as HTML
- Frontend saves HTML

**Fix:** Ensure `Content-Type: multipart/form-data` is set

## Quick Diagnostic

Run this in browser console after clicking upload:

```javascript
const input = document.querySelector('input[type="file"]');
const file = input.files[0];

console.log('File object:', file);
console.log('File name:', file.name);
console.log('File size:', file.size);
console.log('File type:', file.type);
console.log('Is File:', file instanceof File);

// Read first bytes
const reader = new FileReader();
reader.onload = (e) => {
  const arr = new Uint8Array(e.target.result);
  console.log('First 16 bytes:', Array.from(arr.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '));
  
  // Check if PDF
  const text = new TextDecoder().decode(arr.slice(0, 64));
  console.log('First 64 chars:', text);
  
  if (text.startsWith('<!DOCTYPE')) {
    console.error('❌ File contains HTML, not PDF!');
  } else if (text.startsWith('%PDF')) {
    console.log('✅ Valid PDF');
  }
};
reader.readAsArrayBuffer(file.slice(0, 64));
```

This will show if the File object itself contains HTML or PDF.

## Files Modified

1. **`utils/file_upload.py`** - Added comprehensive upload stream logging
2. **`api_server.py`** - Already has download logging

## Status

✅ Enhanced logging to detect HTML in upload stream  
✅ Backend restarted  
✅ **READY FOR TESTING**  

## Next Steps

1. **Upload a PDF file**
2. **Check backend logs immediately**
3. **If logs show HTML in upload stream:**
   - Problem is FRONTEND sending wrong data
   - Check browser console and Network tab
   - Share frontend code that handles file selection
4. **If logs show valid PDF in upload stream but HTML in saved file:**
   - Problem is in save process (unlikely with werkzeug)
   - Need to investigate file_obj.save() behavior
5. **Share:**
   - Complete backend upload logs
   - Browser Network tab screenshot
   - Browser Console logs
   - Frontend file handling code

The enhanced logging will pinpoint exactly where the PDF becomes HTML.
