# Employee Exit / Asset Recovery Process

## ✅ Backend Implementation Complete

### Database Changes:
- ✅ Added `status` column to employees table (Active/Exited/Inactive)
- ✅ Added `exit_date` column to employees table

### API Endpoints Created:

#### 1. Get Employee Assets
```
GET /api/employees/<emp_id>/assets
```
Returns all assets assigned to an employee.

#### 2. Process Employee Exit
```
POST /api/employees/<emp_id>/exit
```
**Request Body:**
```json
{
  "exit_date": "2025-06-20",
  "exit_notes": "Last day, joining new company",
  "assets": [
    {
      "asset_id": 8,
      "recovery_status": "returned",
      "notes": "Good condition"
    },
    {
      "asset_id": 12,
      "recovery_status": "damaged",
      "notes": "Screen cracked"
    }
  ]
}
```

**Recovery Status Options:**
- `returned` → Asset moves to **Available**
- `missing` → Asset moves to **Retired**  
- `damaged` → Asset moves to **Maintenance**

**Response:**
```json
{
  "success": true,
  "message": "Employee exit processed successfully",
  "summary": {
    "employee": "Prem Kumar Kota",
    "emp_id": "TT862",
    "recovered": 1,
    "missing": 0,
    "damaged": 1,
    "total_assets": 2
  }
}
```

### What Happens During Exit:
1. **Assets are processed** based on recovery status
2. **Employee assignment removed** from all assets
3. **Asset status updated**:
   - Returned → Available (back to inventory)
   - Missing → Retired (write-off)
   - Damaged → Maintenance (needs repair)
4. **Audit logs created** for each asset and the employee exit
5. **Employee status** changed to "Exited"
6. **Exit date** recorded

### Audit Trail:
Every action is logged in `audit_logs` table:
- `ASSET_RETURNED` - Asset returned successfully
- `ASSET_MISSING` - Asset not recovered
- `ASSET_DAMAGED` - Asset damaged
- `EMPLOYEE_EXIT` - Employee exit process completed

---

## 🎯 Next Steps: Frontend UI

### TODO: Create Employee Exit Modal Component

**Location:** `frontend/src/components/EmployeeExitModal.js`

**Features Needed:**
1. Button in employee details/profile: "Employee Exit"
2. Modal showing:
   - Employee details (name, ID, department)
   - List of all assigned assets
   - For each asset:
     - Asset name, serial number, category
     - Radio buttons: ☑️ Returned | ⚠️ Missing | 🔧 Damaged
     - Notes text field
   - Exit date picker
   - Exit notes textarea
3. Summary view before confirmation
4. Success message with statistics
5. Option to generate/download exit report (PDF/CSV)

### TODO: Add API to Frontend Service

**Location:** `frontend/src/services/api.js`

```javascript
export const employeeAPI = {
  // ... existing methods
  getAssets: (empId) => api.get(`/employees/${empId}/assets`),
  processExit: (empId, data) => api.post(`/employees/${empId}/exit`, data),
};
```

### TODO: Update Employee List/Details Pages
- Add "Employee Exit" button
- Show employee status badge (Active/Exited)
- Filter by status

---

## 📊 Testing the API

### Test with curl:

```bash
# 1. Get employee's assets
curl http://localhost:3000/api/employees/TT862/assets

# 2. Process exit
curl -X POST http://localhost:3000/api/employees/TT862/exit \
  -H "Content-Type: application/json" \
  -d '{
    "exit_date": "2025-06-20",
    "exit_notes": "Resigned - joining competitor",
    "assets": [
      {
        "asset_id": 12,
        "recovery_status": "returned",
        "notes": "All accessories returned"
      }
    ]
  }'
```

---

## 🔄 Workflow Example:

**Scenario:** Prem Kumar (TT862) is leaving the company

1. Admin opens Prem Kumar's profile
2. Clicks "Employee Exit" button
3. System shows his 2 assigned assets:
   - Lenovo Laptop (PW07A2NQ)
   - Dell Monitor (MON-12345)
4. Admin marks:
   - Laptop: ✅ Returned - "Good condition"
   - Monitor: ⚠️ Missing - "Not found in office"
5. Sets exit date: June 20, 2025
6. Adds notes: "Last working day, joining new company"
7. Confirms exit
8. System:
   - Laptop → Available (inventory)
   - Monitor → Retired (missing)
   - Employee → Exited status
   - Audit logs created
9. Success message: "1 asset recovered, 1 missing"

---

##Would you like me to implement the frontend UI now?
