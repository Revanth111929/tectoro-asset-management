# Asset Edit - Employee Search Active-Only Filter Debug

## Issue
AssetEdit page employee dropdown was showing Inactive and Exited employees.

## Root Cause Found
**AssetEdit.js line 305** was using `<EmployeeAutocomplete>` but **NOT passing `activeOnly={true}` prop**.

## Fix Applied

### File: `frontend/src/pages/AssetEdit.js` (Line ~305-310)

**BEFORE:**
```javascript
<EmployeeAutocomplete
  value={selectedEmployee}
  onChange={handleEmployeeSelect}
  onClear={handleEmployeeClear}
  placeholder="Search by Employee ID, Name, Email, or Phone..."
  showDetails={true}
/>
```

**AFTER:**
```javascript
<EmployeeAutocomplete
  value={selectedEmployee}
  onChange={handleEmployeeSelect}
  onClear={handleEmployeyClear}
  placeholder="Search by Employee ID, Name, Email, or Phone..."
  showDetails={true}
  activeOnly={true}  // ✅ ADDED
/>
```

## Comprehensive Logging Added

### Frontend Logging

**File:** `frontend/src/components/EmployeeAutocomplete.js`

Added detailed console logs in `handleSearch()`:

```javascript
// STEP 2: Log the params being sent
console.log('[EmployeeAutocomplete] Search params:', params);
console.log('[EmployeeAutocomplete] activeOnly prop:', activeOnly);
console.log('[EmployeeAutocomplete] API call: GET /api/employees with params:', JSON.stringify(params));

const response = await employeeAPI.search(params);
const employees = response.data || [];

// STEP 6: Log the response received
console.log('[EmployeeAutocomplete] API response received:', employees.length, 'employees');
console.log('[EmployeeAutocomplete] First 3 employees:', employees.slice(0, 3).map(e => ({
  emp_id: e.emp_id,
  name: e.employee_name,
  status: e.status
})));

// Check for non-Active employees in response
const nonActive = employees.filter(e => e.status !== 'Active');
if (nonActive.length > 0 && activeOnly) {
  console.warn('[EmployeeAutocomplete] WARNING: activeOnly=true but response contains non-Active employees!');
  console.warn('[EmployeeAutocomplete] Non-Active employees:', nonActive.map(e => ({
    emp_id: e.emp_id,
    name: e.employee_name,
    status: e.status
  })));
}
```

### Backend Logging

**File:** `api_server.py` (Line ~2349-2430)

Added detailed server logs:

```python
# STEP 4: Log what Flask receives
logger.info(f"[Employee Search] request.args: {dict(request.args)}")

query = request.args.get('q', '').strip()
page = request.args.get('page', 1, type=int)
per_page = request.args.get('per_page', 50, type=int)
active_only = request.args.get('active_only', 'false').lower() in ('true', '1', 'yes')

# STEP 4: Log the parsed values
logger.info(f"[Employee Search] Parsed - q='{query}', active_only={active_only}, page={page}, per_page={per_page}")

# BUG FIX: Filter to only Active employees when active_only=true
if active_only:
    logger.info(f"[Employee Search] Applying Active-only filter: status='Active' AND is_active=True")
    q = q.filter(Employee.status == 'Active', Employee.is_active == True)
else:
    logger.info(f"[Employee Search] No status filter applied (showing all employees)")

# STEP 5: Log the query
logger.info(f"[Employee Search] Executing query...")

employees_from_table = q.order_by(Employee.created_at.desc()).offset((page-1)*per_page).limit(per_page).all()

# STEP 6: Log results
logger.info(f"[Employee Search] Found {len(employees_from_table)} employees from Employee Master")

# ... after response is prepared ...

# STEP 6: Log final response
logger.info(f"[Employee Search] Returning {len(employees_list)} total employees")
if employees_list:
    status_counts = {}
    for e in employees_list:
        status = e.get('status', 'N/A')
        status_counts[status] = status_counts.get(status, 0) + 1
    logger.info(f"[Employee Search] Status breakdown: {status_counts}")
    logger.info(f"[Employee Search] First 3 results: {[{k: e.get(k) for k in ['emp_id', 'employee_name', 'status']} for e in employees_list[:3]]}")
```

