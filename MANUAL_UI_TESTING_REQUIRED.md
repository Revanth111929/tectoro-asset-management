# MANUAL UI TESTING REQUIRED - BROWSER ONLY

**Date:** August 4, 2026  
**Automated Verification:** ✅ COMPLETE (75% done)  
**Your Testing:** ⏳ REQUIRED (final 25%)

---

## WHAT I VERIFIED PROGRAMMATICALLY

✅ Backend APIs work (22 tests passed)  
✅ Real workflows work (3 workflows passed)  
✅ Frontend builds successfully  
✅ No direct HTTP calls remain  
✅ Response mapping correct  
✅ Error handling present  
✅ Loading states present  
✅ Null handling correct  
✅ Auth tokens automatic  
✅ All imports correct  

**See:** AUTOMATED_VERIFICATION_COMPLETE.md for full details

---

## WHAT YOU MUST TEST

Only browser-specific interactions that I cannot verify programmatically.

---

## PAGE 1: LOGIN (/)

### Test 1: Show/Hide Password
**Steps:**
1. Type password: `admin123`
2. Click eye icon

**Expected:**
- Password becomes visible
- Icon changes to eye-slash
- Click again → password hidden

**Result:** [ ] PASS [ ] FAIL

---

### Test 2: Login Success Flow
**Steps:**
1. Username: `admin`
2. Password: `admin123`
3. Click LOGIN

**Expected:**
- Loading spinner appears in button
- Redirects to /dashboard
- Dashboard loads

**Result:** [ ] PASS [ ] FAIL

---

### Test 3: Login Error Display
**Steps:**
1. Username: `wrong`
2. Password: `wrong`
3. Click LOGIN

**Expected:**
- Red alert displays
- Error message visible
- No redirect

**Result:** [ ] PASS [ ] FAIL

---

## PAGE 2: DASHBOARD (/dashboard)

### Test 1: Stat Cards Clickable
**Steps:**
1. Login and view dashboard
2. Click "Total Laptops" card

**Expected:**
- Navigates to /inventory/laptop
- Page loads correctly

**Result:** [ ] PASS [ ] FAIL

---

### Test 2: Charts Render
**Steps:**
1. View dashboard

**Expected:**
- Doughnut chart shows laptop distribution
- Bar chart shows asset categories
- Center text shows total count
- No broken images

**Result:** [ ] PASS [ ] FAIL

---

### Test 3: Lifecycle Stats Card
**Steps:**
1. View dashboard
2. Find purple gradient card

**Expected:**
- 4 stats display (Temp Assignments, Under Repair, Replaced, Total Events)
- Numbers visible
- Icons visible
- "View All Activity" button present

**Result:** [ ] PASS [ ] FAIL

---

## PAGE 3: ASSET EDIT (/assets/edit/1)

### Test 1: Download PDF
**Steps:**
1. Navigate to /assets/edit/1
2. Click "Download Assignment Form"

**Expected:**
- Browser download dialog appears
- PDF file downloads
- Filename: `Assignment_Form_1_[AssetName].pdf`
- PDF opens correctly

**Result:** [ ] PASS [ ] FAIL

---

### Test 2: Print PDF
**Steps:**
1. Click "Print Assignment Form"

**Expected:**
- Browser print dialog opens
- PDF preview visible
- Can print or cancel

**Result:** [ ] PASS [ ] FAIL

---

### Test 3: Send Email
**Steps:**
1. Enter email: `test@example.com`
2. Click send email button (if visible)

**Expected:**
- Loading spinner shows
- Success message displays in green OR
- Error message displays in red

**Result:** [ ] PASS [ ] FAIL [ ] BLOCKED (no email button)

---

## PAGE 4: ASSET IMPORT (/assets/import)

### Test 1: File Picker Opens
**Steps:**
1. Navigate to /assets/import
2. Click file input

**Expected:**
- Browser file picker opens
- Can select .xlsx or .xls files

