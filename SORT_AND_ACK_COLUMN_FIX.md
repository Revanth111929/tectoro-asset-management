# Sort & Acknowledgment Column Fix

**Date**: June 15, 2026  
**Status**: ✅ Fixed

---

## Issues Fixed

### 1. Default Sort Order
**Problem**: Assets were sorted by EMP ID (A→Z) by default, making it hard to see newly added assets.

**Solution**: Changed default sort to **"Last Added"** (newest first)
- Default `sortBy` changed from `'emp_asc'` to `'id_desc'`
- Updated sort dropdown to show "Last Added" as first option
- Updated Clear button to reset to `'id_desc'`

**Files Modified**:
- `frontend/src/pages/AssetList.js` (line 93, 230-236, 242-248)

---

### 2. Acknowledgment Column Layout
**Problem**: The Actions column content (View/Edit/Delete buttons) was being rendered in the Acknowledgment column, leaving the Actions column empty.

**Solution**: Separated the columns properly:
- **Acknowledgment column**: Now shows `<AckBadge>` component with status badge and email send button
- **Actions column**: Now shows View/Edit/Delete buttons in proper button group

**Component Behavior**:
- Shows acknowledgment status: "Not Sent", "Pending", or "✓ Acknowledged"
- Shows email send button (📧) when email exists and not acknowledged
- Shows retry button (↺) when status is Pending
- Real-time updates when email is sent

**Files Modified**:
- `frontend/src/pages/AssetList.js` (line 381-399, 365)

---

## Testing Checklist

✅ Assets now show newest first by default  
✅ Acknowledgment column shows status badges correctly  
✅ Actions column shows View/Edit/Delete buttons  
✅ Email send button appears in Acknowledgment column  
✅ Columns are properly aligned with headers  
✅ No layout overflow or misalignment

---

## Technical Details

### Default Sort Implementation
```javascript
const [sortBy, setSortBy] = useState('id_desc'); // Line 93
```

### Acknowledgment Column Rendering
```javascript
<td>{statusBadge(a.status)}</td>
<td><AckBadge asset={a} onSend={fetchAssets} /></td>
<td>
  <div className="btn-group btn-group-sm">
    {/* View/Edit/Delete buttons */}
  </div>
</td>
```

---

## User Impact

**Before**:
- Had to manually change sort to see new assets
- Acknowledgment and Actions columns were mixed up
- Confusing table layout

**After**:
- New assets appear at the top immediately
- Clear separation between Acknowledgment status and Action buttons
- Professional, organized table layout

---

## Next Steps

Users can now:
1. See newly added assets at the top of the list
2. Easily identify acknowledgment status for each assigned asset
3. Send acknowledgment emails directly from the asset list
4. Perform actions (view/edit/delete) from the dedicated Actions column

---

**Status**: Ready for production ✅
