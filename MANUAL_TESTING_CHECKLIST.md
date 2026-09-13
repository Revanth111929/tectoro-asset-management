# Manual Testing Checklist - Production Readiness Verification
**Date**: September 7, 2026
**Application**: Tectoro IT Asset Management
**URL**: http://localhost:3000
**Purpose**: Verify COMPLETE UI → API → DB → Response → UI flow for EVERY feature

---

## Pre-Testing Setup

### Database State Verification
```bash
cd /home/administrator/Desktop/asset-management
sqlite3 databases/local_assets.db <<EOF
SELECT COUNT(*) as assets FROM assets WHERE is_deleted=0;
SELECT COUNT(*) as employees FROM employees;
SELECT COUNT(*) as users FROM users;
SELECT COUNT(*) as activity_logs FROM activity_log;
EOF
```

**Expected Current State**:
- Assets: 0
- Employees: 240
- Users: 5
- Activity logs: Check count

### Test User Credentials
```
Admin Role:
- Username: admin / Password: [your password]
- Username: Revanth / Password: [your password]

Standard Role:
- Username: Standard / Password: [your password]

View Role:
- Username: View / Password: [your password]
```

---

## TEST SUITE 1: Authentication & Authorization (15 min)

### Test 1.1: Login Flow
- [ ] Navigate to http://localhost:3000
- [ ] Login with admin/[password]
- [ ] Verify redirect to /dashboard
- [ ] Verify username displayed in header
- [ ] Check browser console for errors (F12)
- [ ] Logout
- [ ] Verify redirect to /login

**Database Verification**:
```sql
SELECT * FROM activity_log WHERE action='login' ORDER BY timestamp DESC LIMIT 1;
```
**Expected**: New login record with username='admin', action='login'

### Test 1.2: Invalid Login
- [ ] Try login with wrong password
- [ ] Verify error message displayed
- [ ] Verify NO redirect to dashboard
- [ ] Check activity_log for failed attempt

### Test 1.3: Session Persistence
- [ ] Login as admin
- [ ] Navigate to /assets
- [ ] Refresh page (F5)
- [ ] Verify still logged in
- [ ] Verify page content loads

### Test 1.4: Role-Based Access (CRITICAL)
**Admin Access** (should work):
- [ ] Login as admin
- [ ] Navigate to /assets/deleted
- [ ] Verify page loads with deleted assets table
- [ ] Navigate to /users
- [ ] Verify user management page loads

**Standard User Access** (should be blocked):
- [ ] Logout, login as Standard
- [ ] Try to navigate to /assets/deleted
- [ ] **VERIFY**: Blocked or redirected
- [ ] Try to navigate to /users
- [ ] **VERIFY**: Blocked or redirected

**View User Access** (should be blocked):
- [ ] Logout, login as View
- [ ] Try to create/edit/delete any asset
- [ ] **VERIFY**: Buttons hidden OR operations blocked
- [ ] Try to create/edit/delete any employee
- [ ] **VERIFY**: Buttons hidden OR operations blocked

**Database Verification**:
```sql
SELECT username, role FROM users;
```
**Expected**: 5 users with correct roles

---

## TEST SUITE 2: Dashboard Counts (10 min)

### Test 2.1: Dashboard Widget Accuracy
- [ ] Login as admin
- [ ] Navigate to /dashboard
- [ ] Note displayed counts:
  - Total Assets: ___
  - Assigned Assets: ___
  - Available Assets: ___
  - Total Employees: ___

**Database Verification**:
```sql
-- Compare with actual database
SELECT
  (SELECT COUNT(*) FROM assets WHERE is_deleted=0) as total_assets,
  (SELECT COUNT(*) FROM assets WHERE is_deleted=0 AND assigned_to IS NOT NULL) as assigned,
  (SELECT COUNT(*) FROM assets WHERE is_deleted=0 AND assigned_to IS NULL) as available,
  (SELECT COUNT(*) FROM employees) as total_employees;
```

**CRITICAL**: Dashboard counts MUST match database counts exactly.

### Test 2.2: Recent Activity
- [ ] Check "Recent Activity" widget
- [ ] Verify shows latest 10 activities
- [ ] Verify timestamps are correct

**Database Verification**:
```sql
SELECT action, username, details, timestamp
FROM activity_log
ORDER BY timestamp DESC LIMIT 10;
```

