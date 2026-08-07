# DEFECT REGISTER

**Last Updated:** August 4, 2026  
**Total Defects:** 6 fixed, 12 open (3 awaiting regression testing)

---

## DEFECT SUMMARY

| Severity | Open | Fixed | Pending Verification | Total |
|----------|------|-------|---------------------|-------|
| Critical | 0    | 2     | 0                   | 2     |
| Major    | 0    | 0     | 3                   | 3     |
| Minor    | 7    | 4     | 0                   | 11    |
| Enhancement | 5 | 0     | 0                   | 5     |
| **TOTAL** | **12** | **6** | **3** | **21** |

---

## CRITICAL DEFECTS

| ID | Module | Issue | Status | Fixed By | Notes |
|----|--------|-------|--------|----------|-------|
| BUG-001 | Inventory | Invoice metadata field mapping wrong (`invoice.upload_date` should be `invoice.uploaded_at`) | ✅ Fixed | Context Transfer | Fixed in InventoryDetail.js line 374 |
| BUG-002 | Employee | EmployeeList using hardcoded mock data, no API integration | ✅ Fixed | Current Session | Replaced with employeeAPI.search() integration |

---

## MAJOR DEFECTS - ARCHITECTURAL (HTTP STANDARDIZATION)

**Root Cause Class:** Frontend components bypassing centralized API service  
**Architectural Fix:** All 7 direct HTTP calls converted to use api.js services  
**Status:** ✅ Code changes complete, ⏳ Regression testing pending

| ID | Module | Issue | Status | Location | Root Cause | Files Changed | Regression Tests |
|----|--------|-------|--------|----------|------------|---------------|------------------|
| BUG-010 | Asset Timeline | No error handling for API failures, uses direct axios instead of API service | 🔄 PENDING VERIFICATION | AssetHistoryTimeline.js | Missing error state, silent failure, direct HTTP client usage | AssetHistoryTimeline.js (22 lines modified) | ⏳ 5 tests pending |
| BUG-013 | Activity History | Direct axios usage instead of API service | 🔄 PENDING VERIFICATION | ActivityHistory.js:33 | Direct HTTP client, bypasses interceptors | ActivityHistory.js (converted to assetAPI.getHistory) | ⏳ 6 tests pending |
| BUG-014 | Inventory Lifecycle | Direct axios usage for history API instead of assetAPI.getHistory() | 🔄 PENDING VERIFICATION | InventoryLifecycle.js:43 | Direct HTTP client, duplicates assetAPI method | InventoryLifecycle.js (added error handling, retry button) | ⏳ 8 tests pending |

**Additional Files Fixed (Same Root Cause):**
- LoginPage.js - Converted fetch to authAPI.login()
- AssetEdit.js - Converted 3 fetch calls to assetAPI methods
- AssetImport.js - Converted fetch to assetAPI.bulkAssignmentForms()
- Dashboard.js - Converted fetch to dashboardAPI.getLifecycleStats()

**Total Conversions:** 7 direct HTTP calls → centralized API service  
**See:** DIRECT_HTTP_AUDIT.md for complete details

---

## MINOR DEFECTS

| ID | Module | Issue | Status | Location | Notes |
|----|--------|-------|--------|----------|-------|
| BUG-003 | Asset List | Using alert() instead of toast notifications | ⏳ Pending | AssetList.js | Replace with react-toastify toast |
| BUG-004 | Asset List | Debug console.log statements in production code | ⏳ Pending | AssetList.js | Remove or gate behind dev flag |
| BUG-005 | Employee Autocomplete | setTimeout without cleanup in handleBlur | ⏳ Pending | EmployeeAutocomplete.js:103 | Add cleanup in useEffect |
| BUG-006 | Employee Autocomplete | Potential auto-select race condition | ⏳ Pending | EmployeeAutocomplete.js:103 | Review 200ms timeout logic |
| ~~BUG-007~~ | ~~Dashboard~~ | ~~Inconsistent API call pattern (direct fetch vs API service)~~ | ✅ FIXED | ~~Dashboard.js:26~~ | Fixed in HTTP standardization (BUG-013/014) |
| BUG-008 | Dashboard | Promise.all error handling (all fail if one fails) | ⏳ Pending | Dashboard.js:23-28 | Use Promise.allSettled |
| ~~BUG-009~~ | ~~Asset Edit~~ | ~~Direct fetch for email/PDF instead of API service~~ | ✅ FIXED | ~~AssetEdit.js~~ | Fixed in HTTP standardization (BUG-013/014) |
| ~~BUG-015~~ | ~~Login Page~~ | ~~Direct fetch for login instead of authAPI service~~ | ✅ FIXED | ~~LoginPage.js~~ | Fixed in HTTP standardization (BUG-013/014) |
| ~~BUG-016~~ | ~~Asset Import~~ | ~~Direct fetch for bulk PDF instead of API service~~ | ✅ FIXED | ~~AssetImport.js~~ | Fixed in HTTP standardization (BUG-013/014) |
| BUG-011 | Reports | Pagination shows all pages (could be hundreds) | ⏳ Pending | Reports.js | Add smart pagination like AssetList |
| BUG-012 | Reports | Silent error handling for activity log | ⏳ Pending | Reports.js:20 | Show error message to user |


---

## ENHANCEMENTS

| ID | Module | Issue | Status | Location | Notes |
|----|--------|-------|--------|----------|-------|
| ENH-001 | Asset Operations | 700+ line component could be split | ⏳ Pending | AssetOperations.js | Consider operation-specific sub-components |
| ENH-002 | Asset Add | 1100+ line component with complex tab switching | ⏳ Pending | AssetAdd.js | Split into AssetAddNew.js and AssetAddExisting.js |
| ENH-003 | Dynamic Form | Manual field reset logic instead of config-driven | ⏳ Pending | DynamicAssetForm.js:71 | Use CATEGORY_FIELDS config for reset |
| ENH-004 | Asset View | Missing category-specific fields and invoice download | ⏳ Pending | AssetView.js | Add dynamic fields based on category |
| ENH-005 | Login Page | Remember me checkbox not functional | ⏳ Pending | LoginPage.js | Implement remember me logic |

---

## NOTES

- All Critical defects resolved ✅
- No Major defects identified
- Minor defects are non-blocking for production
- Enhancements can be addressed in future iterations

---
