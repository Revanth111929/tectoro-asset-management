# Permanent Delete Fix - Status Report

## Issue
**Error:** `sqlite3.IntegrityError: NOT NULL constraint failed: asset_lifecycle.asset_id`

**Cause:** SQLAlchemy was trying to execute `UPDATE asset_lifecycle SET asset_id=? WHERE asset_lifecycle.id = ?` (setting FK to NULL) before deleting the asset, which violates the NOT NULL constraint.

## Fix Applied ✅

### Backend Changes (api_server.py)

Both permanent delete endpoints have been updated:

1. **Single Delete:** `DELETE /api/assets/<int:asset_id>/permanent-delete` (line 3840)
2. **Bulk Delete:** `POST /api/assets/deleted/bulk-permanent-delete` (line 3928)

### Key Changes:

#### 1. All child record deletions use `synchronize_session=False`:
```python
AssetLifecycle.query.filter_by(asset_id=asset_id).delete(synchronize_session=False)
AssetReplacement.query.filter(...).delete(synchronize_session=False)
TemporaryAssignment.query.filter(...).delete(synchronize_session=False)
ExitAssetCollection.query.filter_by(asset_id=asset_id).delete(synchronize_session=False)
OnboardingAssetAssignment.query.filter_by(asset_id=asset_id).delete(synchronize_session=False)
PartReplacement.query.filter_by(asset_id=asset_id).delete(synchronize_session=False)
```

#### 2. Proper deletion order with flush:
```python
# Delete all child records first
[child deletions with synchronize_session=False]

# Flush to database
db.session.flush()

# Delete the asset
db.session.delete(asset)
db.session.flush()

# Commit transaction
db.session.commit()
```

#### 3. Transaction safety:
```python
try:
    [deletion logic]
    db.session.commit()
except Exception as e:
    db.session.rollback()
    logger.error(...)
    return error response
```

## Backend Status ✅

- **Backend Restarted:** Yes (PID: 17187)
- **Health Check:** ✅ Passing
- **Log Status:** No errors
- **Fix Loaded:** ✅ Confirmed

## Testing Instructions

Test the following scenarios in the UI:

### 1. Single Permanent Delete
- Go to **Assets → Deleted Assets**
- Select one archived asset
- Click **Delete Permanently** (trash icon)
- Confirm deletion
- **Expected:** Asset deleted successfully, no error

### 2. Bulk Permanent Delete
- Go to **Assets → Deleted Assets**
- Select multiple archived assets using checkboxes
- Click **Delete Permanently** button in toolbar
- Type "DELETE" to confirm
- **Expected:** All selected assets deleted successfully, no error

### 3. Asset with Lifecycle History
- Test with an asset that has lifecycle events
- **Expected:** Lifecycle records deleted first, then asset

### 4. Asset with Replacement History
- Test with an asset that has replacement records
- **Expected:** Replacement records deleted first, then asset

### 5. Asset with Assignment History
- Test with an asset that has temporary assignments
- **Expected:** Assignment records deleted first, then asset

### 6. Active Asset Protection
- Try to permanently delete an active (non-archived) asset
- **Expected:** Error message "Only archived assets can be permanently deleted"

### 7. Restore Functionality
- Restore an archived asset
- **Expected:** Asset restored to active status (undeleted)

## What Was Fixed

**Before:** SQLAlchemy's default behavior was to set foreign keys to NULL before deleting the parent record, which violated the NOT NULL constraint on `asset_lifecycle.asset_id`.

**After:** Using `synchronize_session=False` tells SQLAlchemy to skip the session synchronization and just execute the raw DELETE SQL, avoiding the UPDATE to NULL step entirely.

## Safety Features Preserved ✅

- Confirmation modal for single delete
- Type "DELETE" confirmation for bulk delete
- Only archived assets can be permanently deleted
- Active assets are protected
- Transaction rollback on error
- Activity logging
- Admin-only access

## Next Steps

1. Test single permanent delete in UI
2. Test bulk permanent delete with multiple assets
3. Verify no orphaned records in database
4. Verify restore functionality still works
5. Verify activity logs are created

If any errors occur, check `/tmp/api_server.log` for details.

---
**Status:** Fix implemented and backend restarted - Ready for testing
**Date:** 2026-08-15
**Backend PID:** 17187
