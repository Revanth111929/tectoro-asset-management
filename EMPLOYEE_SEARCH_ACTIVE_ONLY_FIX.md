# Employee Search - Active Only Filter for Asset Assignment

## Issue Fixed
**BUG:** Employee search dropdown during asset assignment was showing Active, Inactive, and Exited employees. This allowed users to select inactive or exited employees for asset assignment.

**Required Behavior:** Only Active employees should appear in the employee search used for asset assignment.

## Solution Implemented

### Backend Changes

**File:** `api_server.py` (Line ~2349-2380)

Added `active_only` query parameter to the employee search endpoint:

```python
@app.route('/api/employees', methods=['GET'])
@admin_required
def get_employees():
    """Get all employees or search by query - searches both Employee table and Assets
    
    Query Parameters:
        q (str): Search term
        page (int): Page number (default: 1)
        per_page (int): Results per page (default: 50)
        active_only (bool): Filter to only Active employees (default: false)
                           Used during asset assignment to prevent assigning to inactive/exited employees
    """
    from models import Employee, Asset
    
    query = request.args.get('q', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    active_only = request.args.get('active_only', 'false').lower() in ('true', '1', 'yes')
    
    employees_list = []
    
    # First, try to get from Employee table
    q = Employee.query
    
    # BUG FIX: Filter to only Active employees when active_only=true
    if active_only:
        logger.info(f"[Employee Search] Filtering to Active employees only")
        q = q.filter(Employee.status == 'Active', Employee.is_active == True)
    
    # ... rest of the query logic
```

**When `active_only=true`:**
- Only returns employees where `status = 'Active'` AND `is_active = True`
- Applies BEFORE the search query filter

**When `active_only` is omitted or false:**
- Returns all employees (backward compatible)
- Employee Master page continues to show all employees

### Frontend Changes

#### 1. API Service

**File:** `frontend/src/services/api.js` (Line ~285-292)

Updated `employeeAPI.search()` to accept both string and params object:

```javascript
export const employeeAPI = {
  search: (paramsOrQuery) => {
    // Support both old string format and new params object
    const params = typeof paramsOrQuery === 'string' 
      ? { q: paramsOrQuery } 
      : paramsOrQuery;
    return api.get('/employees', { params });
  },
  // ... other methods
}
```

**Backward Compatible:**
- Old: `employeeAPI.search('john')` → `GET /employees?q=john`
- New: `employeeAPI.search({ q: 'john', active_only: 'true' })` → `GET /employees?q=john&active_only=true`

#### 2. EmployeeAutocomplete Component

**File:** `frontend/src/components/EmployeeAutocomplete.js`

**Added `activeOnly` prop:**
```javascript
function EmployeeAutocomplete({ 
  value,
  onChange,
  onClear,
  required = false,
  disabled = false,
  placeholder = "Search employee by ID, name, email...",
  error = null,
  showDetails = true,
  activeOnly = false   // NEW: Filter to only Active employees
}) {
```

**Updated search logic:**
```javascript
const handleSearch = async (term) => {
  // ...
  try {
    setLoading(true);
    // BUG FIX: Pass active_only parameter when filtering for asset assignment
    const params = { q: term };
    if (activeOnly) {
      params.active_only = 'true';
    }
    const response = await employeeAPI.search(params);
    const employees = response.data || [];
    // ...
  }
};
```

**Usage:**
- Asset Assignment: `<EmployeeAutocomplete activeOnly={true} ... />`
- Employee Master: `<EmployeeAutocomplete activeOnly={false} ... />`

#### 3. AssetAdd Page (Existing Device Tab)

**File:** `frontend/src/pages/AssetAdd.js` (Lines ~498-529)

Updated both employee search functions:

```javascript
// Search employees as user types
const handleEmpSearch = async (val) => {
  setForm(f => ({ ...f, emp_id: val }));
  if (val.length < 2) { setEmpSuggestions([]); return; }
  try {
    // BUG FIX: Only show Active employees for asset assignment
    const res = await employeeAPI.search({ q: val, active_only: 'true' });
    setEmpSuggestions(res.data || []);
  } catch {}
};

// Search for employee and their assets
const handleEmployeeSearchForAssets = async (val) => {
  setEmployeeSearch(val);
  if (val.length < 2) { 
    setEmployeeSearchResults([]);
    setEmployeeAssets([]);
    return;
  }
  try {
    // BUG FIX: Only show Active employees for asset assignment
    const res = await employeeAPI.search({ q: val, active_only: 'true' });
    setEmployeeSearchResults(res.data || []);
  } catch (err) {
    setEmployeeSearchResults([]);
  }
};
```

## What Was NOT Changed

