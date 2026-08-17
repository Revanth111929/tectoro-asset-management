# Permanent Delete Fix - COMPLETE ✅

## Issue Fixed

**Error 1:** `NameError: name 'AssetLifecycle' is not defined`  
**Error 2:** `sqlite3.IntegrityError: NOT NULL constraint failed: asset_lifecycle.asset_id`

## Root Cause Analysis

### Error 1: Missing Model Imports
The bulk permanent delete endpoint (`POST /api/assets/deleted/bulk-permanent-delete`) was referencing models that were not imported:
- `AssetLifecycle`
- `AssetReplacement`
- `TemporaryAssignment`
- `ExitAssetCollection`
- `AssetPartReplacement`

### Error 2: SQLAlchemy Default Behavior
SQLAlchemy's default behavior when deleting a parent record is to:
1. Set all foreign keys to `NULL` in child records
2. Then delete the parent

This fails when the foreign key has `nullable=False` constraint, which is the case for `asset_lifecycle.asset_id`.

## Solution Implemented

### 1. Added Missing Model Imports

**File:** `api_server.py` (line 73-77)

```python
from models import (
    db, Asset, ActivityLog, User, Employee, Onboarding, OnboardingAssetAssignment,
    AssetLifecycle, AssetReplacement, TemporaryAssignment, ExitAssetCollection, AssetPartReplacement
)
```

**Note:** The model is `AssetPartReplacement`, not `PartReplacement`.

### 2. Fixed Model References in Both Endpoints

Changed all references from `PartReplacement` to `AssetPartReplacement` in:
- Single delete: `DELETE /api/assets/<int:asset_id>/permanent-delete` (line 3840)
- Bulk delete: `POST /api/assets/deleted/bulk-permanent-delete` (line 3928)

### 3. Correct Deletion Order with `synchronize_session=False`

For each asset being permanently deleted:

```python
# 1. Delete AssetLifecycle records
AssetLifecycle.query.filter_by(asset_id=asset_id).delete(synchronize_session=False)

# 2. Delete AssetReplacement records (both old and new asset references)
AssetReplacement.query.filter(
    (AssetReplacement.old_asset_id == asset_id) |
    (AssetReplacement.new_asset_id == asset_id)
).delete(synchronize_session=False)

# 3. Delete TemporaryAssignment records (both original and temp asset references)
TemporaryAssignment.query.filter(
    (TemporaryAssignment.original_asset_id == asset_id) |
    (TemporaryAssignment.temp_asset_id == asset_id)
).delete(synchronize_session=False)

# 4. Delete ExitAssetCollection records
ExitAssetCollection.query.filter_by(asset_id=asset_id).delete(synchronize_session=False)

# 5. Delete OnboardingAssetAssignment records
OnboardingAssetAssignment.query.filter_by(asset_id=asset_id).delete(synchronize_session=False)

# 6. Delete AssetPartReplacement records
AssetPartReplacement.query.filter_by(asset_id=asset_id).delete(synchronize_session=False)

# Flush child record deletions
db.session.flush()

# Delete the asset itself
db.session.delete(asset)
db.session.flush()

# Commit transaction (only after all assets processed in bulk operation)
db.session.commit()
```

### 4. Transaction Safety

Both endpoints implement proper transaction handling:

```python
try:
    # Deletion logic
    db.session.commit()
except Exception as e:
    db.session.rollback()
    logger.error(f"Failed to permanently delete assets: {error_msg}", exc_info=True)
    return jsonify({
        'success': False,
        'error': f'Failed to permanently delete assets: {error_msg}'
    }), 500
```

## Models with Foreign Keys to Assets

All models with `ForeignKey('assets.id')` that are handled:

| Model | Foreign Key Field | Nullable | Handled |
|-------|------------------|----------|---------|
| `AssetLifecycle` | `asset_id` | ❌ NOT NULL | ✅ Yes |
| `AssetReplacement` | `old_asset_id`, `new_asset_id` | ✅ Nullable | ✅ Yes |
| `TemporaryAssignment` | `original_asset_id`, `temp_asset_id` | ❌ NOT NULL | ✅ Yes |
| `ExitAssetCollection` | `asset_id` | ❌ NOT NULL | ✅ Yes |
| `OnboardingAssetAssignment` | `asset_id` | ✅ Nullable | ✅ Yes |
| `AssetPartReplacement` | `asset_id` | ❌ NOT NULL | ✅ Yes |

## API Endpoints

