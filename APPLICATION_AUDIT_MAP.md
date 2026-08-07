# 🔍 APPLICATION AUDIT MAP - COMPLETE INVENTORY

**Date:** August 4, 2026  
**Purpose:** Full application mapping for stabilization audit  
**Status:** 🔴 AUDIT IN PROGRESS

---

## 📊 DATABASE SCHEMA

### Core Tables

#### 1. **assets** (PRIMARY ASSET TABLE)
**Purpose:** Main asset records with embedded employee assignment  
**Critical Fields:**
- `id` (PK)
- `serial_number` (UNIQUE, INDEXED)
- `status` (VARCHAR(30), INDEXED) ← **STATUS SOURCE**
- `emp_id` (VARCHAR(50), INDEXED) ← **ASSIGNMENT SOURCE**
- `employee_name` (VARCHAR(150), INDEXED)
- `employee_email` (VARCHAR(150))
- `mobile_number` (VARCHAR(30))
- `category` (VARCHAR(100), INDEXED)
- `asset_name` (VARCHAR(150), INDEXED)
- `inventory_id` (FK → inventory.id)

**Relationships:**
- → invoice_attachments (1:1)
- → asset_repairs (1:N)
- ← inventory (N:1, optional)
- References employees via emp_id (NO FK CONSTRAINT)

**⚠️ DATA INTEGRITY CONCERNS:**
1. NO FK to employees table - can have orphaned emp_id
2. Status + emp_id can be inconsistent (Status=Assigned, emp_id=NULL)
3. Duplicate employee data (name, email, mobile) stored here AND employees table

---

#### 2. **employees** (EMPLOYEE MASTER)
**Purpose:** Employee master records  
**Critical Fields:**
- `emp_id` (PK, VARCHAR(50), UNIQUE)
- `employee_name` (VARCHAR(150), INDEXED)
- `email` (VARCHAR(150), UNIQUE)
- `is_active` (BOOLEAN)
- `status` (VARCHAR(50))

**Relationships:**
- ← assets (reference only, no FK)
- ← corporate_sims (FK)
- ← onboarding (FK)

**⚠️ DATA INTEGRITY CONCERNS:**
1. emp_id referenced in assets but NO FK enforcement
2. Assets can remain "assigned" to inactive/deleted employees
3. Employee data duplicated in assets table

---

#### 3. **audit_logs**
**Purpose:** Audit trail for all operations  
**Critical Fields:**
- `timestamp`, `action_type`, `module`
- `asset_id`, `employee_id`
- `old_value`, `new_value`
- `performed_by`

**⚠️ NO TABLE for asset_lifecycle** - Lifecycle tracking appears to use audit_logs

---

#### 4. **invoice_attachments**
**Purpose:** Invoice file metadata  
**Critical Fields:**
- `asset_id` (FK → assets, UNIQUE) ← 1:1 relationship
- `stored_filename`, `original_filename`
- `storage_path`, `file_size`, `mime_type`
- `upload_date`, `uploaded_by`

**Relationships:**
- → assets (1:1 via FK with CASCADE)

**⚠️ DATA INTEGRITY CONCERNS:**
1. File existence not verified (storage_path may point to missing file)
2. Upload metadata might not match actual file

---

#### 5. **asset_repairs**
**Purpose:** Repair tracking  
**Critical Fields:**
- `repair_number` (UNIQUE)
- `asset_id` (FK → assets, CASCADE)
- `status` (Pending, In Progress, Completed, Cancelled)
- `previous_emp_id`, `previous_employee_name` ← Stores who had it
- `completion_action`

**Relationships:**
- → assets (N:1)
- ← repair_parts (1:N)

---

#### 6. **inventory** (NOT USED YET?)
**Purpose:** Inventory master table (future-proofing)  
**Status:** ⚠️ May not be actively used  
**Relationship:** assets.inventory_id references this

---

### Supporting Tables
- `users` - Authentication
- `activity_logs` - Activity history (different from audit_logs?)
- `employee_exits` - Exit management
- `exit_asset_collection` - Assets during exit
- `onboarding` - Onboarding records
- `onboarding_asset_assignments` - Pre-assignment
- `corporate_sims` - SIM card management
- `email_config` - SMTP settings
- `admin_profile` - Admin details

---

## 🖥️ BACKEND STRUCTURE

### Main Files

#### **api_server.py** (PRIMARY BACKEND - ~4000+ lines)
**Routes Defined:**

**Authentication:**
- POST `/api/auth/login`
- POST `/api/auth/logout`
- POST `/api/auth/refresh`
- GET `/api/auth/me`

**Assets:**
- GET `/api/assets` (list with filtering)
- GET `/api/assets/<id>` (single asset)
- POST `/api/assets` (create)
- PUT `/api/assets/<id>` (update)
- DELETE `/api/assets/<id>` (delete)
- GET `/api/assets/<id>/history` (lifecycle + audit)
- GET `/api/assets/by-employee/<emp_id>`
- GET `/api/assets/warranty/expiring`