---

## TEST SUITE 3: Asset Management CRUD (45 min)

### Test 3.1: Create Single Asset (COMPLETE FLOW)
- [ ] Navigate to /assets
- [ ] Click "Add Asset" button
- [ ] Fill form:
  - Asset Tag: TEST-001
  - Serial Number: SN-TEST-001
  - Category: Laptop
  - Brand: Dell
  - Model: Latitude 5420
  - Status: Available
  - Purchase Date: 2026-01-15
  - Warranty Expiry: 2029-01-15
- [ ] Click Save
- [ ] **VERIFY**: Success message displayed
- [ ] **VERIFY**: Redirected to /assets
- [ ] **VERIFY**: TEST-001 appears in asset list

**Database Verification** (CRITICAL):
```sql
SELECT * FROM assets WHERE asset_tag='TEST-001';
```
**Expected**: 1 row with all fields matching form input

**Activity Log Verification**:
```sql
SELECT * FROM activity_log
WHERE action='create_asset' AND details LIKE '%TEST-001%'
ORDER BY timestamp DESC LIMIT 1;
```
**Expected**: New activity log entry

### Test 3.2: View Asset Details
- [ ] Click on TEST-001 in asset list
- [ ] Verify asset detail modal/page opens
- [ ] Verify all fields display correctly
- [ ] Verify "Assignment History" section shows (empty if new)

### Test 3.3: Edit Asset
- [ ] Click Edit on TEST-001
- [ ] Change Model to: "Latitude 5430"
- [ ] Change Warranty Expiry to: 2029-06-15
- [ ] Click Save
- [ ] **VERIFY**: Success message
- [ ] **VERIFY**: Changes reflected in list

**Database Verification**:
```sql
SELECT model, warranty_expiry FROM assets WHERE asset_tag='TEST-001';
```
**Expected**: model='Latitude 5430', warranty_expiry='2029-06-15'

**Activity Log Verification**:
```sql
SELECT * FROM activity_log
WHERE action='update_asset' AND details LIKE '%TEST-001%'
ORDER BY timestamp DESC LIMIT 1;
```

### Test 3.4: Assign Asset to Employee
- [ ] Click "Assign" on TEST-001
- [ ] Select employee from dropdown (e.g., first employee in list)
- [ ] Note employee name: ____________
- [ ] Enter assignment date: 2026-09-07
- [ ] Click Assign
- [ ] **VERIFY**: Success message
- [ ] **VERIFY**: Asset shows as "Assigned" in list
- [ ] **VERIFY**: Employee name displayed

**Database Verification** (CRITICAL):
```sql
SELECT
  a.asset_tag,
  a.serial_number,
  a.assigned_to,
  e.employee_name,
  a.assignment_date
FROM assets a
LEFT JOIN employees e ON a.assigned_to = e.id
WHERE a.asset_tag='TEST-001';
```
**Expected**: assigned_to = employee ID, employee_name matches selected

**Assignment History Verification**:
```sql
SELECT * FROM asset_assignments
WHERE asset_id = (SELECT id FROM assets WHERE asset_tag='TEST-001')
ORDER BY assignment_date DESC;
```
**Expected**: 1 row with correct employee_id, assignment_date, return_date=NULL

### Test 3.5: Return Asset
- [ ] Click "Return" on TEST-001
- [ ] Enter return date: 2026-09-07
- [ ] Click Return
- [ ] **VERIFY**: Success message
- [ ] **VERIFY**: Asset shows as "Available"
- [ ] **VERIFY**: Employee name removed

**Database Verification**:
```sql
SELECT assigned_to, assignment_date FROM assets WHERE asset_tag='TEST-001';
```
**Expected**: assigned_to=NULL, assignment_date=NULL

**Assignment History Verification**:
```sql
SELECT return_date FROM asset_assignments
WHERE asset_id = (SELECT id FROM assets WHERE asset_tag='TEST-001')
ORDER BY assignment_date DESC LIMIT 1;
```
**Expected**: return_date='2026-09-07'

### Test 3.6: Transfer Asset
- [ ] Assign TEST-001 to first employee again
- [ ] Click "Transfer" on TEST-001
- [ ] Select different employee
- [ ] Note new employee name: ____________
- [ ] Enter transfer date: 2026-09-07
- [ ] Click Transfer
- [ ] **VERIFY**: Success message
- [ ] **VERIFY**: New employee name displayed

