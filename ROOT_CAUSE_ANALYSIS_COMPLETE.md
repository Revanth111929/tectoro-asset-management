# Root Cause Analysis - Complete Report
**Date:** August 5, 2026  
**Scope:** 6 Production Issues - NO CODE CHANGES  
**Objective:** Identify ONE source of truth, trace complete flows, document exact failure points

---

## ISSUE 1: Employee Status Changes Not Persisting

### **Status:** ❌ API ENDPOINT MISSING

### Root Cause
Frontend calls `employeeAPI.update(empId, data)` → `PUT /employees/{emp_id}`, but **backend has NO such endpoint**.

### Complete Flow Trace
1. **Frontend**: `EmployeeEdit.js` → `handleSubmit()` line 54
2. **Frontend API**: `api.js` line 226: `update: (empId, data) => api.put(\`/employees/\${empId}\`, data)`
3. **Backend**: `routes.py` **MISSING** `PUT /employees/{emp_id}` endpoint
4. **Existing Backend**: Line 1469 has `POST /employees` (`create_or_update_employee`) expecting `emp_id` in body, not URL

### Failure Point
**API Layer** - Request returns 404, frontend navigates back without reload, shows stale cached data from initial load.

### Files Involved
- `frontend/src/services/api.js` line 226
- `routes.py` lines 1469+ (has POST, missing PUT)
- `frontend/src/pages/EmployeeEdit.js` line 54

### Source of Truth
✅ **Employee table** (models.py line 714) - schema correct, API incomplete

---

## ISSUE 2: Asset Status Can Be "Assigned" Without Employee

### **Status:** ⚠️ UX ISSUE (Backend Correct)

### Root Cause
`AssetEdit.js` `handleEmployeeClear()` clears employee fields but **doesn't auto-set status to Available**. Backend validation works, but frontend doesn't help user.

### Complete Flow Trace
1. **User Action**: Clears employee in AssetEdit → `handleEmployeeClear()` line 77
2. **Frontend**: Sets `emp_id='', employee_name='', employee_email='', mobile_number=''`
3. **Frontend**: Status dropdown remains at whatever user previously selected (could be "Assigned")
4. **User Saves**: Form submits with `emp_id=''` and `status='Assigned'`
5. **Backend Validation**: `inventory_validator.py` line 572-577 **REJECTS** (BUG-022 fix working ✓)
6. **Result**: Save fails with error message, user confused

### What's Working
- ✅ Backend validator (`inventory_validator.py` lines 562-577) enforces rule
- ✅ `operations_service.py` `return_asset()` (line 192) sets Available before clearing employee
- ✅ Database integrity protected

### What's NOT Working
- ❌ Frontend doesn't auto-change status when employee cleared
- ❌ No visual guidance (disabled dropdown, warning message)

### Files Involved
- `frontend/src/pages/AssetEdit.js` line 77 `handleEmployeeClear`
- `utils/inventory_validator.py` lines 562-577 (validation correct)
- `services/operations_service.py` line 192 (return operation correct)

### Source of Truth
✅ **Backend validation** enforces integrity, frontend should match this logic

---

## ISSUE 3: Employee Auto-fill Missing Fields

### **Status:** ✅ CORRECT FOR SCHEMA (No Bug)

### Root Cause
**NO BUG** - Asset table schema doesn't have team/project/manager columns. These are **Employee Master display fields only**.

### Database Schema Analysis

**Employee Model** (models.py lines 714-760):
- emp_id ✓
- employee_name ✓
- email ✓
- mobile_number ✓
- department ✓
- designation ✓
- location ✓
- **status** (Employee status: Active/Inactive/Exited) - Employee table only
- **team** (line 723) - Employee table only
- **project** (line 724) - Employee table only
- **manager** (line 725) - Employee table only

**Asset Model** (models.py lines 27-200):
- emp_id ✓
- employee_name ✓
- employee_email ✓
- mobile_number ✓
- department ❌ (NO column)
- designation ❌ (NO column)
- location ✓ (but this is ASSET location, not employee location)
- status ✓ (but this is ASSET status: Available/Assigned/Maintenance/Retired, NOT employee status)
- **team ❌ NO COLUMN**
- **project ❌ NO COLUMN**
- **manager ❌ NO COLUMN**

### Frontend Mapping (CORRECT)

**AssetAdd.js** line 552-562:
```javascript
handleEmployeeSelectFromMaster: (employee) => {
  emp_id:         employee.emp_id,
  employee_name:  employee.employee_name,
  employee_email: employee.email,
  mobile_number:  employee.mobile_number,
  department:     employee.department,    // BUG-029 added
  designation:    employee.designation,   // BUG-029 added
  location:       employee.location       // BUG-029 added
}
```

