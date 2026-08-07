# 🐛 BUG REPORT #001 - Invoice Metadata Display

**Date:** August 4, 2026  
**Severity:** Medium  
**Status:** ✅ FIXED

---

## Expected Behaviour

When viewing Inventory Detail after uploading an invoice, should display:
- Filename: "invoice.pdf"
- File size: "0.52 MB"
- Upload date: "Uploaded 8/4/2026"

---

## Actual Behaviour

All metadata shows but upload date appears as:
- "Uploaded Invalid Date" or doesn't show at all

---

## Root Cause

**Field name mismatch between backend and frontend:**

**Backend** (`models.py` - InvoiceAttachment.to_dict()):
```python
def to_dict(self):
    return {
        'uploaded_at': utc_iso(self.upload_date),  # ← Returns 'uploaded_at'
        ...
    }
```

**Frontend** (`InventoryDetail.js` line 374):
```javascript
{invoice.upload_date && ` • Uploaded ...`}  // ← Looking for 'upload_date'
```

---

## Files Changed

### ✅ `frontend/src/pages/InventoryDetail.js`
**Line 374:**
```javascript
// BEFORE
{invoice.upload_date && ` • Uploaded ${new Date(invoice.upload_date).toLocaleDateString()}`}

// AFTER  
{invoice.uploaded_at && ` • Uploaded ${new Date(invoice.uploaded_at).toLocaleDateString()}`}
```

---

## Fix Applied

- ✅ Changed `invoice.upload_date` → `invoice.uploaded_at`
- ✅ Frontend rebuilt successfully
- ✅ Bundle size: 389.19 kB (+4 B)

---

## Regression Test

**Test Steps:**
1. Add Device → Upload invoice
2. Save
3. Open Inventory Detail
4. Verify invoice section shows:
   - ✓ Filename
   - ✓ File size
   - ✓ Upload date (correct format)

**Status:** ⏳ Awaiting manual UI verification

---

## Related Issues

None - This was an isolated field name mismatch

---

**Fixed By:** Kiro AI  
**Build:** frontend/build - August 4, 2026