**Database Verification**:
```sql
SELECT assigned_to, assignment_date FROM assets WHERE asset_tag='TEST-001';
```
**Expected**: assigned_to = new employee ID

**Assignment History Verification**:
```sql
SELECT employee_id, assignment_date, return_date
FROM asset_assignments
WHERE asset_id = (SELECT id FROM assets WHERE asset_tag='TEST-001')
ORDER BY assignment_date DESC LIMIT 2;
```
**Expected**:
- Row 1: new employee, assignment_date=today, return_date=NULL
- Row 2: old employee, return_date=today

### Test 3.7: Soft Delete Asset
- [ ] Click Delete on TEST-001
- [ ] Confirm deletion
- [ ] **VERIFY**: Success message
- [ ] **VERIFY**: TEST-001 removed from main list

**Database Verification** (CRITICAL - must use soft delete):
```sql
SELECT is_deleted, deleted_at FROM assets WHERE asset_tag='TEST-001';
```
**Expected**: is_deleted=1, deleted_at=current timestamp

**Verify NOT hard deleted**:
```sql
SELECT COUNT(*) FROM assets WHERE asset_tag='TEST-001';
```
**Expected**: 1 (row still exists)

### Test 3.8: View Deleted Assets
- [ ] Navigate to /assets/deleted
- [ ] **VERIFY**: TEST-001 appears in deleted assets list
- [ ] **VERIFY**: Shows deletion date

### Test 3.9: Restore Asset
- [ ] Click Restore on TEST-001 in deleted list
- [ ] Confirm restore
- [ ] **VERIFY**: Success message
- [ ] Navigate to /assets
- [ ] **VERIFY**: TEST-001 appears in main asset list

**Database Verification**:
```sql
SELECT is_deleted, deleted_at FROM assets WHERE asset_tag='TEST-001';
```
**Expected**: is_deleted=0, deleted_at=NULL

### Test 3.10: Duplicate Asset Tag Validation
- [ ] Try to create new asset with asset_tag='TEST-001'
- [ ] Click Save
- [ ] **VERIFY**: Error message "Asset tag already exists"
- [ ] **VERIFY**: Asset NOT created

**Database Verification**:
```sql
SELECT COUNT(*) FROM assets WHERE asset_tag='TEST-001';
```
**Expected**: Still 1 (no duplicate created)

### Test 3.11: Duplicate Serial Number Validation
- [ ] Try to create new asset with serial_number='SN-TEST-001'
- [ ] Use different asset_tag='TEST-002'
- [ ] Click Save
- [ ] **VERIFY**: Error message "Serial number already exists"
- [ ] **VERIFY**: Asset NOT created

---

## TEST SUITE 4: Employee Management CRUD (30 min)

### Test 4.1: Create Single Employee
- [ ] Navigate to /employees
- [ ] Click "Add Employee"
- [ ] Fill form:
  - Employee ID: EMP-TEST-001
  - Name: Test Employee
  - Email: test@tectoro.com
  - Department: IT
  - Designation: Test Engineer
  - Location: Bangalore
- [ ] Click Save
- [ ] **VERIFY**: Success message
- [ ] **VERIFY**: EMP-TEST-001 appears in list

**Database Verification**:
```sql
SELECT * FROM employees WHERE emp_id='EMP-TEST-001';
```
**Expected**: 1 row with all fields matching

### Test 4.2: Edit Employee
- [ ] Click Edit on EMP-TEST-001
- [ ] Change Department to: "QA"
- [ ] Click Save
- [ ] **VERIFY**: Success message
- [ ] **VERIFY**: Change reflected

**Database Verification**:
```sql
SELECT department FROM employees WHERE emp_id='EMP-TEST-001';
```
**Expected**: department='QA'

### Test 4.3: View Employee Assets
- [ ] Assign TEST-001 to EMP-TEST-001
- [ ] Click on EMP-TEST-001 in employee list
- [ ] **VERIFY**: Asset detail page shows
- [ ] **VERIFY**: TEST-001 listed under "Assigned Assets"

**Database Verification**:
```sql
SELECT COUNT(*) FROM assets
WHERE assigned_to = (SELECT id FROM employees WHERE emp_id='EMP-TEST-001')
AND is_deleted=0;
```
**Expected**: 1