**Employees:**
- GET `/api/employees` (list + search via ?q=)
- GET `/api/employees/<emp_id>`
- POST `/api/employees` (create/update)
- PUT `/api/employees/<emp_id>`
- POST `/api/employees/<emp_id>/disable`
- POST `/api/employees/bulk-import`
- GET `/api/employees/template`
- GET `/api/employees/<emp_id>/assets`
- GET `/api/employees/<emp_id>/asset-history`
- POST `/api/employees/<emp_id>/exit`
- GET `/api/employees/validate/<emp_id>`

**Invoice:**
- POST `/api/assets/<asset_id>/invoice/upload`
- GET `/api/assets/<asset_id>/invoice` (get info)
- GET `/api/assets/<asset_id>/invoice/download`
- GET `/api/assets/<asset_id>/invoice/view`

**Operations:**
- GET `/api/operations/available/<asset_id>`
- POST `/api/operations/assign`
- POST `/api/operations/return`
- POST `/api/operations/transfer`
- POST `/api/operations/send-for-repair`
- POST `/api/operations/complete-repair`
- POST `/api/operations/replace-part`
- POST `/api/operations/retire`

**Reports:**
- GET `/api/reports/export/csv`
- GET `/api/reports/export/excel`
- GET `/api/reports/activity`

**Dashboard:**
- GET `/api/dashboard/stats`
- GET `/api/dashboard/activity`
- GET `/api/dashboard/lifecycle-stats`

**Search:**
- GET `/api/search/global` (?q=, ?type=, ?limit=)

**Lifecycle:**
- GET `/api/lifecycle/asset/<asset_id>`
- GET `/api/lifecycle/holders/<asset_id>`

**Audit:**
- GET `/api/audit-logs`

**Corporate SIMs:**
- GET/POST/PUT/DELETE `/api/corporate-sims/...`

**Onboarding:**
- GET/POST/PUT/DELETE `/api/onboarding/...`

**Employee Exit:**
- GET/POST `/api/employee-exit/...`

**Admin:**
- GET/POST `/api/admin-profile`
- GET/POST `/api/email-config`
- GET/POST `/api/users`

**Other:**
- POST `/api/assets/<id>/send-assignment-email`
- GET `/api/assets/<id>/assignment-form` (PDF)
- POST `/api/assets/<id>/send-ack-email`

---

### Services

#### **services/operations_service.py**
**Purpose:** Core operations engine  
**Functions:**
- `assign_asset()` - Sets emp_id, employee_name, email, mobile, status='Assigned'
- `return_asset()` - Clears ALL employee fields, status='Available'
- `transfer_asset()` - Updates employee fields to new employee
- `send_for_repair()` - Clears employee fields, status='Under Repair', saves previous_emp_id
- `complete_repair()` - Returns to employee or inventory
- `replace_part()` - Standalone part replacement
- `retire_asset()` - Clears employee fields, status='Retired'
- `get_available_operations()` - Lists valid operations for asset status

**⚠️ TRANSACTION SAFETY:** Need to verify db.session.commit() rollback on errors

---

#### **services/audit_service.py**
**Purpose:** Audit logging  
**Classes:**
- `AuditService.log()` - Creates audit_logs entry
- `LifecycleService.record_event()` - Creates audit_logs entry with type

**⚠️ CONCERN:** No separate asset_lifecycle table - uses audit_logs

---

#### **services/pdf_generator.py**
**Purpose:** PDF generation for assignment forms

---

### Models

#### **models.py**
**Defines:**
- `User`, `Asset`, `Employee`, `AuditLog`, `ActivityLog`
- `InvoiceAttachment`, `AssetRepair`, `RepairPart`
- `Onboarding`, `OnboardingAssetAssignment`
- `CorporateSim`, `EmployeeExit`, `ExitAssetCollection`
- `EmailConfig`, `AdminProfile`, `Inventory`

**Each has `to_dict()` method for API serialization**

---

### Utilities

#### **utils/auth.py**
- `token_required` decorator
- `admin_required` decorator
- `non_viewer_required` decorator
- `role_required()` decorator

#### **utils/inventory_validator.py**
- Validation logic for inventory operations

---

## 🎨 FRONTEND STRUCTURE

### Pages (35 files)

#### Core Pages:
1. **LoginPage.js** - Authentication
2. **LandingPage.js** - Landing
3. **Dashboard.js** - Main dashboard

#### Asset Management:
4. **AssetList.js** - Asset listing with filters
5. **AssetAdd.js** - Add asset (New Device / Existing Device tabs)
6. **AssetEdit.js** - Edit asset details
7. **AssetView.js** - View asset + operations
8. **AssetImport.js** - Bulk import
9. **AssetReplacements.js** - Asset swaps
10. **AssetTimeline.js** - Asset history

#### Inventory:
11. **InventoryDetail.js** - Inventory detail view
12. **InventoryCategory.js** - Category filtering
13. **InventoryLifecycle.js** - Lifecycle timeline

#### Employee Management:
14. **Employees.js** - Employee list
15. **EmployeeList.js** - Employee master
16. **EmployeeAdd.js** - Add employee
17. **EmployeeAssetHistory.js** - Employee asset history
18. **EmployeeAutocompleteDemo.js** - Demo page