**Result:** [ ] PASS [ ] FAIL

---

### Test 2: Bulk PDF Download
**Steps:**
1. After successful import (if any assets imported)
2. Click "Download Assignment Forms (ZIP)"

**Expected:**
- Loading spinner shows
- ZIP file downloads
- Filename: `Assignment_Forms_YYYY-MM-DD.zip`

**Result:** [ ] PASS [ ] FAIL [ ] BLOCKED (no imported assets)

---

## PAGE 5: INVENTORY LIFECYCLE (/inventory/lifecycle/1)

### Test 1: Timeline Scrolls
**Steps:**
1. Navigate to /inventory/lifecycle/1

**Expected:**
- Timeline events display vertically
- Page scrolls if many events
- All events visible

**Result:** [ ] PASS [ ] FAIL

---

### Test 2: Filter Dropdown Works
**Steps:**
1. Click "Filter by Event Type" dropdown
2. Select "Assignments"

**Expected:**
- Dropdown opens
- Options visible
- Timeline filters to show only assignments
- Event count updates

**Result:** [ ] PASS [ ] FAIL

---

### Test 3: Search Works
**Steps:**
1. Type in search box: `employee name` or `date`

**Expected:**
- Timeline filters in real-time
- Matching events remain
- Clear button (X) appears

**Result:** [ ] PASS [ ] FAIL

---

### Test 4: Sort Dropdown
**Steps:**
1. Click "Sort Order" dropdown
2. Select "Oldest First"

**Expected:**
- Timeline reverses order
- Oldest events now at top

**Result:** [ ] PASS [ ] FAIL

---

### Test 5: Export PDF
**Steps:**
1. Click PDF export button (red icon)

**Expected:**
- PDF downloads
- Filename: `[AssetName]_lifecycle_YYYY-MM-DD.pdf`

**Result:** [ ] PASS [ ] FAIL

---

### Test 6: Export Excel
**Steps:**
1. Click Excel export button (green icon)

**Expected:**
- CSV file downloads
- Filename: `[AssetName]_lifecycle_YYYY-MM-DD.csv`

**Result:** [ ] PASS [ ] FAIL

---

### Test 7: Print Button
**Steps:**
1. Click print button (printer icon)

**Expected:**
- Browser print dialog opens
- Timeline visible in preview

**Result:** [ ] PASS [ ] FAIL

---

### Test 8: Error with Retry
**Steps:**
1. Stop backend server
2. Navigate to /inventory/lifecycle/1

**Expected:**
- Red error alert displays
- Error icon visible
- Retry button present
- Click retry → attempts reload

**Result:** [ ] PASS [ ] FAIL [ ] BLOCKED (cannot stop backend)

---

## PAGE 6: ACTIVITY HISTORY (/activity-history)

### Test 1: Pagination Works
**Steps:**
1. Navigate to /activity-history
2. Click "Next" or page number

**Expected:**
- Next page loads
- Different activities show
- Page number updates

**Result:** [ ] PASS [ ] FAIL [ ] BLOCKED (not enough data)

---

### Test 2: Date Picker Opens
**Steps:**
1. Click date range input (if visible)

**Expected:**
- Date picker opens
- Can select dates

**Result:** [ ] PASS [ ] FAIL [ ] BLOCKED (no date picker)

---

## PAGE 7: ASSET HISTORY TIMELINE (Component)

### Test 1: Timeline in AssetView
**Steps:**
1. Navigate to /assets/view/1
2. Find history timeline section

**Expected:**
- Timeline displays
- Events visible
- No errors

**Result:** [ ] PASS [ ] FAIL

---

### Test 2: Timeline in InventoryDetail
**Steps:**
1. Navigate to /inventory/detail/1
2. Find history section

**Expected:**
- Timeline displays
- Events visible

**Result:** [ ] PASS [ ] FAIL

---

### Test 3: Timeline Retry Button
**Steps:**
1. In any timeline view
2. If error occurs, check for retry button