### Test 4.4: Delete Employee (with assets)
- [ ] Try to delete EMP-TEST-001 (has assigned asset)
- [ ] **VERIFY**: Error or warning message
- [ ] **VERIFY**: Cannot delete employee with assigned assets

### Test 4.5: Delete Employee (without assets)
- [ ] Return TEST-001 asset
- [ ] Delete EMP-TEST-001
- [ ] Confirm deletion
- [ ] **VERIFY**: Success message
- [ ] **VERIFY**: Employee removed from list

**Database Verification**:
```sql
SELECT COUNT(*) FROM employees WHERE emp_id='EMP-TEST-001';
```
**Expected**: 0 (employees use hard delete, not soft delete)

### Test 4.6: Duplicate Employee ID Validation
- [ ] Create employee with emp_id='TT001' (already exists in 240 employees)
- [ ] Click Save
- [ ] **VERIFY**: Error message "Employee ID already exists"

---

## TEST SUITE 5: Employee Bulk Import (45 min - CRITICAL)

### Test 5.1: Valid Employee Import (No Duplicates)
- [ ] Navigate to /employees/import
- [ ] Download sample template
- [ ] Create test Excel file with 3 NEW employees:
  ```
  emp_id | employee_name | email | department | designation | location
  TEST-E1 | Test Emp 1 | test1@example.com | IT | Engineer | Bangalore
  TEST-E2 | Test Emp 2 | test2@example.com | HR | Manager | Mumbai
  TEST-E3 | Test Emp 3 | test3@example.com | Finance | Analyst | Delhi
  ```
- [ ] Upload file
- [ ] **VERIFY**: Preview shows 3 new employees
- [ ] **VERIFY**: No errors or warnings
- [ ] Click "Import"
- [ ] **VERIFY**: Success message "3 employees imported"

**Database Verification**:
```sql
SELECT emp_id, employee_name FROM employees
WHERE emp_id IN ('TEST-E1', 'TEST-E2', 'TEST-E3');
```
**Expected**: 3 rows matching test data

### Test 5.2: Employee Import with Identical Duplicates (MERGE)
- [ ] Create Excel file with duplicate rows:
  ```
  emp_id | employee_name | email | department
  TEST-D1 | Duplicate Test | dup@test.com | IT
  TEST-D1 | Duplicate Test | dup@test.com | IT
  TEST-D1 | Duplicate Test | dup@test.com | IT
  ```
- [ ] Upload file
- [ ] **VERIFY**: Preview shows "3 rows → 1 unique employee (TEST-D1)"
- [ ] **VERIFY**: Warning message about duplicates merged
- [ ] Click Import
- [ ] **VERIFY**: Success message "1 employee imported"

**Database Verification** (CRITICAL):
```sql
SELECT COUNT(*) FROM employees WHERE emp_id='TEST-D1';
```
**Expected**: EXACTLY 1 row (not 3)

### Test 5.3: Employee Import with Name Conflicts (FLAG)
- [ ] Create Excel file with conflicting names:
  ```
  emp_id | employee_name | email
  TEST-C1 | Maddela Revanth | conflict1@test.com
  TEST-C1 | Revanth Maddela | conflict2@test.com
  ```
- [ ] Upload file
- [ ] **VERIFY**: Preview shows WARNING/ERROR about name conflict
- [ ] **VERIFY**: Shows both names: "Maddela Revanth" vs "Revanth Maddela"
- [ ] **VERIFY**: Requires user action (cannot auto-import conflicting data)

### Test 5.4: Employee Import - Update Existing (MERGE)
- [ ] Note existing employee: TT001 (from 240 employees)
- [ ] Get current data:
  ```sql
  SELECT emp_id, employee_name, email FROM employees WHERE emp_id='TT001';
  ```
- [ ] Create Excel with updated data:
  ```
  emp_id | employee_name | email | department | phone
  TT001 | [same name] | newemail@test.com | Updated Dept | 9876543210
  ```
- [ ] Upload file
- [ ] **VERIFY**: Preview shows "UPDATE existing employee TT001"
- [ ] Click Import
- [ ] **VERIFY**: Success message

