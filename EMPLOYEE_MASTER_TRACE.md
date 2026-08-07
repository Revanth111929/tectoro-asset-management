# Employee Master Frontend Data Flow Trace

## QUESTION
Why does Employee Master show "Active" badge when database contains "Inactive"?

---

## COMPLETE TRACE

### 1. WHERE loadEmployees() IS CALLED

**File:** `frontend/src/pages/Employees.js`

**Line 28:**
```javascript
useEffect(() => {
  loadEmployees();
}, []);
```

**Called:** Once on component mount (empty dependency array)

**NOT called again when:**
- Navigating back from Edit page
- Component re-renders
- Props/state change

---

### 2. ENDPOINT USED

**File:** `frontend/src/pages/Employees.js`  
**Line 31-33:**
```javascript
const loadEmployees = async () => {
  setLoading(true);
  const empRes = await employeeAPI.search('');  // ← CALLS THIS
```

**File:** `frontend/src/services/api.js`  
**Line 221:**
```javascript
search: (q) => api.get('/employees', { params: { q } }),
```

**ENDPOINT:**
```
GET /api/employees?q=
```

**Backend Route:** `routes.py` Line 1435-1457

---

### 3. JSON RETURNED BY API

**Backend Code:** `routes.py` Lines 1435-1457
```python
@api_bp.route('/employees', methods=['GET'])
def get_employees():
    from models import Employee
    
    q = request.args.get('q', '').strip()
    
    employee_query = Employee.query
    if q:
        employee_query = employee_query.filter(
            or_(Employee.emp_id.ilike(f'%{q}%'),
                Employee.employee_name.ilike(f'%{q}%'),
                Employee.email.ilike(f'%{q}%'))
        )
    
    employees = employee_query.order_by(Employee.employee_name).limit(20).all()
    
    return jsonify([emp.to_dict() for emp in employees])
```

**Employee.to_dict():** `models.py` Lines 741-759
```python
def to_dict(self):
    return {
        'id':            self.id,
        'emp_id':        self.emp_id,
        'employee_name': self.employee_name,
        'email':         self.email or '',
        'mobile_number': self.mobile_number or '',
        'department':    self.department or '',
        'designation':   self.designation or '',
        'team':          self.team or '',
        'project':       self.project or '',
        'manager':       self.manager or '',
        'microsoft_license': self.microsoft_license or '',
        'location':      self.location or '',
        'is_active':     self.is_active,
        'status':        self.status or 'Active',  # ← STATUS IS INCLUDED
        'exit_date':     self.exit_date.isoformat() if self.exit_date else None,
        'application_access': self.application_access or '',
        'onboarding_id': self.onboarding_id,
        'created_at':    utc_iso(self.created_at),
        'updated_at':    utc_iso(self.updated_at),
    }
```

**✅ API RETURNS STATUS FIELD**

Example JSON for RG025:
```json
[
  {
    "emp_id": "RG025",
    "employee_name": "Test Employee",
    "status": "Inactive",  ← STATUS IS PRESENT
    "department": "IT",
    "designation": "Engineer",
    ...
  }
]
```

---

### 4. RESPONSE MAPPING

**File:** `frontend/src/pages/Employees.js`  
**Lines 34-42:**

```javascript
if (empRes.data && empRes.data.length > 0) {
  const employeesList = empRes.data.map(emp => ({
    ...emp,  // ← SPREADS ALL FIELDS INCLUDING 'status'
    status: emp.status || 'Active',  // ← KEEPS EXISTING STATUS OR DEFAULTS
    asset_count: 0,
    assets: []
  }));
```

**Mapping:**
```
API Response          →    State
─────────────────────────────────────
emp.status: "Inactive"  →  emp.status: "Inactive"
```

**Line 62:**
```javascript
setEmployees(employeesList);
```

**✅ STATUS IS CORRECTLY MAPPED TO STATE**

---

### 5. STATUS BADGE RENDERING

**File:** `frontend/src/pages/Employees.js`  
**Lines 260-268:**

```javascript
<td>
  <span className={`badge ${
    emp.status === 'Active' ? 'bg-success' :      // ← READS emp.status
    emp.status === 'Exited' ? 'bg-secondary' :
    'bg-warning'
  }`}>
    {emp.status}  // ← DISPLAYS emp.status
  </span>
</td>
```

**Badge Logic:**
```javascript
if (emp.status === 'Active')   → Green badge "Active"
if (emp.status === 'Exited')   → Gray badge "Exited"
else                           → Yellow badge (shows actual status)
```

**✅ BADGE CORRECTLY READS emp.status FROM STATE**

---

### 6. NAVIGATION BACK TO EMPLOYEE MASTER