**AssetEdit.js** line 60-72 (same mapping after BUG-029 fix)

### Why Missing Fields Are Correct
- **team/project/manager** exist in Employee table for HR/reporting purposes
- Asset assignments don't need to duplicate this org chart data
- If needed for reports, should query Employee table using `emp_id` foreign key

### Files Involved
- `models.py` line 714 Employee, line 27 Asset
- `frontend/src/pages/AssetAdd.js` line 552
- `frontend/src/pages/AssetEdit.js` line 60

### Source of Truth
✅ **Employee table** for employee attributes, **Asset table** stores only `emp_id` reference

---

## ISSUE 4: Employee Search Not Using Employee Table

### **Status:** ✅ CORRECT (BUG-026 Fixed)

### Root Cause
**NO CURRENT BUG** - Employee search correctly uses Employee table as single source of truth. BUG-026 fix already changed this.

### Complete Flow Trace

1. **Frontend Component**: `EmployeeAutocomplete.js` line 57
   ```javascript
   const response = await employeeAPI.search(term);
   ```

2. **Frontend API**: `api.js` line 221
   ```javascript
   search: (q) => api.get('/employees', { params: { q } })
   ```

3. **Backend Route**: `routes.py` lines 1436-1451 `get_employees()`
   ```python
   from models import Employee              # line 1443
   employee_query = Employee.query          # line 1445
   ```

4. **Query Filters**: Lines 1447-1450
   ```python
   or_(Employee.emp_id.ilike(f'%{q}%'),
       Employee.employee_name.ilike(f'%{q}%'),
       Employee.email.ilike(f'%{q}%'))
   ```

5. **Response**: Line 1451 `return jsonify([emp.to_dict() for emp in employees])`

### No Caching Issues
- ❌ No localStorage
- ❌ No sessionStorage  
- ❌ No global cache
- ✓ `Employees.js` loads employee list to **local state** for that page only
- ✓ `EmployeeAutocomplete` makes **fresh API call** every time (lines 54-72)

### No Asset Table Queries
- ✅ BUG-026 fix removed Asset table query
- ✅ Now exclusively uses Employee table

### Files Involved
- `frontend/src/components/EmployeeAutocomplete.js` line 57
- `frontend/src/services/api.js` line 221
- `routes.py` lines 1436-1451
- `models.py` line 714 Employee

### Source of Truth
✅ **Employee table** - single source, no duplication, no caching

---

## ISSUE 5: Invoice Fields Disappeared

### **Status:** ✅ FIXED (BUG-027 Resolved)

### Root Cause
**ALREADY FIXED** - BUG-027 added invoice fields to `categoryFields.js`. Invoice support is complete end-to-end.

### Complete Flow Trace

#### 1. Database Schema ✅
```python
# models.py Asset class
invoice_number = db.Column(db.String(100))  # line 79
invoice_date   = db.Column(db.Date)         # line 82
```

#### 2. Backend API ✅
**Create Asset** (`routes.py` lines 706-707):
```python
invoice_number  = data.get('invoice_number', ''),
invoice_date    = parse_date(data.get('invoice_date')),
```

**Update Asset** (`routes.py` lines 547-548):
```python
if 'invoice_date' in data:
    asset.invoice_date = parse_date(data['invoice_date'])
```

**Response** (`models.py` Asset.to_dict()):
```python
'invoice_number': self.invoice_number or '',
'invoice_date':   self.invoice_date.isoformat() if self.invoice_date else '',
```

#### 3. Frontend Config ✅
**categoryFields.js** (BUG-027 fix):
```javascript
// ALL categories now have:
purchase: [
  'purchase_vendor',
  'purchase_price', 
  'purchase_date',
  'invoice_number',    // BUG-027 added
  'invoice_date',      // BUG-027 added
  'warranty_start_date',
  'warranty_end_date'
]
```

**FIELD_METADATA**:
```javascript
invoice_number: { label: 'Invoice Number', type: 'text', placeholder: 'e.g. INV-2024-001' },
invoice_date:   { label: 'Invoice Date', type: 'date' },
```

#### 4. Frontend Display ✅

**AssetAdd.js**: Uses `DynamicAssetForm` → renders purchase section → includes invoice fields

**AssetEdit.js** lines 415-430:
```javascript
<div className="col-md-4">
  <label className="form-label">Invoice Number</label>
  <input type="text" name="invoice_number" ... />
</div>
<div className="col-md-4">
  <label className="form-label">Invoice Date</label>
  <input type="date" name="invoice_date" ... />
</div>
```

