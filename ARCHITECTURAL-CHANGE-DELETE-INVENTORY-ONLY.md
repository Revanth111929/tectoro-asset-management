# ARCHITECTURAL CHANGE: Delete Only from Inventory

**Status**: IN PROGRESS  
**Type**: Business Workflow Change  
**Priority**: CRITICAL - Production Requirement

---

## BUSINESS RULE CHANGE

### OLD BEHAVIOR
- Delete available from multiple places (unclear)
- No clear ownership of delete operation
- Mixed inventory/operational concerns

### NEW BEHAVIOR
```
Inventory Module     = Physical stock management → CAN DELETE
All Assets Module    = Operational asset view     → CANNOT DELETE
```

**Rationale**:
- Inventory represents **physical stock owned by company**
- All Assets represents **operational view of assigned/active assets**
- Only Inventory has authority to permanently remove assets from system
- Separation of concerns: Operations vs. Inventory Management

---

## CURRENT STATE AUDIT

### Frontend Delete Entry Points

#### ✅ CONFIRMED: No Delete in All Assets
**File**: `frontend/src/pages/AssetList.js`
- Searched for: delete, Delete, trash, remove, Remove
- **Result**: ZERO matches
- **Status**: Already compliant with new rule

#### ✅ CONFIRMED: No Delete in Inventory Pages
**Files Checked**:
- `frontend/src/pages/InventoryCategory.js`
- `frontend/src/pages/InventoryDetail.js`
- `frontend/src/pages/InventoryLifecycle.js`
- **Result**: ZERO delete functionality currently exists
- **Status**: Need to ADD delete functionality

#### ✅ CONFIRMED: Delete API Method Exists But Unused
**File**: `frontend/src/services/api.js` (Line 135)
```javascript
delete: (id) => {
  console.log('[assetAPI] delete called for ID:', id);
  console.log('[assetAPI] DELETE URL:', `/assets/${id}`);
  return api.delete(`/assets/${id}`);
},
```
- Method exists in assetAPI
- **NOT called from anywhere in frontend**
- **Status**: Ready to use from Inventory

### Backend Delete Implementation

#### ✅ EXISTING: Comprehensive Delete Endpoint
**File**: `api_server.py` (Lines 1417-1460)
**Route**: `DELETE /api/assets/<int:asset_id>`
**Decorators**: `@token_required`

**Current Implementation**:
```python
def delete_asset(asset_id):
    # 1. Get asset
    # 2. Create audit log BEFORE deletion
    # 3. Delete all related records:
    #    - AssetLifecycle
    #    - AssetReplacement (old_asset_id OR new_asset_id)
    #    - TemporaryAssignment (original OR temp)
    #    - ExitAssetCollection
    #    - OnboardingAssetAssignment
    #    - AssetRepair (BUG-012 fix)
    #    - RepairPart (BUG-012 fix)
    # 4. Delete asset
    # 5. Log activity
    # 6. Commit transaction
```

**Features**:
- ✅ Proper foreign key cascade cleanup
- ✅ Audit logging before deletion
- ✅ Activity log after deletion
- ✅ User attribution
- ✅ Handles all relationships
- ✅ Single transaction