## Testing Instructions

### Step 1: Open Asset Edit

1. Go to: http://localhost:3000
2. Navigate to: Assets → Click any asset → Edit
3. Scroll to "Employee Information" section

### Step 2: Open Browser Console

1. Press F12
2. Go to "Console" tab
3. Clear any existing logs

### Step 3: Search for Employee

1. In the "Search Employee" field, type: `Rg` (or any search term)
2. **Watch Browser Console** for logs like:

```
[EmployeeAutocomplete] Search params: {q: "Rg", active_only: "true"}
[EmployeeAutocomplete] activeOnly prop: true
[EmployeeAutocomplete] API call: GET /api/employees with params: {"q":"Rg","active_only":"true"}
```

### Step 4: Check Network Tab

1. In DevTools, go to "Network" tab
2. Find the request to `/api/employees?q=Rg&active_only=true`
3. **Verify URL contains `active_only=true`**

Expected:
```
GET http://localhost:3000/api/employees?q=Rg&active_only=true
```

If URL is missing `active_only=true`, the frontend fix is not working.

### Step 5: Check Backend Logs

In the terminal running `api_server.py`, you should see:

```
[INFO] [Employee Search] request.args: {'q': 'Rg', 'active_only': 'true'}
[INFO] [Employee Search] Parsed - q='Rg', active_only=True, page=1, per_page=50
[INFO] [Employee Search] Applying Active-only filter: status='Active' AND is_active=True
[INFO] [Employee Search] Executing query...
[INFO] [Employee Search] Found 2 employees from Employee Master
[INFO] [Employee Search] Returning 2 total employees
[INFO] [Employee Search] Status breakdown: {'Active': 2}
[INFO] [Employee Search] First 3 results: [{'emp_id': 'RG025', 'employee_name': 'Test Employee', 'status': 'Active'}, ...]
```

**If you see:**
- `active_only=False` → Frontend is not sending the parameter
- `No status filter applied` → Backend is not receiving active_only=true
- `Status breakdown: {'Active': X, 'Inactive': Y}` → Filter is not working

### Step 6: Check Browser Console Response

After API call completes, check console for:

```
[EmployeeAutocomplete] API response received: 2 employees
[EmployeeAutocomplete] First 3 employees: [
  {emp_id: "RG025", name: "Test Employee", status: "Active"},
  {emp_id: "RG020", name: "Sumanth Miryala", status: "Active"}
]
```

**If you see WARNING:**
```
[EmployeeAutocomplete] WARNING: activeOnly=true but response contains non-Active employees!
[EmployeeAutocomplete] Non-Active employees: [
  {emp_id: "RG024", name: "Ashok Patole", status: "Inactive"}
]
```

This means the backend filter is **NOT working correctly**.

### Step 7: Verify Dropdown

The dropdown should show **ONLY Active employees**.

**Expected:**
- RG025 - Test Employee
- RG020 - Sumanth Miryala
- (all with no badges or only showing Active status)

**NOT Expected:**
- RG024 - Ashok Patole (Inactive badge)
- RG023 - Kalpesh Hake (Inactive badge)
- RG021 - Jaya Prakash (Exited badge)

## Diagnostic Checklist

Use this checklist to diagnose where the issue is:

