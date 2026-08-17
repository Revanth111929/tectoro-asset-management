# Safe Asset Edit + Soft Delete Implementation Plan

## Overview
This document outlines the implementation plan for adding safe asset editing with validation and soft delete/recovery functionality to the asset management system.

## Current State Analysis
- ✅ Asset model exists in models.py
- ✅ Asset CRUD operations exist
- ✅ DELETE endpoint exists but performs hard delete
- ❌ No soft delete fields (is_deleted, deleted_at, deleted_by)
- ❌ No edit validation/confirmation
- ❌ No deleted assets page
- ❌ No restore functionality

## Required Changes

### 1. Database/Model Changes (models.py)
**Add soft delete fields to Asset model:**
```python
is_deleted = db.Column(db.Boolean, default=False, index=True)
deleted_at = db.Column(db.DateTime, nullable=True)
deleted_by = db.Column(db.String(150), nullable=True)
```

**Update to_dict() method:**
- Include new fields in serialization

### 2. Backend API Changes (api_server.py)

#### Modify Existing Endpoints:
**GET /api/assets**
- Add filter `is_deleted=False` by default
- Add optional query param `include_deleted=false`

**DELETE /api/assets/<id>**
- Change from hard delete to soft delete
- Set is_deleted=True, deleted_at=now(), deleted_by=current_user
- Return success message: "Asset moved to Deleted Assets"

**PUT /api/assets/<id>**
- Add validation before save
- Check for duplicate serial numbers
- Detect important field changes (category, employee, status)
- Generate change summary

#### New Endpoints:
**GET /api/assets/deleted**
- Return all assets where is_deleted=True
- Include full asset details

**POST /api/assets/<id>/restore**
- Validate serial number not in use
- Set is_deleted=False, deleted_at=None, deleted_by=None
- Log restoration to activity history

**POST /api/assets/<id>/validate-changes**
- Accept old and new values
- Return validation results and warnings

### 3. Frontend Changes

#### Asset Edit Validation (AllAssets.js or equivalent)
**Before Save:**
1. Compare old vs new values
2. Detect significant changes
3. Show confirmation dialog with change summary
4. Call validation endpoint
5. Display warnings for:
   - Category changes
   - Employee assignment changes
   - Duplicate serial numbers
   - Status changes

#### Delete Confirmation (AllAssets.js)
**Current:**
```
Delete Asset? [Yes] [No]
```

**New:**
```
Move Asset to Deleted Assets?

Asset: Dell Latitude 3420
Serial: ABC123
Employee: Sumanth Miryala (if assigned)

WARNING: This asset will be moved to Deleted Assets.
It will NOT be permanently removed and can be restored later.

[Cancel] [Move to Deleted Assets]
```

#### New Page: DeletedAssets.js
**Location:** Assets → Deleted Assets

**Features:**
- Table showing all soft-deleted assets
- Columns: Asset Name, Category, Serial, Deleted By, Deleted At
- Actions: View, Restore
- Search/filter functionality

**Restore Dialog:**
```
Restore Asset?

Asset: Dell Latitude 3420
Serial: ABC123

The asset will be returned to active asset inventory.

[Cancel] [Restore Asset]
```

### 4. Routing Changes

**Add new route:**
```javascript
<Route path="/assets/deleted" element={<DeletedAssets />} />
```

**Update sidebar navigation:**
- Add "Deleted Assets" under Assets section

### 5. API Service Changes (api.js)

**Add methods:**
```javascript
getDeletedAssets: () => api.get('/assets/deleted'),
restoreAsset: (id) => api.post(`/assets/${id}/restore`),
validateChanges: (id, changes) => api.post(`/assets/${id}/validate-changes`, changes),
```

### 6. Activity History Integration

**Log these events:**
- ASSET_UPDATED: Field-level changes
- ASSET_DELETED: Soft delete with details
- ASSET_RESTORED: Restoration with details

### 7. Bulk Delete Changes

**Modify bulk delete to use soft delete:**
- Update backend endpoint to set is_deleted=True
- Update frontend message: "Move to Deleted Assets"
- Update confirmation dialog