### Single Permanent Delete
**Endpoint:** `DELETE /api/assets/<int:asset_id>/permanent-delete`  
**Access:** Admin only (`@admin_required`)  
**Frontend Call:** `assetAPI.permanentDelete(id)`

**Request:** DELETE to `/api/assets/123/permanent-delete`

**Response (Success):**
```json
{
  "success": true,
  "message": "Asset Laptop HP permanently deleted"
}
```

**Response (Error - Active Asset):**
```json
{
  "success": false,
  "error": "Only archived assets can be permanently deleted. This asset is active."
}
```

### Bulk Permanent Delete
**Endpoint:** `POST /api/assets/deleted/bulk-permanent-delete`  
**Access:** Admin only (`@admin_required`)  
**Frontend Call:** `assetAPI.bulkPermanentDelete(assetIds)`

**Request:**
```json
{
  "asset_ids": [123, 456, 789]
}
```

**Response (Success):**
```json
{
  "success": true,
  "deleted": 3,
  "message": "3 archived assets permanently deleted"
}
```

**Response (Error - Active Asset):**
```json
{
  "success": false,
  "error": "Cannot permanently delete active assets. 2 active asset(s) detected: Laptop HP [HP123], Monitor Dell [DEL456]..."
}
```

## Safety Features Preserved ✅

All safety mechanisms remain intact:

1. **Active Asset Protection:** Only archived assets (`is_deleted=True`) can be permanently deleted
2. **Confirmation Modal:** Single delete requires confirmation
3. **Type DELETE Confirmation:** Bulk delete requires typing "DELETE" to confirm
4. **Admin-Only Access:** Both endpoints require `@admin_required` decorator
5. **Activity Logging:** All permanent deletions are logged
6. **Transaction Rollback:** Failed deletions rollback and return error messages
7. **Batch Processing:** Bulk delete uses single transaction (all or nothing)

## Frontend Integration

**File:** `frontend/src/pages/DeletedAssets.js`

The frontend calls the bulk delete endpoint:
```javascript
const confirmBulkPermanentDelete = async () => {
  if (deleteConfirmText !== 'DELETE') {
    alert('Please type DELETE to confirm');
    return;
  }
  
  try {
    setDeleting(true);
    const assetIds = Array.from(selectedAssets);
    const response = await assetAPI.bulkPermanentDelete(assetIds);
    alert(`✅ ${response.data.deleted} archived asset(s) permanently deleted`);
    setShowBulkDeleteModal(false);
    setDeleteConfirmText('');
    clearSelection();
    loadDeletedAssets(); // Refresh list
  } catch (err) {
    const errorMsg = err.response?.data?.error || 'Failed to permanently delete assets';
    alert(`❌ ${errorMsg}`);
  } finally {
    setDeleting(false);
  }
};
```

**File:** `frontend/src/services/api.js`

API service method:
```javascript
bulkPermanentDelete: (assetIds) => {
  console.log('[assetAPI] bulkPermanentDelete called for IDs:', assetIds);
  return api.post('/assets/deleted/bulk-permanent-delete', { asset_ids: assetIds });
}
```

## Backend Status ✅

- **Status:** Running
- **PID:** 18706
- **Health Check:** ✅ Passing
- **Startup Errors:** None
- **Syntax Check:** ✅ Passed

```
Health Check Response:
{
  "database": "healthy",
  "service": "Tectoro Asset Management API",
  "status": "ok",
  "timestamp": "2026-08-15T07:02:33.931281",
  "version": "2.0.0"
}
```

## Testing Checklist

Test the following in the UI at **Assets → Deleted Assets**:

### ✅ Core Functionality
- [ ] **TEST 1:** Single archived asset → Delete Permanently → Should succeed
- [ ] **TEST 2:** Multiple archived assets → Delete Permanently → Type "DELETE" → Should succeed
- [ ] **TEST 3:** 34 archived assets → Delete Permanently → Should work without NameError
- [ ] **TEST 4:** Asset with lifecycle history → Permanently delete → Should work
- [ ] **TEST 5:** Asset with replacement history → Permanently delete → Should work
- [ ] **TEST 6:** Asset with temporary assignment → Permanently delete → Should work
- [ ] **TEST 7:** Asset with onboarding/exit records → Permanently delete → Should work
- [ ] **TEST 8:** Asset with part replacement history → Permanently delete → Should work