✅ **Employee Master Page:** Still shows all employees (Active, Inactive, Exited)
✅ **Employee Search Page:** Unchanged
✅ **Employee Edit:** Unchanged
✅ **Asset List:** Unchanged
✅ **Inventory:** Unchanged
✅ **Dashboard:** Unchanged
✅ **Other modules using employee search:** Unchanged (they don't pass `active_only`)

## Verification

### Test Case 1: Asset Assignment - Active Employee Only

**Steps:**
1. Open: http://localhost:3000
2. Navigate to: Assets → Add Asset → "Existing/Old Device" tab
3. Search for an Active employee (e.g., type "e")
4. **Expected:** Only Active employees appear in dropdown
5. Search for an Inactive employee's name
6. **Expected:** Employee does NOT appear in suggestions

### Test Case 2: Employee Master - All Employees

**Steps:**
1. Navigate to: Employee Master
2. View employee list
3. **Expected:** Shows all employees (Active, Inactive, Exited)
4. Click "Add Employee" or "Edit Employee"
5. **Expected:** No filtering, all employees accessible

### Backend Verification

Check backend logs when searching during asset assignment:

```
[INFO] [Employee Search] Filtering to Active employees only
```

### API Testing

**With active_only filter:**
```bash
curl -X GET "http://localhost:3000/api/employees?q=test&active_only=true" \
  -H "Authorization: Bearer $TOKEN"
```
Expected: Only employees with `status='Active'` and `is_active=true`

**Without filter (backward compatible):**
```bash
curl -X GET "http://localhost:3000/api/employees?q=test" \
  -H "Authorization: Bearer $TOKEN"
```
Expected: All employees matching search term

### Database Query

```sql
-- With active_only=true
SELECT * FROM employee_master 
WHERE status = 'Active' 
AND is_active = 1
AND (
  emp_id LIKE '%search%' OR 
  employee_name LIKE '%search%' OR
  email LIKE '%search%'
);

-- Without active_only (default)
SELECT * FROM employee_master 
WHERE (
  emp_id LIKE '%search%' OR 
  employee_name LIKE '%search%' OR
  email LIKE '%search%'
);
```

## Files Modified

1. **Backend:**
   - `api_server.py` - Added `active_only` parameter to employee search endpoint

2. **Frontend:**
   - `frontend/src/services/api.js` - Updated `employeeAPI.search()` to accept params object
   - `frontend/src/components/EmployeeAutocomplete.js` - Added `activeOnly` prop
   - `frontend/src/pages/AssetAdd.js` - Pass `active_only: 'true'` in both search functions

## Build Status

✅ Frontend build: SUCCESS  
✅ Backend restart: SUCCESS  
✅ No compilation errors  
✅ Backward compatible - old code continues to work  

## Testing Required

### Verify Active-Only Filtering

1. **Create test employees:**
   - Employee 1: `status='Active'`, `is_active=True`
   - Employee 2: `status='Inactive'`, `is_active=False`
   - Employee 3: `status='Exited'`, `is_active=False`

2. **Test Asset Assignment:**
   - Go to Add Asset → Existing Device
   - Search for employees
   - **Expected:** Only Employee 1 appears
   - **Expected:** Employees 2 and 3 do NOT appear

3. **Test Employee Master:**
   - Go to Employee Master page
   - **Expected:** All 3 employees visible in the list
   - Filter by status to confirm all statuses work

4. **Test Backward Compatibility:**
   - Any page NOT using `active_only=true` should see all employees
   - Corporate SIM assignment
   - Temporary assignments
   - Other modules

### Expected Behavior Matrix

| Context | Filter Applied | Shows Active | Shows Inactive | Shows Exited |
|---------|---------------|--------------|----------------|--------------|
| Asset Assignment | ✅ Yes (`active_only=true`) | ✅ | ❌ | ❌ |
| Employee Master | ❌ No | ✅ | ✅ | ✅ |
| Employee Search Page | ❌ No | ✅ | ✅ | ✅ |
| Other Modules | ❌ No (unless explicitly set) | ✅ | ✅ | ✅ |

## Implementation Notes

### Why This Approach?

1. **Minimal Code Changes:** Added optional parameter instead of creating new endpoint
2. **Backward Compatible:** Existing code continues to work without modification
3. **Explicit Opt-In:** Pages must explicitly request `active_only=true`
4. **Reusable:** Can be used by any feature that needs active-only filtering
5. **Clear Intent:** Parameter name makes the filtering intent obvious

### Alternative Approaches Considered

❌ **Separate endpoint** (`/api/employees/active`) - Creates duplication  
❌ **Always filter in component** - Breaks Employee Master  
❌ **Frontend-only filter** - Inefficient, downloads all employees  
✅ **Optional parameter** - Clean, backward compatible, server-side efficient

## Status

✅ **ROOT CAUSE:** Employee search showed all employees regardless of status  
✅ **FIX APPLIED:** Added `active_only` parameter to filter server-side  
✅ **FRONTEND UPDATED:** AssetAdd passes `active_only=true`  
✅ **BACKWARD COMPATIBLE:** Other pages unchanged  
✅ **READY FOR TESTING:** All systems operational  

## Next Action Required

**USER TESTING:** Please verify:

1. Asset assignment only shows Active employees
2. Employee Master still shows all employees
3. No other features broken
4. Backend logs show filtering when expected

If any Inactive or Exited employees still appear during asset assignment, please:
1. Check browser console for the API call
2. Verify URL contains `active_only=true`
3. Check backend logs for filtering message
4. Share screenshots or error messages