#### Corporate SIMs:
19. **CorporateSimList.js**
20. **CorporateSimAdd.js**
21. **CorporateSimView.js**

#### Onboarding:
22. **OnboardingList.js**
23. **OnboardingAdd.js**
24. **OnboardingView.js**

#### Operations:
25. **TemporaryAssignments.js** - Repair assignments

#### Reports & History:
26. **Reports.js** - Export functionality
27. **ActivityHistory.js** - Activity logs
28. **Warranty.js** - Warranty tracking

#### Settings:
29. **Settings.js** - Settings page
30. **EmailConfig.js** - SMTP configuration
31. **AdminProfile.js** - Admin profile

---

### Components (17 files)

#### Core UI:
1. **Layout.js** - Sidebar + navigation
2. **ErrorBoundary.js** - Error handling
3. **TectoroLogo.js** - Logo component

#### Asset Components:
4. **AssetDetailsCard.js** - Asset card display
5. **AssetHistoryModal.js** - History modal
6. **AssetHistoryTimeline.js** - Timeline view
7. **AssetOperations.js** - Operations panel (Assign/Return/Transfer/etc.)

#### Forms:
8. **DynamicAssetForm.js** - Dynamic category-based form
9. **EmployeeAutocomplete.js** - Employee search dropdown
10. **EmployeeExitModal.js** - Exit process modal

#### Search:
11. **GlobalSearch.js** - Global search (Cmd+K)

#### Buttons:
12. **AckButton.js** - Acknowledgment button

---

### Services

#### **services/api.js** (API CLIENT)
**Exports:**
- `authAPI` - login, logout, refresh, me
- `dashboardAPI` - getStats, getActivity
- `assetAPI` - CRUD + operations
- `reportAPI` - exportCSV, exportExcel, getActivityLog
- `ackAPI` - sendEmail, getStatus
- `emailConfigAPI` - get, save, test
- `employeeAPI` - search, CRUD, bulkImport, validate, getAssets
- `adminProfileAPI` - get, save
- `onboardingAPI` - CRUD, convert, getAvailableAssets
- `userAPI` - CRUD (admin users)
- `corporateSimAPI` - CRUD, assign, return, getStats
- `invoiceAPI` - upload, getInfo, download, view
- `searchAPI` - global search

---

### Hooks
- `useRole.js` - Role-based permissions
- `useScrollRestoration.js` - Scroll position
- `useTableAreaHeight.js` - Table height
- `useUrlFilters.js` - URL query params

### Context
- `ThemeContext.js` - Light/dark theme

### Config
- `categoryFields.js` - Dynamic form field definitions

---

## 🔄 BUSINESS WORKFLOWS (To Audit)

### 1. **Employee Creation**
Frontend: EmployeeAdd.js → employeeAPI.create()  
Backend: POST /api/employees → Create employee record  
Database: INSERT INTO employees

### 2. **Asset Assignment**
Frontend: AssetOperations.js → assetAPI.assignAsset()  
Backend: POST /api/operations/assign → operations_service.assign_asset()  
Database: UPDATE assets SET status='Assigned', emp_id=?, employee_name=?, ...  
Side Effects: audit_logs INSERT, activity_logs INSERT

### 3. **Asset Return**
Frontend: AssetOperations.js → assetAPI.returnAsset()  
Backend: POST /api/operations/return → operations_service.return_asset()  
Database: UPDATE assets SET status='Available', emp_id='', employee_name='', ...  
Side Effects: audit_logs INSERT

### 4. **Invoice Upload**
Frontend: AssetAdd.js / DynamicAssetForm.js → invoiceAPI.upload()  
Backend: POST /api/assets/<id>/invoice/upload  
Database: INSERT INTO invoice_attachments  
File System: Save file to uploads/invoices/

### 5. **Search**
Frontend: GlobalSearch.js → searchAPI.global()  
Backend: GET /api/search/global  
Database: Multiple SELECT queries across assets, employees, etc.

---

## ⚠️ KNOWN DATA INTEGRITY ISSUES

### CRITICAL BUG FOUND:
**Status=Assigned BUT emp_id=NULL**

**Possible Causes:**
1. Asset created with status='Assigned' but no employee
2. Return operation failed midway
3. Transfer operation failed
4. Employee deleted but asset not updated
5. Manual database edit
6. Old migration data

**Need to investigate:**
- When was this record created?
- What operation created it?
- Are there more such records?

---

## 📝 NEXT STEPS

1. ✅ Application structure mapped
2. ⏳ Trace each business workflow
3. ⏳ Data integrity audit (find all inconsistent records)
4. ⏳ Define source of truth for each field
5. ⏳ Fix Status=Assigned + emp_id=NULL bug
6. ⏳ Verify transaction safety
7. ⏳ Test every API endpoint
8. ⏳ Frontend code audit
9. ⏳ Test every UI interaction
10. ⏳ Create test matrix

---

**Status:** ✅ STEP 1 COMPLETE - Application Mapped  
**Next:** STEP 2 - Trace Business Workflows

