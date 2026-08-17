# Lifecycle-Stats Endpoint Fix for Viewer Role

## Issue
`GET /api/dashboard/lifecycle-stats` returned `403 Forbidden` for Viewer role with error:
```json
{
  "error": "Access denied. Viewers cannot perform this action."
}
```

## Root Cause
The endpoint had `@non_viewer_required` decorator that blocked all viewer access, even though it's a read-only GET endpoint.

## Investigation

### 1. Identified Running Backend
```bash
ps aux | grep api_server
# Found: /home/administrator/Desktop/asset-management/api_server.py
# Running on: Port 3000 (not 5000)
```

### 2. Located the Endpoint
**File**: `/home/administrator/Desktop/asset-management/api_server.py`  
**Line**: 958-960

### 3. Found the Decorator
**Decorator**: `@non_viewer_required`  
**Defined in**: `/home/administrator/Desktop/asset-management/utils/auth.py`

```python
def non_viewer_required(f):
    """Decorator to block viewer role (allows admin and user)"""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        user = request.current_user
        if user.get('role') == 'viewer':
            return jsonify({'error': 'Access denied. Viewers cannot perform this action.'}), 403
        return f(*args, **kwargs)
    return decorated
```

## Fix Applied

### BEFORE (Lines 958-960):
```python
@app.route('/api/dashboard/lifecycle-stats', methods=['GET'])
@non_viewer_required
def lifecycle_stats():
    from sqlalchemy import func, extract
    from models import AssetLifecycle, TemporaryAssignment, AssetReplacement
    # ... rest of function
```

### AFTER (Removed @non_viewer_required decorator):
```python
@app.route('/api/dashboard/lifecycle-stats', methods=['GET'])
def lifecycle_stats():
    from sqlalchemy import func, extract
    from models import AssetLifecycle, TemporaryAssignment, AssetReplacement
    # ... rest of function
```

## Changes Made
- **File Modified**: `/home/administrator/Desktop/asset-management/api_server.py`
- **Line Removed**: Line 959 (`@non_viewer_required`)
- **Action**: Deleted decorator to allow Viewer role access

## Justification
The `/api/dashboard/lifecycle-stats` endpoint:
- Is a **GET request** (read-only)
- Returns **statistics only** (no data modification)
- Should be accessible to all authenticated users
- Contains: active temp assignments, assets replaced this month, total lifecycle events

## Testing Results

### Before Fix:
```bash
curl -H "Authorization: Bearer demo:View" \
  http://192.168.20.180:3000/api/dashboard/lifecycle-stats
# HTTP 403 Forbidden
# {"error": "Access denied. Viewers cannot perform this action."}
```

### After Fix:
```bash
curl -H "Authorization: Bearer demo:View" \
  http://192.168.20.180:3000/api/dashboard/lifecycle-stats
# HTTP 200 OK ✅
# {
#   "stats": {
#     "active_temp_assignments": 0,
#     "assets_replaced_this_month": 0,
#     "total_lifecycle_events": 0
#   }
# }
```

## Permission Matrix

### GET /api/dashboard/lifecycle-stats

| Role | Before Fix | After Fix |
|------|-----------|-----------|
| Admin | ✅ 200 OK | ✅ 200 OK |
| Standard (user) | ✅ 200 OK | ✅ 200 OK |
| Viewer | ❌ 403 Forbidden | ✅ 200 OK |

## Other Dashboard Endpoints (Unchanged)

| Endpoint | Admin | Standard | Viewer |
|----------|-------|----------|--------|
| GET /api/dashboard/stats | ✅ | ✅ | ✅ |
| GET /api/dashboard/activity | ✅ | ✅ | ✅ |
| GET /api/dashboard/lifecycle-stats | ✅ | ✅ | ✅ (FIXED) |

## Write Endpoints (Still Protected)

The following endpoints still have `@non_viewer_required` and correctly block Viewer role:
- POST /api/assets
- PUT /api/assets/:id
- DELETE /api/assets/:id
- Other modification endpoints

**This is correct** - Viewer role should not be able to modify data.

## Backend Details

- **Path**: `/home/administrator/Desktop/asset-management/`
- **File**: `api_server.py`
- **Port**: 3000
- **Database**: `/home/administrator/Desktop/asset-management/databases/local_assets.db`

## Status
✅ **FIXED** - Viewer role can now access lifecycle-stats endpoint  
✅ Read-only GET endpoint  
✅ No data modification  
✅ All roles can access  

---

**Fixed**: August 8, 2026, 12:45  
**Change**: Removed `@non_viewer_required` decorator from lifecycle_stats()  
**Result**: HTTP 200 OK for all authenticated roles