**Database Verification** (CRITICAL):
```sql
SELECT COUNT(*) FROM employees WHERE emp_id='TT001';
```
**Expected**: Still 1 row (not duplicated)

```sql
SELECT email, department, phone FROM employees WHERE emp_id='TT001';
```
**Expected**: Updated values

### Test 5.5: Real Workbook Import (338 rows)
**CRITICAL TEST - USE ACTUAL PRODUCTION FILE**

- [ ] Locate: `/home/administrator/Desktop/asset-management/Bulk Upload.xlsx`
- [ ] Upload actual workbook (338 data rows)
- [ ] **VERIFY** preview results:
  - Total rows parsed: 338
  - Unique emp_id values: 240 (or 239 non-empty)
  - Duplicate emp_ids detected: 76-77
  - Conflicting names detected: 6 (TT341, TT407, TT694, TT755, TT807, TT846)
  - Preview shows conflicts clearly with both name variants
- [ ] **VERIFY**: Cannot proceed with import until conflicts resolved
- [ ] Resolve conflicts (choose correct name for each of 6 IDs)
- [ ] Click Import
- [ ] **VERIFY**: Success message with correct counts

**Database Verification** (CRITICAL):
```sql
-- Should have exactly 240 unique employees (or 239 if blank IDs excluded)
SELECT COUNT(DISTINCT emp_id) FROM employees;
```
**Expected**: 240 total (or 239 non-empty)

```sql
-- Check the 6 conflicting IDs were imported as single records
SELECT emp_id, employee_name, COUNT(*) as count
FROM employees
WHERE emp_id IN ('TT341', 'TT407', 'TT694', 'TT755', 'TT807', 'TT846')
GROUP BY emp_id;
```
**Expected**: Each ID appears ONCE (count=1)

```sql
-- Verify no duplicate emp_id records created
SELECT emp_id, COUNT(*) as count
FROM employees
GROUP BY emp_id
HAVING count > 1;
```
**Expected**: 0 rows (no duplicates)

---

## TEST SUITE 6: Asset Bulk Import (45 min - CRITICAL)

### Test 6.1: Valid Asset Import (No Duplicates)
- [ ] Navigate to /assets/import
- [ ] Create test Excel file with 3 NEW assets:
  ```
  asset_tag | serial_number | category | brand | model | emp_id
  BULK-A1 | SN-BULK-001 | Laptop | Dell | Latitude | TEST-E1
  BULK-A2 | SN-BULK-002 | Monitor | Samsung | S24 | TEST-E2
  BULK-A3 | SN-BULK-003 | Keyboard | Logitech | K380 | [empty]
  ```
- [ ] Upload file
- [ ] **VERIFY**: Preview shows 3 assets
- [ ] **VERIFY**: 2 assigned, 1 available
- [ ] **VERIFY**: No errors
- [ ] Click Import

**Database Verification**:
```sql
SELECT asset_tag, serial_number, assigned_to FROM assets
WHERE asset_tag IN ('BULK-A1', 'BULK-A2', 'BULK-A3');
```
**Expected**: 3 rows, BULK-A3 has assigned_to=NULL

### Test 6.2: Asset Import - Same Serial + Same Employee (MERGE)
- [ ] Create Excel file:
  ```
  asset_tag | serial_number | category | brand | emp_id
  MERGE-1 | SN-MERGE-001 | Laptop | Dell | TEST-E1
  MERGE-2 | SN-MERGE-001 | Laptop | HP | TEST-E1
  ```
- [ ] Upload file
- [ ] **VERIFY**: Preview shows "2 rows → 1 asset (same serial + same employee)"
- [ ] **VERIFY**: Fields merged (e.g., brand might show conflict or merge logic)
- [ ] Click Import

**Database Verification** (CRITICAL):
```sql
SELECT COUNT(*) FROM assets WHERE serial_number='SN-MERGE-001';
```
**Expected**: EXACTLY 1 row (not 2)

### Test 6.3: Asset Import - Same Serial + Different Employee (ERROR)
- [ ] Create Excel file:
  ```
  asset_tag | serial_number | category | emp_id
  CONF-1 | SN-CONFLICT-001 | Laptop | TEST-E1
  CONF-2 | SN-CONFLICT-001 | Monitor | TEST-E2
  ```
