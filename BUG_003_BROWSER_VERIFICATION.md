# BUG-003 BROWSER RUNTIME VERIFICATION GUIDE

## DEPLOYMENT CONFIRMED

**Backend**: 1 process (PID 75129) listening on port 3000 ✅  
**Frontend Bundle**: main.079a9c97.js (built Aug 4 22:54) ✅  
**Database**: production.db ✅  

---

## STEP 1: Clear Browser Cache & Verify Fresh Bundle

### 1.1 Open Browser DevTools
- Press `F12` or `Ctrl+Shift+I`
- Go to **Network** tab

### 1.2 Disable Cache
- Check the box: **"Disable cache"**
- Keep DevTools open (cache only disabled while DevTools is open)

### 1.3 Hard Refresh
- Press `Ctrl+Shift+R` (Linux/Windows) or `Cmd+Shift+R` (Mac)
- OR right-click refresh button → "Empty Cache and Hard Reload"

### 1.4 Verify New Bundle Downloaded
In Network tab, look for:
```
main.079a9c97.js
Status: 200 (not "disk cache" or "memory cache")
Size: ~1.4 MB
Type: javascript
```

**CHECKPOINT**: Bundle filename must be `main.079a9c97.js` (matches build timestamp Aug 4 22:54)

---

## STEP 2: Complete Workflow Trace - Employee Lookup

### 2.1 Navigate to AssetEdit
1. Click **"Assets"** in sidebar
2. Click **"View"** on any asset
3. Click **"Edit"** button

### 2.2 Open React DevTools (Optional)
- Install React DevTools extension if not installed
- Open React tab in DevTools
- Find `AssetEdit` component
- Watch state changes

### 2.3 Test Employee Search

#### Input: Type in Search Box
```
Type: "RG025"
```

**Watch Network Tab**:
```
Request URL: http://localhost:3000/api/employees?q=RG025
Method: GET
Status: 200
```

**Click on the request → Preview tab**:
```json
[
  {
    "emp_id": "RG025",
    "employee_name": "Lakshmi Amulya Madhinni",
    "status": "Active",
    "is_active": true,
    "email": "LakshmiAmulyaMadhinni@radiogram.com",
    "department": "Radiogram",
    "designation": "Billing Executive"
  }
]
```

**VERIFY FIELDS PRESENT**:
- ✅ `status`: "Active"
- ✅ `is_active`: true

#### Browser Console Check
Open **Console** tab and paste:
```javascript
// Check if filter passes
const emp = {status: "Active", is_active: true};
console.log("Filter check:", emp.status === 'Active' && emp.is_active !== false);
// Should output: Filter check: true
```

#### Visual Check: Dropdown Appears
- Dropdown should show: "RG025 - Lakshmi Amulya Madhinni"
- Email and phone should be visible
- **NO "Employee not found" error**

**CHECKPOINT**: Dropdown must show employee, not "Employee not found"

---

### 2.4 Select Employee

#### Action: Click on Employee in Dropdown
- Click on "RG025 - Lakshmi Amulya Madhinni"

#### Verify State Update (React DevTools)
In React DevTools → AssetEdit component:
```javascript
selectedEmployee: {
  emp_id: "RG025",
  employee_name: "Lakshmi Amulya Madhinni",
  email: "LakshmiAmulyaMadhinni@radiogram.com",
  status: "Active",
  is_active: true,
  ...
}

form: {
  emp_id: "RG025",
  employee_name: "Lakshmi Amulya Madhinni",
  employee_email: "LakshmiAmulyaMadhinni@radiogram.com",
  ...
}
```

#### Visual Check: Form Fields Populated
- Employee ID field: "RG025"
- Employee Name field: "Lakshmi Amulya Madhinni"
- Employee Email field: "LakshmiAmulyaMadhinni@radiogram.com"

**CHECKPOINT**: Form fields auto-fill with employee data

---

### 2.5 Save Asset

#### Action: Click "Update Asset" Button

#### Watch Network Tab
```
Request URL: http://localhost:3000/api/assets/{id}
Method: PUT
Status: 200
Request Payload:
{
  "emp_id": "RG025",
  "employee_name": "Lakshmi Amulya Madhinni",
  "employee_email": "LakshmiAmulyaMadhinni@radiogram.com",
  ...
}
```

#### Response Check
```json
{
  "message": "Asset updated successfully",
  "asset": { ... }
}
```

**CHECKPOINT**: Save request returns 200

---

### 2.6 Verify Database Persistence

#### Action: Hard Refresh Page (Ctrl+Shift+R)

#### Visual Check: Data Persists
After page reload:
- Employee ID still shows: "RG025"
- Employee Name still shows: "Lakshmi Amulya Madhinni"
- Selected employee still shown in autocomplete

