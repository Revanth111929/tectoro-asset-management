# PHASE 4: OPERATIONS ENGINE - IMPLEMENTATION PLAN

**Date:** August 3, 2026  
**Status:** 🚧 IN PROGRESS  
**Approach:** Contextual Operations (No separate page)

---

## 🎯 OBJECTIVE

Build an Operations Engine where:
- Every asset movement happens through operations
- Operations are contextually available throughout the app
- Automatic synchronization across all data
- No manual editing of assignment fields

---

## 📋 IMPLEMENTATION STAGES

### Stage 1: Core Operations Service ⏳
**File:** `services/operations_service.py`

**Operations to Implement:**
1. ✅ Assign Asset (Available → Assigned)
2. ⏳ Return Asset (Assigned → Available)
3. ⏳ Transfer Asset (Employee A ↔ Employee B)
4. ⏳ Send For Repair (Assigned → Under Repair)
5. ⏳ Complete Repair (Under Repair → Available/Assigned)
6. ⏳ Replace Part (Track part replacements)
7. ⏳ Retire Asset (Any → Retired)

**Each Operation Must:**
- Validate asset/employee status
- Update asset record
- Create lifecycle event
- Create audit log
- Return success/error result

---

### Stage 2: API Endpoints ⏳
**File:** `api_server.py`

**Endpoints to Create:**
```
POST /api/operations/assign
POST /api/operations/return
POST /api/operations/transfer
POST /api/operations/repair/start
POST /api/operations/repair/complete
POST /api/operations/part-replacement
POST /api/operations/retire
GET  /api/operations/available/<asset_id>  # Get valid operations for asset
```

---

### Stage 3: Frontend Operations Component ⏳
**File:** `frontend/src/components/AssetOperations.js`

**Features:**
- Context-aware operations display
- Status-based operation filtering
- Modal dialogs for each operation
- Form validation
- Toast notifications

**Usage:**
```jsx
<AssetOperations 
  asset={asset}
  onOperationComplete={handleRefresh}
/>
```

---

### Stage 4: Toast Notifications ⏳
**Install:** `react-toastify`

**Messages:**
- ✅ Asset Assigned
- ✅ Asset Returned
- ✅ Transfer Successful  
- ✅ Repair Started
- ✅ Repair Completed
- ✅ Part Replaced
- ✅ Asset Retired

---

### Stage 5: Integration ⏳
**Add Operations to:**
- Inventory Detail page
- Employee Detail page
- Asset Detail page
- Asset List (bulk operations)

---

## 🔄 OPERATION FLOWS

### Assign Asset
```
Input: asset_id, emp_id, comments
Validate: Asset Available, Employee Active
Update: Asset → Assigned, link to employee
Create: Lifecycle ASSIGNED, Audit log
Return: Success with asset/employee data
Toast: "Asset assigned to [Employee Name]"
```

### Return Asset
```
Input: asset_id, comments
Validate: Asset Assigned
Update: Asset → Available, clear employee
Create: Lifecycle RETURNED, Audit log
Return: Success
Toast: "Asset returned to inventory"
```

### Transfer Asset
```
Mode 1 - Simple Transfer:
  Employee A has Laptop → Employee B (no laptop)
  Result: A loses laptop, B gets laptop

Mode 2 - Swap:
  Employee A has Laptop X → Employee B has Laptop Y
  Result: A gets Y, B gets X
  
Both: Reason required, creates 2 lifecycle events
Toast: "Transfer successful"
```

### Send For Repair
```
Input: asset_id, reason, comments
Validate: Asset Assigned
Update: Asset → Under Repair, clear employee
Create: Repair ticket, Lifecycle, Audit
Return: Success with repair_id
Toast: "Asset sent for repair"
```

### Complete Repair
```
Input: repair_id, option (inventory/previous_employee)
Option 1: Return to Inventory (Available)
Option 2: Return to Previous Employee (Assigned)
Update: Asset status, Repair ticket closed
Create: Lifecycle, Audit
Toast: "Repair completed"
```

### Replace Part
```
Input: asset_id, part_name, vendor, cost, engineer, date
Store: Part replacement record
Create: Lifecycle PART_REPLACED, Audit
Return: Success
Toast: "Part replaced: [Part Name]"
```

### Retire Asset
```
Input: asset_id, reason, comments
Validate: Asset exists
Update: Asset → Retired
Create: Lifecycle RETIRED, Audit
Return: Success
Toast: "Asset retired"
```

---

## 🎨 UI/UX DESIGN

### Operations Button Menu
```
┌─────────────────────────────┐
│ Operations ▼                │
├─────────────────────────────┤
│ ✓ Assign to Employee        │
│ ↩ Return to Inventory       │
│ ⇄ Transfer                  │
│ 🔧 Send for Repair          │
│ 🗑 Retire Asset             │
└─────────────────────────────┘
```

### Context-Aware Display
- **Available:** Show only "Assign"
- **Assigned:** Show "Return, Transfer, Repair"
- **Under Repair:** Show "Complete Repair"
- **Retired:** No operations (view only)

---

## 📊 AUTOMATIC SYNCHRONIZATION

**Every Operation Updates:**
1. Asset record (status, employee fields)
2. Employee assignment list
3. Asset lifecycle events
4. Audit log
5. Dashboard counters (via triggers/real-time)
6. Reports (via queries)

**No Manual Sync Required!**

---

## ⏱️ ESTIMATED TIME

| Stage | Time | Status |
|-------|------|--------|
| Operations Service | 3-4 hours | 🚧 In Progress |
| API Endpoints | 1-2 hours | ⏳ Pending |
| Frontend Component | 2-3 hours | ⏳ Pending |
| Toast System | 30 min | ⏳ Pending |
| Integration | 1-2 hours | ⏳ Pending |
| Testing | 1-2 hours | ⏳ Pending |
| **TOTAL** | **9-14 hours** | |

---

## 🚦 CURRENT STATUS

**Completed:**
- ✅ Operations service structure created
- ✅ Assign Asset operation implemented

**In Progress:**
- 🚧 Return Asset operation
- 🚧 Transfer Asset operation
- 🚧 Repair operations
- 🚧 Part Replacement
- 🚧 Retire Asset

**Next:**
- ⏳ Complete all operations
- ⏳ Create API endpoints
- ⏳ Build frontend component
- ⏳ Add toast notifications
- ⏳ Integrate into pages

---

## 📝 NOTES

**Important Design Decisions:**
1. **No Separate Page:** Operations contextually available everywhere
2. **Status-Driven:** Only show valid operations for current status
3. **Atomic Transactions:** Each operation is all-or-nothing
4. **Audit Everything:** Complete trail of all operations
5. **User Feedback:** Professional toast notifications

**File Organization:**
```
services/
  operations_service.py  # Core operations logic
  audit_service.py       # Already exists
  
api_server.py            # Operation endpoints

frontend/src/
  components/
    AssetOperations.js   # Operations component
  services/
    api.js              # Operation API methods
```

---

**Status:** Implementation in progress
**Next Step:** Complete operations service, then build API layer