- [ ] Upload file
- [ ] **VERIFY**: Preview shows ERROR
- [ ] **VERIFY**: Error message: "Serial SN-CONFLICT-001 assigned to multiple employees: TEST-E1, TEST-E2"
- [ ] **VERIFY**: Cannot proceed with import
- [ ] **VERIFY**: No assets created

**Database Verification**:
```sql
SELECT COUNT(*) FROM assets WHERE serial_number='SN-CONFLICT-001';
```
**Expected**: 0 (error prevented import)

### Test 6.4: Asset Import - Update Existing Asset
- [ ] Get existing asset:
  ```sql
  SELECT asset_tag, serial_number, brand FROM assets WHERE asset_tag='TEST-001';
  ```
- [ ] Create Excel with updated data:
  ```
  asset_tag | serial_number | brand | model | warranty_expiry
  TEST-001 | SN-TEST-001 | HP | Updated Model | 2030-01-01
  ```
- [ ] Upload file
- [ ] **VERIFY**: Preview shows "UPDATE existing asset TEST-001"
- [ ] Click Import

**Database Verification**:
```sql
SELECT COUNT(*) FROM assets WHERE asset_tag='TEST-001';
```
**Expected**: Still 1 row

```sql
SELECT brand, model, warranty_expiry FROM assets WHERE asset_tag='TEST-001';
```
**Expected**: Updated values

### Test 6.5: Asset Import - Invalid Employee ID
- [ ] Create Excel file:
  ```
  asset_tag | serial_number | category | emp_id
  INV-1 | SN-INVALID-001 | Laptop | NONEXISTENT-999
  ```
- [ ] Upload file
- [ ] **VERIFY**: Preview shows ERROR or WARNING
- [ ] **VERIFY**: Message indicates employee ID not found
- [ ] **VERIFY**: Either blocks import OR creates asset as unassigned

---

## TEST SUITE 7: Reports & Export (20 min)

### Test 7.1: Asset Report Export
- [ ] Navigate to /reports or /assets
- [ ] Click "Export Assets" or "Download Report"
- [ ] **VERIFY**: CSV/Excel file downloads
- [ ] Open downloaded file
- [ ] **VERIFY**: Contains all visible assets
- [ ] **VERIFY**: Columns match database schema

### Test 7.2: Employee Report Export
- [ ] Navigate to /employees
- [ ] Click "Export Employees"
- [ ] **VERIFY**: File downloads
- [ ] **VERIFY**: Contains all employees with correct data

### Test 7.3: Assignment History Report
- [ ] Navigate to reports section
- [ ] Generate "Assignment History" report
- [ ] **VERIFY**: Shows all asset assignments with dates
- [ ] **VERIFY**: Includes returned assets

**Database Verification**:
```sql
SELECT COUNT(*) FROM asset_assignments;
```
**Compare with report row count**

---

## TEST SUITE 8: Search & Filtering (15 min)

### Test 8.1: Asset Search
- [ ] Navigate to /assets
- [ ] Enter search term: "TEST-001"
- [ ] **VERIFY**: Only TEST-001 displayed
- [ ] Clear search
- [ ] **VERIFY**: All assets displayed

### Test 8.2: Asset Filter by Category
- [ ] Apply filter: Category = "Laptop"
- [ ] **VERIFY**: Only laptops displayed
- [ ] Clear filter
- [ ] **VERIFY**: All categories displayed

### Test 8.3: Asset Filter by Status
- [ ] Apply filter: Status = "Assigned"
- [ ] **VERIFY**: Only assigned assets displayed
- [ ] Apply filter: Status = "Available"
- [ ] **VERIFY**: Only available assets displayed

### Test 8.4: Employee Search
- [ ] Navigate to /employees
- [ ] Search for: "TEST-E1"
- [ ] **VERIFY**: Only TEST-E1 displayed
- [ ] Search for: "@test.com"
- [ ] **VERIFY**: All test employees displayed

---

## TEST SUITE 9: Activity Log & Audit Trail (10 min)

### Test 9.1: Activity Log Completeness
- [ ] Navigate to /activity or /audit-log
- [ ] **VERIFY**: Shows all recent actions
- [ ] Filter by action type: "create_asset"
- [ ] **VERIFY**: Shows only asset creation events
- [ ] Filter by user: "admin"
- [ ] **VERIFY**: Shows only admin's actions