| Step | Check | Expected | If Failed |
|------|-------|----------|-----------|
| 1 | Browser console shows `activeOnly prop: true` | Yes | AssetEdit not passing prop |
| 2 | Browser console shows `active_only: "true"` in params | Yes | EmployeeAutocomplete not using prop |
| 3 | Network tab shows `?active_only=true` in URL | Yes | API service not sending param |
| 4 | Backend logs show `active_only=True` parsed | Yes | Flask not receiving param |
| 5 | Backend logs show "Applying Active-only filter" | Yes | Backend not checking param |
| 6 | Backend logs show only Active in status breakdown | Yes | SQL filter not working |
| 7 | Frontend console shows only Active in response | Yes | Response includes wrong data |
| 8 | Dropdown shows only Active employees | Yes | Frontend rendering wrong data |

## Files Modified

1. **`frontend/src/pages/AssetEdit.js`**
   - Added `activeOnly={true}` prop to EmployeeAutocomplete

2. **`frontend/src/components/EmployeeAutocomplete.js`**
   - Added comprehensive logging for debugging
   - Logs params, API call, response, and warnings

3. **`api_server.py`**
   - Added comprehensive logging for debugging
   - Logs request args, parsed values, filter application, query results, final response

## Status

✅ Frontend fix applied: `activeOnly={true}` added to AssetEdit  
✅ Comprehensive logging added to frontend  
✅ Comprehensive logging added to backend  
✅ Frontend rebuilt  
✅ Backend restarted  
✅ **READY FOR TESTING WITH FULL TRACEABILITY**  

## Next Action Required

**USER TESTING:** 

1. Open Asset Edit page
2. Open Browser Console (F12)
3. Search for an employee (type "Rg" or "e")
4. **Share screenshot or copy-paste of:**
   - Browser console logs
   - Network tab request URL
   - Terminal backend logs
   - The actual dropdown list shown

This will show exactly where in the pipeline the filtering is failing (if it still is).

## Expected Flow (Success Case)

```
User types "Rg" in Asset Edit employee search
    ↓
Frontend: EmployeeAutocomplete receives activeOnly=true
    ↓
Console: [EmployeeAutocomplete] activeOnly prop: true
    ↓
Console: [EmployeeAutocomplete] Search params: {q: "Rg", active_only: "true"}
    ↓
Network: GET /api/employees?q=Rg&active_only=true
    ↓
Backend: [Employee Search] request.args: {'q': 'Rg', 'active_only': 'true'}
    ↓
Backend: [Employee Search] Parsed - active_only=True
    ↓
Backend: [Employee Search] Applying Active-only filter
    ↓
Backend: [Employee Search] Status breakdown: {'Active': 2}
    ↓
Response: [{"emp_id": "RG025", "status": "Active"}, ...]
    ↓
Console: [EmployeeAutocomplete] API response received: 2 employees
    ↓
Console: No WARNING about non-Active employees
    ↓
Dropdown: Shows ONLY Active employees
    ↓
✅ SUCCESS
```

## Failure Scenarios

### Scenario A: Frontend not sending active_only

**Symptoms:**
- Console shows `activeOnly prop: false` or undefined
- Network tab shows `/api/employees?q=Rg` (no active_only)
- Backend logs show `active_only=False`

**Cause:** AssetEdit not passing `activeOnly={true}` or typo in prop name

**Fix:** Verify line 310 in AssetEdit.js has `activeOnly={true}`

### Scenario B: Backend not receiving parameter

**Symptoms:**
- Network shows `active_only=true` in URL
- Backend logs show `active_only=False`

**Cause:** Flask not parsing boolean correctly

**Fix:** Check `request.args.get('active_only')` parsing logic

### Scenario C: Backend filter not applied

**Symptoms:**
- Backend logs show `active_only=True`
- Backend logs show "No status filter applied"
- OR Status breakdown shows Inactive/Exited

**Cause:** Filter logic bug or filter removed later

**Fix:** Check SQL query construction and verify no code removes filter

### Scenario D: Response includes wrong data

**Symptoms:**
- Backend logs show only Active in status breakdown
- Frontend console shows Inactive/Exited in response
- WARNING logged about non-Active employees

**Cause:** Response serialization issue or caching

**Fix:** Check response JSON construction and clear browser cache