### ✅ Safety Checks
- [ ] **TEST 9:** Try to permanently delete active asset → Should be rejected
- [ ] **TEST 10:** Restore archived asset → Should still work

### ✅ Data Integrity
- [ ] **TEST 11:** After permanent delete, check database for orphaned `asset_lifecycle` records
- [ ] **TEST 12:** After permanent delete, check database for orphaned `asset_replacements` records
- [ ] **TEST 13:** After permanent delete, check database for orphaned `temporary_assignments` records
- [ ] **TEST 14:** After permanent delete, verify activity log entry was created

## Expected Results

### Before Fix
```
❌ Failed to permanently delete assets: name 'AssetLifecycle' is not defined
```

### After Fix
```
✅ 34 archived asset(s) permanently deleted
```

## Technical Details

### Why `synchronize_session=False`?

When using bulk delete with `.delete()` on a Query object, SQLAlchemy has 3 strategies for `synchronize_session`:

1. **`'auto'` (default):** Try to update the session by setting FK to NULL, then delete
   - ❌ **Fails** when FK has `nullable=False` constraint
   
2. **`'fetch'`:** Fetch all objects first, then delete
   - ⚠️ Slower, loads all objects into memory
   
3. **`False`:** Skip session synchronization, execute raw DELETE SQL
   - ✅ **Correct choice** - Fast and avoids NULL FK issue

By using `synchronize_session=False`, we tell SQLAlchemy:
> "Just execute the DELETE SQL directly. Don't try to update the session objects or set FKs to NULL."

### Transaction Flow

**Bulk Delete (34 assets):**
```
BEGIN TRANSACTION
  ┌─ Asset 1 ─────────────────┐
  │ DELETE FROM asset_lifecycle WHERE asset_id=1
  │ DELETE FROM asset_replacements WHERE old_asset_id=1 OR new_asset_id=1
  │ DELETE FROM temporary_assignments WHERE original_asset_id=1 OR temp_asset_id=1
  │ DELETE FROM exit_asset_collection WHERE asset_id=1
  │ DELETE FROM onboarding_asset_assignments WHERE asset_id=1
  │ DELETE FROM asset_part_replacements WHERE asset_id=1
  └───────────────────────────┘
  
  ┌─ Asset 2 ─────────────────┐
  │ ... same pattern ...
  └───────────────────────────┘
  
  ... repeat for all 34 assets ...
  
  FLUSH  (send child deletions to DB)
  
  DELETE FROM assets WHERE id IN (1, 2, 3, ..., 34)
  
  FLUSH  (send asset deletions to DB)
  
COMMIT TRANSACTION
```

If any step fails → **ROLLBACK** entire transaction.

## Files Modified

| File | Lines Modified | Changes |
|------|---------------|---------|
| `api_server.py` | 73-77 | Added model imports |
| `api_server.py` | 3897 | Fixed model name: `PartReplacement` → `AssetPartReplacement` |
| `api_server.py` | 3993 | Fixed model name: `PartReplacement` → `AssetPartReplacement` |

## Verification Commands

### Check backend is running:
```bash
curl http://localhost:3000/api/health
```

### Check backend logs:
```bash
tail -100 /tmp/api_server.log
```

### Restart backend if needed:
```bash
pkill -f "python.*api_server.py" && \
cd /home/administrator/Desktop/asset-management && \
source venv/bin/activate && \
nohup python api_server.py > /tmp/api_server.log 2>&1 &
```

### Check for syntax errors:
```bash
cd /home/administrator/Desktop/asset-management && \
python3 -m py_compile api_server.py
```

---

## Summary

✅ **Fixed:** Missing model imports (`AssetLifecycle`, `AssetReplacement`, `TemporaryAssignment`, `ExitAssetCollection`, `AssetPartReplacement`)  
✅ **Fixed:** Incorrect model name (`PartReplacement` → `AssetPartReplacement`)  
✅ **Fixed:** SQLAlchemy trying to set FK to NULL before delete (using `synchronize_session=False`)  
✅ **Fixed:** Proper deletion order (children first, then parent)  
✅ **Fixed:** Transaction safety (rollback on error)  
✅ **Preserved:** All safety checks and confirmations  
✅ **Verified:** Backend syntax check passed  
✅ **Verified:** Backend restarted successfully  
✅ **Verified:** Health check passing  

**Status:** Ready for testing in UI  
**Date:** 2026-08-15  
**Backend PID:** 18706  

---

**Next Step:** Test permanent delete functionality in the browser at **Assets → Deleted Assets**