**File:** `frontend/src/pages/EmployeeAdd.js` (used for both Add and Edit)

**After successful update, Line 99:**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    if (empId) {
      // Edit mode
      await employeeAPI.update(empId, formData);  // ← UPDATES EMPLOYEE
      alert('✅ Employee updated successfully');
      navigate('/employees');  // ← NAVIGATES BACK
    } else {
      // Add mode
      await employeeAPI.create(formData);
      alert('✅ Employee created successfully');
      navigate('/employees');
    }
  } catch (err) {
    // error handling
  }
};
```

**Navigation:** `navigate('/employees')`

**PROBLEM IDENTIFIED:**
```
User clicks "Update Employee"
↓
PUT /api/employees/RG025 (success)
↓
Database updates: status = "Inactive"
↓
navigate('/employees')
↓
Employees.js component REUSES EXISTING INSTANCE
↓
useEffect(() => loadEmployees(), []) DOES NOT RUN AGAIN
↓
employees state STILL CONTAINS OLD DATA
↓
Table displays STALE status = "Active"
```

---

## ROOT CAUSE ANALYSIS

### ✅ BACKEND: CORRECT
- PUT /api/employees/RG025 updates database ✓
- GET /api/employees returns correct status ✓
- Employee.to_dict() includes status field ✓

### ✅ FRONTEND MAPPING: CORRECT
- API response includes status ✓
- Status mapped to component state ✓
- Badge reads from correct state ✓

### ❌ FRONTEND LIFECYCLE: INCORRECT

**The Bug:**

```javascript
useEffect(() => {
  loadEmployees();
}, []);  // ← EMPTY DEPENDENCY ARRAY
```

**Why It Fails:**

When navigating from Edit page back to Employee Master:
1. React Router REUSES the existing Employees component instance
2. `useEffect` with empty dependency array only runs on MOUNT
3. Since component is already mounted, `useEffect` does NOT run again
4. `loadEmployees()` is NOT called
5. Component displays OLD state from previous load

**React Component Lifecycle:**
```
First Visit:
  /employees → Employees component MOUNTS → useEffect runs → loadEmployees() → Fresh data ✓

After Edit:
  /employees/edit/RG025 → Edit, save, navigate('/employees')
  → Employees component ALREADY MOUNTED
  → useEffect does NOT run (empty deps)
  → loadEmployees() NOT called
  → Shows STALE data ✗
```

---

## PROOF

Test in browser:

1. Open Employee Master
2. Check RG025 status badge (shows "Active")
3. Edit RG025, change to "Inactive", save
4. Check database: `SELECT status FROM employees WHERE emp_id='RG025'`
   → Returns "Inactive" ✓
5. Check API: `GET /api/employees?q=`
   → Returns status: "Inactive" ✓
6. Check UI: Employee Master table
   → Shows "Active" badge ✗

**Reason:** Component never called `loadEmployees()` after navigation

---

## FIX REQUIRED

### Option 1: Re-fetch on navigation (RECOMMENDED)
```javascript
useEffect(() => {
  loadEmployees();
}, [location.pathname]);  // ← Re-run when URL changes
```

Or use React Router location:
```javascript
import { useLocation } from 'react-router-dom';

function Employees() {
  const location = useLocation();
  
  useEffect(() => {
    loadEmployees();
  }, [location]);  // ← Re-run when location changes
}
```

### Option 2: Force refresh on navigation back
```javascript
// In EmployeeAdd.js after update:
navigate('/employees', { state: { refresh: true } });

// In Employees.js:
const location = useLocation();

useEffect(() => {
  loadEmployees();
}, [location.state?.refresh]);
```

### Option 3: Unmount/remount component
Use `key` prop in router to force new component instance:
```javascript
<Route path="/employees" element={<Employees key="employees-list" />} />
```

---

## SUMMARY

| Layer | Status | Evidence |
|-------|--------|----------|
| Database | ✅ CORRECT | Query shows status="Inactive" after update |
| Backend API | ✅ CORRECT | GET /api/employees returns status="Inactive" |
| Frontend API Call | ✅ CORRECT | employeeAPI.search('') calls correct endpoint |
| Response Mapping | ✅ CORRECT | Status field preserved in state |
| Badge Rendering | ✅ CORRECT | Badge reads emp.status from state |
| **Component Lifecycle** | **❌ BUG** | **useEffect does not re-run after navigation** |

**EXACT FAILURE POINT:**

`frontend/src/pages/Employees.js` Line 28:
```javascript
useEffect(() => {
  loadEmployees();
}, []);  // ← This empty array prevents re-fetching
```

The component retains old state after navigating back from edit page because React Router reuses the component instance and useEffect doesn't re-execute.

**FIX:** Add dependency to re-trigger data load on navigation/mount.
