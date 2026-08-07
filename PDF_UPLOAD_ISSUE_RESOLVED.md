# PDF Upload Issue - Root Cause Found

## Issue Discovered

The "PDF" file being uploaded **IS ACTUALLY AN HTML FILE** that was renamed to `.pdf`.

### Evidence from Backend Logs:

```
[UPLOAD] Original filename: Assignment_Form_65_Apple_aaa (2).pdf
[UPLOAD] Content type: application/pdf  ← Browser thinks it's PDF
[UPLOAD] First 32 bytes (hex): 3c 21 44 4f 43 54 59 50 45 20 68 74 6d 6c 3e 0a...
[UPLOAD] First 64 bytes (ASCII): <!DOCTYPE html>.<html lang="en">.  <head>...
```

**First bytes:** `3c 21` = `<!` (HTML document)  
**Expected for PDF:** `25 50 44 46` = `%PDF`

### Comparison with Working PNG Upload:

```
[UPLOAD] Original filename: Screenshot_from_2026-08-06_17-42-39.png
[UPLOAD] Content type: image/png
[UPLOAD] First 32 bytes (hex): 89 50 4e 47 0d 0a 1a 0a...  ← Correct PNG signature
[UPLOAD] ✅ Valid PNG signature detected
```

## Root Cause

The user is uploading a file that:
1. Has a `.pdf` extension
2. Browser reports MIME type as `application/pdf`
3. **BUT the actual file content is HTML**

This happens when:
- User downloads a webpage/HTML file from browser
- Browser saves it with `.pdf` extension
- Or user renames an HTML file to `.pdf`
- The file itself contains `<!DOCTYPE html>...`

## Backend Behavior

The backend is **working correctly** by:
1. Reading the actual file content
2. Detecting HTML signature instead of PDF signature
3. Rejecting the invalid file

**This is not a bug - it's proper validation!**

## Solution

### For Users:

**The uploaded file is not a valid PDF.** To fix:

1. **Verify the source file:**
   - Open the PDF file locally with a PDF reader (not browser)
   - If it shows HTML or opens in a text editor, it's not a real PDF

2. **Re-download or recreate the PDF:**
   - If downloaded from a website, ensure you're downloading the actual PDF, not an HTML page
   - Look for "Download PDF" button, not "View PDF" link
   - Right-click → "Save Link As" might download HTML instead of PDF

3. **Check file properties:**
   ```bash
   file Assignment_Form.pdf
   ```
   Should say: `PDF document, version X.X`
   If it says: `HTML document` or `ASCII text`, it's not a PDF

4. **Verify first bytes:**
   ```bash
   xxd -l 16 Assignment_Form.pdf
   ```
   Should start with: `25 50 44 46` (%PDF)
   If it starts with: `3c 21` or `3c 68`, it's HTML

### Improved Error Message

Changed error from:
```
"Received HTML instead of binary file data"
```

To:
```
"Invalid file: The uploaded file appears to be an HTML document, not a valid PDF file. 
Please ensure you're uploading the actual file, not an HTML page."
```

## Testing Valid PDF Upload

To test with a real PDF:

1. **Create a test PDF:**
   ```bash
   echo "%PDF-1.4
   1 0 obj
   << /Type /Catalog /Pages 2 0 R >>
   endobj
   2 0 obj
   << /Type /Pages /Kids [3 0 R] /Count 1 >>
   endobj
   3 0 obj
   << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>
   endobj
   4 0 obj
   << /Length 44 >>
   stream
   BT
   /F1 24 Tf
   100 700 Td
   (Test PDF) Tj
   ET
   endstream
   endobj
   xref
   0 5
   0000000000 65535 f
   0000000009 00000 n
   0000000056 00000 n
   0000000115 00000 n
   0000000322 00000 n
   trailer
   << /Size 5 /Root 1 0 R >>
   startxref
   415
   %%EOF" > test.pdf
   ```

2. **Verify it's valid:**
   ```bash
   file test.pdf
   # Should output: PDF document, version 1.4
   
   xxd -l 16 test.pdf
   # Should start with: 25 50 44 46
   ```

3. **Upload this PDF via the UI**

4. **Check logs:**
   ```
   [UPLOAD] Original filename: test.pdf
   [UPLOAD] Content type: application/pdf
   [UPLOAD] First 32 bytes (hex): 25 50 44 46 2d 31 2e 34...
   [UPLOAD] First 64 bytes (ASCII): %PDF-1.4.1 0 obj.<< /Type /Catalog /Pages 2 0 R >>...
   [UPLOAD] ✅ Valid PDF signature detected in upload stream
   ```

## Files Modified

1. **`utils/file_upload.py`**
   - Added comprehensive validation logging
   - Improved error messages for HTML detection
   - Added file extension validation logging

## Status

✅ Root cause identified: User uploading HTML file renamed as PDF  
✅ Backend validation working correctly  
✅ Improved error messages  
✅ Added diagnostic logging  

## Next Steps

1. **Ask user to verify their PDF file:**
   - Open it locally with PDF reader
   - Check if it's actually a PDF or HTML
   - Re-download from original source if needed

2. **Test with valid PDF:**
   - Use a known-good PDF file
   - Or create test PDF using script above
   - Upload should succeed with proper PDF

3. **If user confirms file is valid PDF locally:**
   - Share the actual PDF file for inspection
   - There might be a proxy/gateway issue corrupting files in transit
   - But logs show HTML is in the upload stream, so unlikely

## How to Identify HTML Disguised as PDF

**Visual check:**
- Open file in text editor
- If you see `<!DOCTYPE html>` or `<html>`, it's HTML

**Command line:**
```bash
# Check file type
file yourfile.pdf

# View first line
head -n 1 yourfile.pdf

# Check hex signature
xxd -l 8 yourfile.pdf
```

**Valid PDF:** Starts with `%PDF`  
**HTML file:** Starts with `<!DOCTYPE` or `<html>`

## Conclusion

The upload system is **working as designed**. The issue is with the source file being HTML instead of PDF. The backend correctly detects and rejects invalid files.

**Action required:** User needs to obtain a valid PDF file, not an HTML page renamed to .pdf.