### Data Flow (COMPLETE)
```
Add Asset:  Form → assetAPI.create() → POST /api/assets → Database
Edit Asset: Form → assetAPI.update() → PUT /api/assets/{id} → Database
View Asset: GET /api/assets/{id} → Asset.to_dict() → Frontend display
```

### Files Involved
- `models.py` lines 79, 82
- `routes.py` lines 547-548, 706-707
- `frontend/src/config/categoryFields.js` (BUG-027 fix)
- `frontend/src/components/DynamicAssetForm.js` line 249
- `frontend/src/pages/AssetEdit.js` lines 415-430

### Source of Truth
✅ **Asset.invoice_number** and **Asset.invoice_date** columns - full stack support

---

## ISSUE 6: Delete Buttons in Wrong Places

### **Status:** ❌ PARTIALLY FIXED (Bulk Delete Missed)

### Root Cause
BUG-025 removed individual delete button from AssetList, but **forgot to remove bulk delete functionality**.

### Delete Architecture Audit

#### ✅ CORRECT: Delete EXISTS in Inventory Master
**File**: `InventoryCategory.js`
- Line 284: `handleSingleDelete` function
- Line 302: Calls `assetAPI.delete(asset.id)`
- Line 482: Delete button in actions column
- **This is the ONLY place delete should exist** ✓

#### ❌ PROBLEM: Delete STILL in AssetList
**File**: `AssetList.js`
- Line 150: `assetAPI.delete(id)` in bulk delete handler
- Line 142-156: Bulk delete code still executes
- Line 236: Comment says "handleDelete removed" (misleading)
- Line 477: Individual delete button removed ✓ (correct)
- Line 368: Bulk actions dropdown includes "Delete Selected" option

**User can still delete assets from "All Assets" page using bulk actions**

#### ✅ CORRECT: No Delete in Other Pages
- AssetEdit.js: NO delete ✓
- AssetView.js: NO delete ✓
- AssetTimeline.js: NO delete ✓
- AssetImport.js: NO delete ✓
- AssetReplacements.js: Has own delete (for replacements records, not assets) ✓
- Reports/Dashboard: NO delete ✓

### Files Involved
- `frontend/src/pages/InventoryCategory.js` lines 284, 302, 482 (correct)
- `frontend/src/pages/AssetList.js` lines 142-156, 368 (needs fixing)

### Required Fix
Remove bulk delete functionality from AssetList.js:
1. Remove "Delete Selected" option from bulk actions dropdown (line 368)
2. Remove `if (bulkAction === 'delete')` block (lines 142-156)
3. Add comment explaining delete only in Inventory

---

## Summary: Sources of Truth

| Entity | Source of Truth | Location | Status |
|--------|----------------|----------|--------|
| **Employees** | Employee table | `models.py` line 714 | ✅ Correct |
| **Employee Search** | Employee.query | `routes.py` line 1445 | ✅ Correct |
| **Employee Status** | Employee.status column | `models.py` line 729 | ⚠️ API missing PUT |
| **Assets** | Asset table | `models.py` line 27 | ✅ Correct |
| **Asset Assignment** | Backend validator | `inventory_validator.py` 562-577 | ✅ Correct |
| **Invoice Data** | Asset columns | `models.py` lines 79, 82 | ✅ Complete |
| **Delete Operations** | InventoryCategory.js | Only here | ⚠️ Bulk delete leak |

---

## Issues Requiring Fixes

### Priority 1: Functionality Broken
1. **ISSUE 1**: Add `PUT /employees/{emp_id}` endpoint to `routes.py`

### Priority 2: UX/Safety Issues  
2. **ISSUE 2**: AssetEdit should auto-set status to Available when employee cleared
3. **ISSUE 6**: Remove bulk delete from AssetList.js

### Priority 3: No Action Needed
4. **ISSUE 3**: ✅ Correct - Asset table doesn't need team/project/manager
5. **ISSUE 4**: ✅ Correct - Employee search uses Employee table
6. **ISSUE 5**: ✅ Correct - Invoice support complete (BUG-027 fixed)

---

## NO CODE CHANGES MADE

This analysis traced all 6 issues through complete request/response cycles without modifying any files. All findings documented for comprehensive fix plan.

**Analysis Complete**: Ready for implementation phase with full understanding of:
- ✅ Data flow paths
- ✅ Validation points
- ✅ Sources of truth
- ✅ Failure locations
- ✅ Regression risks