## Implementation Priority

### Phase 1: Soft Delete Foundation
1. ✅ Add database fields to Asset model
2. ✅ Update to_dict() method
3. ✅ Modify DELETE endpoint
4. ✅ Update GET /api/assets to filter deleted
5. ✅ Add GET /api/assets/deleted
6. ✅ Add POST /api/assets/<id>/restore
7. ✅ Update bulk delete

### Phase 2: Deleted Assets Page
8. ✅ Create DeletedAssets.js component
9. ✅ Add routing
10. ✅ Add sidebar navigation
11. ✅ Implement restore functionality

### Phase 3: Edit Validation
12. ✅ Add validation endpoint
13. ✅ Update asset edit form
14. ✅ Add change confirmation dialog
15. ✅ Implement validation checks

## Safety Rules

### Serial Number Protection
- Always check for duplicates before save
- Block save if duplicate exists
- Show clear error message

### Category Change Protection
- Detect category changes
- Show warning dialog
- Require explicit confirmation
- Preserve asset history

### Employee Assignment Protection
- Don't auto-remove assignments on edit
- Detect assignment changes
- Show confirmation
- Log changes

### Status Protection
- Don't auto-change status
- Require explicit status workflow
- Validate status transitions

## Testing Plan

### Test 1: Normal Edit
- Edit model name only
- Verify only model changes
- Other fields unchanged

### Test 2: Serial Number Duplicate
- Try to save existing serial
- Verify blocked
- Show error message

### Test 3: Category Change
- Change Laptop → Mouse
- Verify warning shown
- Verify confirmation required

### Test 4: Delete Asset
- Delete one asset
- Verify soft delete (is_deleted=True)
- Verify appears in Deleted Assets
- Verify NOT in All Assets

### Test 5: Restore Asset
- Restore from Deleted Assets
- Verify is_deleted=False
- Verify appears in All Assets
- Verify data intact

### Test 6: Delete Assigned Asset
- Delete asset with employee
- Verify warning shown
- Verify assignment preserved

### Test 7: Bulk Delete
- Select 10 assets
- Delete bulk
- Verify all soft deleted
- No hard deletes

### Test 8: Restore Serial Conflict
- Delete asset ABC123
- Create new asset ABC123
- Try restore old asset
- Verify blocked

### Test 9: Edit Assigned Asset
- Edit asset with employee
- Verify assignment unchanged
- Only edited fields change

### Test 10: Activity History
- Delete asset
- Restore asset
- Edit asset
- Verify all logged

## Backward Compatibility

### API Compatibility
- DELETE /api/assets/<id> endpoint unchanged (frontend compatible)
- Backend behavior changes to soft delete
- Response format maintained

### Database Compatibility
- New fields nullable and default False
- No migration required for existing data
- Existing queries work (with filter update)

### Frontend Compatibility
- Existing delete calls work
- New features additive
- No breaking changes

## Migration Strategy

### Database Migration
```python
# Add columns to assets table
ALTER TABLE assets ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE assets ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE assets ADD COLUMN deleted_by VARCHAR(150) NULL;
CREATE INDEX idx_assets_is_deleted ON assets(is_deleted);
```

### Deployment Steps
1. Add model fields (backward compatible)
2. Deploy backend changes
3. Deploy frontend changes
4. Test thoroughly
5. Document for users

## Success Criteria

- ✅ No assets permanently deleted through UI
- ✅ All deleted assets recoverable
- ✅ Edit validation prevents accidents
- ✅ Serial number conflicts detected
- ✅ Category changes require confirmation
- ✅ Employee assignments protected
- ✅ Activity history tracks all changes
- ✅ Bulk operations use soft delete
- ✅ Restore functionality works
- ✅ No breaking changes to existing features

## Implementation Status
**Status:** PLANNING COMPLETE
**Next:** Begin Phase 1 implementation
**Est. Time:** 2-3 hours for full implementation
**Risk:** Low (additive changes, backward compatible)