#### Network Check: Asset Load
```
Request URL: http://localhost:3000/api/assets/{id}
Method: GET
Status: 200
Response:
{
  "emp_id": "RG025",
  "employee_name": "Lakshmi Amulya Madhinni",
  ...
}
```

**CHECKPOINT**: Employee assignment persists after refresh

---

### 2.7 Verify Dashboard Updates

#### Action: Navigate to Dashboard
1. Click "Dashboard" in sidebar

#### Visual Check: Asset Count
- "Assigned" count should include this asset
- If employee had 0 assets before, count should increase

**CHECKPOINT**: Dashboard reflects assignment

---

### 2.8 Verify Inventory Updates

#### Action: Navigate to Inventory
1. Click inventory category for this asset (e.g., "Laptop")
2. Find the asset in the list

#### Visual Check: Employee Column
- Employee column shows: "RG025 - Lakshmi Amulya Madhinni"
- Status shows: "Assigned"

**CHECKPOINT**: Inventory shows employee assignment

---

## STEP 3: Complete Data Flow Trace Values

### Browser Input
```
searchTerm = "RG025"
```

### Network Request
```
GET /api/employees?q=RG025
Authorization: Bearer <token>
```

### Backend Response
```json
[{
  "emp_id": "RG025",
  "employee_name": "Lakshmi Amulya Madhinni",
  "status": "Active",
  "is_active": true,
  "email": "LakshmiAmulyaMadhinni@radiogram.com"
}]
```

### Axios Response (api.js)
```javascript
response.data = [{...employee data...}]
```

### EmployeeAutocomplete State
```javascript
employees = [{...}]  // API response
filtered = employees.filter(emp => 
  emp.status === 'Active' && emp.is_active !== false
)
// Result: [{...}] (passes filter)

setSuggestions(filtered)
```

### React Dropdown
```javascript
suggestions = [{emp_id: "RG025", ...}]
suggestions.length > 0 → show dropdown
notFound = false
```

### User Selection
```javascript
handleSelect(employee)
→ setSelectedEmployee({emp_id: "RG025", ...})
→ setForm({...form, emp_id: "RG025", ...})
```

### Form Submit
```javascript
PUT /api/assets/{id}
Body: {emp_id: "RG025", employee_name: "...", ...}
```

### Backend Processing
```python
asset.emp_id = "RG025"
asset.employee_name = "Lakshmi Amulya Madhinni"
db.session.commit()
```

### Database
```sql
UPDATE assets 
SET emp_id='RG025', 
    employee_name='Lakshmi Amulya Madhinni',
    status='Assigned'
WHERE id={id}
```

### Page Reload
```javascript
GET /api/assets/{id}
Response: {emp_id: "RG025", ...}
→ Form populated with saved data
```

---

## FAILURE SCENARIOS TO CHECK

### Test 1: Inactive Employee Should NOT Appear
1. Search for inactive employee
2. **EXPECTED**: Empty dropdown or "not found" message
3. **NOT**: Should show inactive employees

### Test 2: Employee Without status/is_active Fields (Old API)
**This should NOT happen anymore** - backend now includes these fields
- If it does happen: Employee filtered out, "not found" shown

### Test 3: Network Error
1. Stop backend: `./production_stop.sh`
2. Try searching employee
3. **EXPECTED**: Error message, not crash
4. Restart: `./production_start.sh`

---

## SUCCESS CRITERIA - ALL MUST PASS

- ✅ Browser loads new bundle (main.079a9c97.js)
- ✅ No cached JavaScript
- ✅ Search "RG025" → Dropdown shows employee
- ✅ NO "Employee not found" error
- ✅ Click employee → Form fields populate
- ✅ Save asset → Returns 200
- ✅ Refresh page → Employee still assigned
- ✅ Dashboard shows updated count
- ✅ Inventory shows employee assignment
- ✅ No console errors
- ✅ No React errors

---

## DEBUGGING COMMANDS

### Check Current Bundle
```bash
ls -lh frontend/build/static/js/main.*.js
```

### Check Backend Process
```bash
ps aux | grep api_server | grep -v grep
```

### Check Port
```bash
lsof -i:3000
```

### Restart Backend
```bash
./production_stop.sh
./production_start.sh
```

### View Backend Logs
```bash
tail -f logs/production.log
```

---

## CURRENT STATUS

**Deployment**: ✅ Verified  
**Backend API**: ✅ Runtime Verified  
**Frontend Build**: ✅ Contains Fix  
**Browser Cache**: ❌ Awaiting Clear  
**Employee Lookup**: ❌ Awaiting Browser Test  
**Complete Workflow**: ❌ Awaiting Manual Verification  

**BUG-003 STATUS**: OPEN - Awaiting user browser verification