**Database Verification**:
```sql
SELECT action, COUNT(*) FROM activity_log GROUP BY action;
```
**Compare with UI counts**

### Test 9.2: Activity Log Details
- [ ] Click on any activity entry
- [ ] **VERIFY**: Shows full details (before/after values if edit)
- [ ] **VERIFY**: Shows timestamp, username, IP address (if tracked)

---

## TEST SUITE 10: User Management (Admin Only) (15 min)

### Test 10.1: Create New User
- [ ] Login as admin
- [ ] Navigate to /users
- [ ] Click "Add User"
- [ ] Fill form:
  - Username: testuser
  - Password: TestPass123
  - Role: Standard
- [ ] Click Save
- [ ] **VERIFY**: Success message

**Database Verification**:
```sql
SELECT username, role FROM users WHERE username='testuser';
```
**Expected**: 1 row with role='Standard'

### Test 10.2: Login as New User
- [ ] Logout
- [ ] Login as testuser/TestPass123
- [ ] **VERIFY**: Login successful
- [ ] **VERIFY**: Standard role permissions applied

### Test 10.3: Change User Role
- [ ] Login as admin
- [ ] Navigate to /users
- [ ] Change testuser role to: "View"
- [ ] Click Save
- [ ] Logout and login as testuser
- [ ] **VERIFY**: View role permissions applied (cannot edit/delete)

### Test 10.4: Delete User
- [ ] Login as admin
- [ ] Delete testuser
- [ ] Confirm deletion
- [ ] **VERIFY**: User removed from list
- [ ] Logout and try login as testuser
- [ ] **VERIFY**: Login fails

---

## TEST SUITE 11: Error Handling & Edge Cases (20 min)

### Test 11.1: Form Validation
- [ ] Try to create asset with empty required fields
- [ ] **VERIFY**: Validation errors displayed
- [ ] **VERIFY**: Form not submitted

### Test 11.2: Invalid Date Handling
- [ ] Try to create asset with warranty_expiry < purchase_date
- [ ] **VERIFY**: Validation error or warning

### Test 11.3: Large File Import
- [ ] Create Excel file with 1000+ rows
- [ ] Upload file
- [ ] **VERIFY**: Import completes without timeout
- [ ] **VERIFY**: All rows processed

### Test 11.4: Special Characters in Fields
- [ ] Create asset with special characters:
  - Asset Tag: TEST-001@#$
  - Model: Dell "Latitude" 5420 & More
- [ ] **VERIFY**: Characters saved correctly
- [ ] **VERIFY**: No SQL injection or XSS issues

### Test 11.5: Concurrent Operations
- [ ] Open application in two browser tabs
- [ ] Tab 1: Start editing TEST-001
- [ ] Tab 2: Delete TEST-001
- [ ] Tab 1: Try to save changes
- [ ] **VERIFY**: Appropriate error handling

---

## TEST SUITE 12: Performance & Stability (15 min)

### Test 12.1: Large Dataset Performance
- [ ] Import 500+ employees (if not already present)
- [ ] Import 500+ assets
- [ ] Navigate to /assets
- [ ] **VERIFY**: Page loads within 3 seconds
- [ ] **VERIFY**: Search/filter responsive

### Test 12.2: Database Integrity After Operations
```sql
-- Check foreign key integrity
PRAGMA foreign_keys;
PRAGMA foreign_key_check;
```
**Expected**: foreign_keys=1, no foreign_key violations

```sql
-- Check for orphaned assets
SELECT COUNT(*) FROM assets
WHERE assigned_to IS NOT NULL
AND assigned_to NOT IN (SELECT id FROM employees);
```
**Expected**: 0

```sql
-- Check for orphaned assignments
SELECT COUNT(*) FROM asset_assignments
WHERE asset_id NOT IN (SELECT id FROM assets);
```
**Expected**: 0

### Test 12.3: Memory & Resource Usage
```bash
# Check service memory usage
systemctl status asset-management --no-pager | grep Memory
```
**Acceptable**: <500MB for production workload

---

## TEST SUITE 13: Production Configuration (10 min)

### Test 13.1: Environment Variables
```bash
cd /home/administrator/Desktop/asset-management
grep -E "^(FLASK_ENV|SECRET_KEY|DATABASE_PATH)" .env
```
**Expected**:
- FLASK_ENV=production
- SECRET_KEY=[long random string, not default]
- DATABASE_PATH=databases/local_assets.db