**Gaps**:
- ❌ No rollback on error (BUG-019 applies here too)
- ❌ No source verification (doesn't check if called from Inventory)
- ❌ No bulk delete support

---

## ARCHITECTURAL ASSESSMENT

### What EXISTS:
1. ✅ Backend delete endpoint with proper cleanup
2. ✅ Frontend API method ready to use
3. ✅ AssetList has NO delete (correct)
4. ✅ Comprehensive cascade delete logic

### What's MISSING:
1. ❌ Delete UI in Inventory pages
2. ❌ Single delete in Inventory
3. ❌ Bulk selection in Inventory
4. ❌ Bulk delete in Inventory
5. ❌ Delete confirmation modal
6. ❌ Success/error feedback

### What to VERIFY:
1. ⏳ AssetView page (detail view)
2. ⏳ AssetEdit page
3. ⏳ AssetOperations component
4. ⏳ Context menus
5. ⏳ Keyboard shortcuts
6. ⏳ Modal dialogs
7. ⏳ Bulk actions

---

## IMPLEMENTATION PLAN

### Phase 1: Verify No Existing Delete Entry Points
**Files to Audit**:
- [ ] `frontend/src/pages/AssetView.js`
- [ ] `frontend/src/pages/AssetEdit.js`
- [ ] `frontend/src/components/AssetOperations.js`
- [ ] `frontend/src/components/*.js` (all components)
- [ ] Search for: `bi-trash`, `trash`, `delete`, `Delete`, context menu, bulk actions

**Expected Result**: Confirm NO delete exists anywhere except what we'll add to Inventory

### Phase 2: Add Delete to Inventory
**Target**: `frontend/src/pages/InventoryCategory.js`

**Features to Implement**:
1. **Single Delete Button**
   - Row-level trash icon
   - Confirmation modal
   - API call to `assetAPI.delete(id)`
   - Success/error toast
   - Table refresh after delete

2. **Bulk Selection**
   - Checkbox column
   - Select all checkbox in header
   - Select individual rows
   - Selected count display
   - Clear selection button

3. **Bulk Delete Button**
   - Appears when items selected
   - Shows count: "Delete 5 assets"
   - Confirmation modal with list
   - Sequential API calls (or create bulk endpoint)
   - Progress indicator
   - Results summary

4. **Confirmation Modal**
   - Asset details (name, serial, category)
   - Warning message
   - Cascade info (will delete lifecycle, repairs, etc.)
   - Confirm/Cancel buttons
   - Prevent accidental delete

### Phase 3: Backend Enhancement (Optional)
**File**: `api_server.py`

**Add Bulk Delete Endpoint** (optional, can also loop in frontend):
```python
@app.route('/api/assets/bulk-delete', methods=['POST'])
@token_required
@non_viewer_required
def bulk_delete_assets():
    data = request.get_json() or {}
    asset_ids = data.get('asset_ids', [])
    
    results = []
    for asset_id in asset_ids:
        try:
            # Call existing delete_asset logic
            # Append success
        except Exception as e:
            # Append error
    
    return jsonify({'results': results})
```

**Add Transaction Rollback** (BUG-019 fix):
```python
def delete_asset(asset_id):
    try:
        # Existing delete logic
        db.session.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to delete asset {asset_id}: {e}")
        return jsonify({'error': str(e)}), 500
```

### Phase 4: Regression Testing
**Test Matrix**:

| Page/Feature | Delete Button | Expected |
|--------------|---------------|----------|
| All Assets | None | ✅ PASS |
| Asset Detail | None | ⏳ VERIFY |
| Asset Edit | None | ⏳ VERIFY |
| Asset View | None | ⏳ VERIFY |
| Inventory Category | Single + Bulk | ⏳ IMPLEMENT |
| Inventory Detail | None (view only) | ⏳ VERIFY |
| Asset Operations | None | ⏳ VERIFY |

**Functional Tests**:
- [ ] Single delete from Inventory
- [ ] Bulk select (1, many, all)
- [ ] Bulk delete
- [ ] Confirmation modal shows correct info
- [ ] Cancel works
- [ ] Delete success refreshes table
- [ ] Dashboard counts update
- [ ] Lifecycle records deleted
- [ ] Repair records deleted
- [ ] Foreign keys cleaned up
- [ ] Audit log created
- [ ] Activity log created
- [ ] No orphaned records

**Negative Tests**:
- [ ] Cannot delete from All Assets (no button exists)
- [ ] Cannot delete via keyboard shortcut
- [ ] Cannot delete via context menu
- [ ] Cannot delete via API directly from console
- [ ] Cannot delete assigned assets (backend validation)

---

## RISK ASSESSMENT

### Low Risk
- ✅ Delete currently NOT exposed anywhere
- ✅ Backend delete already exists and works
- ✅ Adding UI is additive, not destructive

### Medium Risk
- ⚠️ Bulk delete might fail partially
- ⚠️ UI needs proper error handling
- ⚠️ Transaction rollback missing (BUG-019)

### High Risk
- ❌ None identified

---

## DELIVERABLES

### Code Changes
1. `frontend/src/pages/InventoryCategory.js` - Add delete UI
2. `frontend/src/components/DeleteConfirmModal.js` - New confirmation modal
3. `api_server.py` - Add rollback to delete_asset (BUG-019 fix)
4. `api_server.py` - Add bulk delete endpoint (optional)

### Documentation
1. Architecture decision document (this file)
2. User guide for delete from Inventory
3. API documentation for bulk delete
4. Regression test results

### Verification
1. Complete frontend audit (all files checked)
2. Backend audit (all delete entry points)
3. Manual UAT by user
4. Screenshots of delete functionality in Inventory

---

## NEXT ACTIONS

1. ⏳ Complete Phase 1 audit (verify no existing delete)
2. ⏳ Implement Phase 2 (add delete to Inventory)
3. ⏳ Enhance Phase 3 (backend improvements)
4. ⏳ Execute Phase 4 (regression testing)
5. ⏳ User manual verification

---

**Last Updated**: Current Session  
**Status**: Audit in Progress