**Expected:**
- Retry button visible on error
- Click retry → reloads timeline

**Result:** [ ] PASS [ ] FAIL [ ] BLOCKED (no error)

---

## TOKEN MANAGEMENT (Cross-Page)

### Test 1: Token Attached
**Steps:**
1. Login
2. Open DevTools → Network tab
3. Navigate to /dashboard
4. Check request headers for /api/dashboard/stats

**Expected:**
- Authorization header present
- Value: `Bearer <long-token>`

**Result:** [ ] PASS [ ] FAIL

---

### Test 2: Logout Clears Token
**Steps:**
1. Login
2. Check localStorage (DevTools → Application → Local Storage)
3. Note token exists
4. Logout
5. Check localStorage again

**Expected:**
- Token removed
- User removed
- Redirects to /login

**Result:** [ ] PASS [ ] FAIL

---

## SUMMARY TABLE

| Page | Test | Status |
|------|------|--------|
| Login | Show/Hide Password | [ ] |
| Login | Success Flow | [ ] |
| Login | Error Display | [ ] |
| Dashboard | Stat Cards | [ ] |
| Dashboard | Charts Render | [ ] |
| Dashboard | Lifecycle Stats | [ ] |
| Asset Edit | Download PDF | [ ] |
| Asset Edit | Print PDF | [ ] |
| Asset Edit | Send Email | [ ] |
| Asset Import | File Picker | [ ] |
| Asset Import | Bulk PDF | [ ] |
| Inventory Lifecycle | Timeline Scrolls | [ ] |
| Inventory Lifecycle | Filter Dropdown | [ ] |
| Inventory Lifecycle | Search Works | [ ] |
| Inventory Lifecycle | Sort Dropdown | [ ] |
| Inventory Lifecycle | Export PDF | [ ] |
| Inventory Lifecycle | Export Excel | [ ] |
| Inventory Lifecycle | Print Button | [ ] |
| Inventory Lifecycle | Error Retry | [ ] |
| Activity History | Pagination | [ ] |
| Activity History | Date Picker | [ ] |
| Asset History | Timeline AssetView | [ ] |
| Asset History | Timeline InventoryDetail | [ ] |
| Asset History | Retry Button | [ ] |
| Token | Token Attached | [ ] |
| Token | Logout Clears | [ ] |

**Total:** 25 tests

---

## TESTING RULES

### Mark PASS Only When:
- ✓ Feature works as expected
- ✓ No console errors
- ✓ Visual display correct
- ✓ No broken functionality

### Mark FAIL When:
- ❌ Feature doesn't work
- ❌ Console errors appear
- ❌ Visual issues (broken layout, missing elements)
- ❌ Unexpected behavior

### Mark BLOCKED When:
- ⏸️ Cannot test (missing data, backend down, etc.)
- ⏸️ Feature not applicable

### If ANY Test Fails:
1. **STOP testing**
2. Document the failure:
   - Screenshot
   - Console log
   - Network log
   - Expected vs Actual
3. Report to me for fix
4. After fix, restart testing from beginning of that page

---

## HOW TO TEST

1. Start backend: `python api_server.py`
2. Start frontend: `cd frontend && npm start`
3. Open browser: http://localhost:3000
4. Open DevTools (F12)
5. Follow test steps above
6. Mark each test result
7. Take screenshots of any failures

---

## AFTER ALL TESTS PASS

Update these files:
1. **DEFECT_REGISTER.md** - Mark BUG-010, BUG-013, BUG-014 as VERIFIED
2. **AUDIT_METRICS.txt** - Update regression testing to 100%
3. **STABILIZATION_STATUS.md** - Mark HTTP Standardization as VERIFIED

Then HTTP Standardization is **100% COMPLETE** ✅

---

**Estimated Time:** 30-45 minutes

**Your task:** Test only these 25 browser-specific interactions.  
**Everything else:** Already verified programmatically by me.

Good luck! 🚀
