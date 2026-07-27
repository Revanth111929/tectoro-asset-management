# Corporate SIM Implementation Plan

## Overview
Add Corporate SIM inventory management to the asset management system.

## Implementation Phases

### Phase 1: Database Schema ✅
- [x] Create CorporateSIM model in models.py
- [x] Add unique constraints for ICCID and mobile numbers
- [x] Add status tracking fields
- [x] Add employee assignment fields
- [x] Add audit trail support

### Phase 2: Backend API (routes.py & api_server.py)
- [ ] GET /api/corporate-sims - List all SIMs with pagination
- [ ] GET /api/corporate-sims/:id - Get SIM details
- [ ] POST /api/corporate-sims - Create new SIM
- [ ] PUT /api/corporate-sims/:id - Update SIM
- [ ] DELETE /api/corporate-sims/:id - Delete SIM
- [ ] GET /api/corporate-sims/search - Search/filter SIMs
- [ ] POST /api/corporate-sims/:id/assign - Assign SIM to employee
- [ ] POST /api/corporate-sims/:id/return - Return SIM from employee
- [ ] GET /api/dashboard/sim-stats - SIM statistics for dashboard

### Phase 3: Frontend API Service
- [ ] Add corporateSimAPI to frontend/src/services/api.js
- [ ] Create API methods for all CRUD operations

### Phase 4: Frontend Components
- [ ] CorporateSimList.js - List/table view with filters
- [ ] CorporateSimAdd.js - Add new SIM form
- [ ] CorporateSimEdit.js - Edit SIM form
- [ ] CorporateSimView.js - View SIM details
- [ ] Add navigation link in Layout.js

### Phase 5: Dashboard Integration
- [ ] Add SIM stats to Dashboard.js
- [ ] Add SIM widget/card to dashboard
- [ ] Update dashboard API to include SIM data

### Phase 6: Validation & Security
- [ ] Backend validation for duplicate ICCID
- [ ] Backend validation for duplicate mobile number
- [ ] Role-based access control
- [ ] Input sanitization

### Phase 7: Testing
- [ ] Test CRUD operations
- [ ] Test duplicate validation
- [ ] Test employee assignment workflow
- [ ] Test search and filtering
- [ ] Test dashboard integration

### Phase 8: Documentation
- [ ] API documentation
- [ ] User guide for Corporate SIM management
- [ ] Workflow documentation

## Database Schema

```python
class CorporateSIM(db.Model):
    id = Primary Key
    iccid = Unique SIM card number (20 digits)
    mobile_number = Phone number (nullable, unique when not null)
    carrier = Operator name (Airtel, Jio, Vi, BSNL, etc.)
    plan_type = Plan type (Prepaid, Postpaid)
    monthly_cost = Monthly cost/charge
    corporate_account = Corporate account name/number
    
    # Assignment tracking
    status = Available/Assigned/Active/Suspended/Returned/Lost/Damaged
    assigned_employee_id = Employee ID (nullable)
    assigned_employee_name = Employee name (nullable)
    assignment_date = Date assigned
    return_date = Date returned
    
    # Additional info
    remarks = Notes/comments
    created_at = Timestamp
    updated_at = Timestamp
```

## API Endpoints

### List SIMs
```
GET /api/corporate-sims?page=1&per_page=50&status=Available&carrier=Airtel&search=9876
```

### Create SIM
```
POST /api/corporate-sims
{
  "iccid": "89911234567890123456",
  "mobile_number": "9876543210",
  "carrier": "Airtel",
  "plan_type": "Postpaid",
  "monthly_cost": 499.00,
  "corporate_account": "CORP-ACC-001",
  "status": "Available",
  "remarks": "New SIM"
}
```

### Assign SIM to Employee
```
POST /api/corporate-sims/1/assign
{
  "employee_id": "TT001",
  "employee_name": "John Doe",
  "assignment_date": "2026-07-27"
}
```

## Frontend Features

1. **Corporate SIM List Page**
   - Table with columns: ICCID, Mobile Number, Carrier, Status, Assigned To, Actions
   - Search by ICCID or mobile number
   - Filter by status, carrier, assigned employee
   - Pagination
   - Actions: View, Edit, Delete, Assign, Return

2. **Add/Edit SIM Form**
   - ICCID input with validation (20 digits)
   - Mobile number input with format validation
   - Carrier dropdown (Airtel, Jio, Vi, BSNL, Other)
   - Plan type (Prepaid/Postpaid)
   - Monthly cost input
   - Corporate account input
   - Status dropdown
   - Remarks textarea

3. **SIM Assignment Dialog**
   - Employee search/select
   - Assignment date picker
   - Remarks field

4. **Dashboard Widget**
   - Total SIMs count
   - Available SIMs
   - Assigned SIMs
   - Suspended/Lost/Damaged counts

## Validation Rules

1. **ICCID**
   - Required
   - Must be exactly 19-20 digits
   - Must be unique

2. **Mobile Number**
   - Optional
   - Must be 10 digits (if provided)
   - Must be unique (if provided)

3. **Status Transitions**
   - Available → Assigned (via assign endpoint)
   - Assigned → Returned (via return endpoint)
   - Any status → Suspended/Lost/Damaged (via update)

## Permissions

- **Admin**: Full access (CRUD, assign, return)
- **Viewer**: Read-only access
- **Editor**: Can update but not delete

## Next Steps

1. Start with Phase 1 - Add database model
2. Test database creation
3. Proceed to Phase 2 - Backend APIs
4. Then Phase 3 & 4 - Frontend implementation
5. Finally testing and documentation

---

**Status**: Phase 1 starting now...