### Test 13.2: Service Auto-Start
```bash
systemctl is-enabled asset-management
```
**Expected**: enabled

### Test 13.3: Service Restart
```bash
sudo systemctl restart asset-management
sleep 5
curl -s http://localhost:3000/api/health
```
**Expected**: {"status":"ok"}

---

## TEST SUITE 14: Backup & Recovery (15 min)

### Test 14.1: Database Backup
```bash
cd /home/administrator/Desktop/asset-management/databases
cp local_assets.db local_assets.db.backup_$(date +%Y%m%d_%H%M%S)
ls -lh local_assets.db*
```
**Expected**: Backup file created with timestamp

### Test 14.2: Backup Restore Test
```bash
# Create test asset in UI first
# Then restore from backup
cd /home/administrator/Desktop/asset-management/databases
sudo systemctl stop asset-management
cp local_assets.db.backup_XXXXXX local_assets.db
sudo systemctl start asset-management
# Check if test asset is gone (proving restore worked)
```

### Test 14.3: Automated Backup Configuration
```bash
# Check if backup cron job exists
crontab -l | grep asset
```
**Expected**: Daily backup job configured (or recommend setting up)

---

## CRITICAL VERIFICATION CHECKLIST

After completing all tests, verify these CRITICAL requirements:

### Data Integrity
- [ ] No duplicate asset_tag in assets table
- [ ] No duplicate serial_number in assets table (except soft-deleted)
- [ ] No duplicate emp_id in employees table
- [ ] Foreign keys enabled: `PRAGMA foreign_keys;` returns 1
- [ ] No orphaned records (assets pointing to non-existent employees)

### Employee Bulk Import Behavior
- [ ] Duplicate emp_id (identical data) → MERGED into 1 record ✓
- [ ] Duplicate emp_id (conflicting names) → FLAGGED, requires resolution ✓
- [ ] Existing employees → UPDATED, not skipped ✓
- [ ] No employee data lost due to "duplicate" classification ✓

### Asset Bulk Import Behavior
- [ ] Same serial + same emp_id → MERGED into 1 asset ✓
- [ ] Same serial + different emp_id → ERROR, blocked ✓
- [ ] Serial uniqueness enforced per employee ✓
- [ ] No silent data loss ✓

### Authorization
- [ ] Admin can access /assets/deleted ✓
- [ ] Admin can access /users ✓
- [ ] Standard CANNOT access /assets/deleted ✓
- [ ] Standard CANNOT access /users ✓
- [ ] View CANNOT create/edit/delete ✓

### Activity Logging
- [ ] All CRUD operations logged ✓
- [ ] Login/logout logged ✓
- [ ] Bulk import operations logged ✓
- [ ] Activity log shows correct username, timestamp, action ✓

### Production Readiness
- [ ] Service auto-starts on boot ✓
- [ ] FLASK_ENV=production ✓
- [ ] SECRET_KEY is not default ✓
- [ ] Database backups configured ✓
- [ ] Error handling graceful (no crashes) ✓
- [ ] Performance acceptable (<3s page load) ✓

---

## TESTING COMPLETION REPORT

**Total Test Duration**: 4-5 hours
**Tests Passed**: ______ / 100+
**Tests Failed**: ______
**Critical Failures**: ______

### Failed Tests Summary
```
Test ID | Description | Impact | Status
--------|-------------|---------|-------
[List any failed tests here]
```

### Database Final State
```sql
SELECT
  (SELECT COUNT(*) FROM assets WHERE is_deleted=0) as total_assets,
  (SELECT COUNT(*) FROM employees) as total_employees,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM activity_log) as total_activity_logs;
```

### Recommendation
- [ ] **APPROVED FOR PRODUCTION** - All critical tests passed
- [ ] **CONDITIONAL APPROVAL** - Minor issues, document workarounds
- [ ] **NOT APPROVED** - Critical failures must be fixed

---

## NOTES
- Test with multiple browsers (Chrome, Firefox) if possible
- Take screenshots of any errors encountered
- Document any unexpected behavior
- Record database state before/after each test suite
- Keep backup of database before testing destructive operations

**Tester Name**: ________________
**Date Started**: ________________
**Date Completed**: ________________
**Signature**: ________________
