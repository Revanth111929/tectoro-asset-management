# BUG-001 RUNTIME VERIFICATION CHECKLIST

## COMPLETE DATA FLOW CHAIN

### Chain 1: Dashboard → Activity History (Filtered)
- [ ] Open Dashboard at http://localhost:3000/dashboard
- [ ] Verify "Replaced This Month" card is visible
- [ ] Click "Replaced This Month" card
- [ ] **VERIFY**: Browser navigates to `/activity-history?action=ASSET_REPLACED`
- [ ] **VERIFY**: URL bar shows the query parameter
- [ ] **VERIFY**: Activity History page loads (no crash)
- [ ] **VERIFY**: Table shows only ASSET_REPLACED records OR empty state
- [ ] **VERIFY**: Filter dropdown shows "Asset Replaced" selected
- [ ] **VERIFY**: No console errors in browser DevTools
- [ ] Press F5 (refresh browser)
- [ ] **VERIFY**: Filter persists after refresh
- [ ] **VERIFY**: URL parameter still present
- [ ] Press browser Back button
- [ ] **VERIFY**: Returns to Dashboard
- [ ] Press browser Forward button
- [ ] **VERIFY**: Filter still applied

### Chain 2: Direct URL Navigation
- [ ] Close all tabs
- [ ] Open new tab
- [ ] Navigate directly to: `http://localhost:3000/activity-history?action=ASSET_REPLACED`
- [ ] **VERIFY**: Page loads correctly (no Dashboard required)
- [ ] **VERIFY**: Filter applied from URL
- [ ] **VERIFY**: Table shows filtered results

### Chain 3: All Lifecycle Cards
- [ ] Open Dashboard
- [ ] Click "Active Temp Assignments" card
- [ ] **VERIFY**: Navigates to `/temporary-assignments?status=Active`
- [ ] **VERIFY**: Page loads, filter applied
- [ ] Return to Dashboard
- [ ] Click "Under Repair" card
- [ ] **VERIFY**: Navigates to `/assets?status=Maintenance`
- [ ] **VERIFY**: Asset list shows only Maintenance status
- [ ] Return to Dashboard
- [ ] Click "Total Lifecycle Events" card
- [ ] **VERIFY**: Navigates to `/activity-history` (no filter)
- [ ] **VERIFY**: Shows all activity types

---

## EDGE CASE TESTING

### Test 1: Zero Records
**Scenario**: Filter returns no results
- [ ] Navigate to `/activity-history?action=INVALID_ACTION_TYPE`
- [ ] **VERIFY**: Page loads (no crash)
- [ ] **VERIFY**: Shows empty state message: "No audit logs found"
- [ ] **VERIFY**: Does NOT show error message
- [ ] **VERIFY**: Does NOT show loading spinner indefinitely
- [ ] **VERIFY**: Filter dropdown works
- [ ] **VERIFY**: Can change filter to see other data

### Test 2: Large Dataset (500+ Records)
**Scenario**: Filter returns hundreds of results
- [ ] Navigate to `/activity-history?action=ASSET_CREATED`
- [ ] **VERIFY**: Page loads (no infinite spinner)
- [ ] **VERIFY**: Table renders within 3 seconds
- [ ] **VERIFY**: Pagination appears if >50 results
- [ ] **VERIFY**: Shows correct total count
- [ ] **VERIFY**: Can click through pages
- [ ] **VERIFY**: No browser freeze or lag

### Test 3: Backend Returns Empty Array
**Scenario**: API returns `{"logs": [], "total": 0, "pages": 0}`
- [ ] Stop backend server temporarily
- [ ] Restart with mock empty response
- [ ] Navigate to Activity History
- [ ] **VERIFY**: Shows "No audit logs found"
- [ ] **VERIFY**: Does NOT show "Something went wrong"
- [ ] **VERIFY**: Does NOT show "Failed to load"

### Test 4: Backend Returns 500 Error
**Scenario**: API fails with server error
- [ ] Mock backend to return 500 error
- [ ] Navigate to Activity History
- [ ] **VERIFY**: Shows error message with retry button
- [ ] **VERIFY**: Error message is user-friendly
- [ ] **VERIFY**: Does NOT crash to white screen
- [ ] **VERIFY**: React error boundary does NOT trigger
- [ ] Click "Retry" button
- [ ] **VERIFY**: Makes new API request

### Test 5: Network Disconnected
**Scenario**: No network connectivity
- [ ] Open DevTools → Network tab
- [ ] Set throttling to "Offline"
- [ ] Navigate to Activity History
- [ ] **VERIFY**: Shows network error message
- [ ] **VERIFY**: Does NOT show infinite spinner
- [ ] **VERIFY**: Retry button appears
- [ ] Set throttling back to "Online"
- [ ] Click retry
- [ ] **VERIFY**: Data loads successfully

### Test 6: Browser Refresh Persistence
- [ ] Navigate to `/activity-history?action=ASSET_DELETED`
- [ ] Wait for data to load
- [ ] Press F5 (hard refresh)
- [ ] **VERIFY**: URL parameter preserved
- [ ] **VERIFY**: Filter re-applied after reload
- [ ] **VERIFY**: Same data shown
- [ ] Open DevTools → Console
- [ ] Type: `window.location.href`
- [ ] **VERIFY**: Shows query parameter

### Test 7: Multiple Filters
- [ ] Navigate to Activity History
- [ ] Set action filter to "Asset Created"
- [ ] Set date range: 2024-01-01 to 2024-12-31
- [ ] Enter search term: "laptop"
- [ ] **VERIFY**: URL updates with all parameters
- [ ] **VERIFY**: API request includes all filters
- [ ] **VERIFY**: Results match all criteria
- [ ] Press F5
- [ ] **VERIFY**: All filters persist

### Test 8: Clear Filters
- [ ] Navigate to `/activity-history?action=ASSET_CREATED&search=laptop`
- [ ] Click "Clear filters" button (X icon)
- [ ] **VERIFY**: URL parameters removed
- [ ] **VERIFY**: Shows all records
- [ ] **VERIFY**: All dropdowns reset

### Test 9: Invalid URL Parameters
- [ ] Navigate to `/activity-history?action=<script>alert(1)</script>`
- [ ] **VERIFY**: No XSS vulnerability
- [ ] **VERIFY**: No crash
- [ ] **VERIFY**: Shows empty results or all results
- [ ] Navigate to `/activity-history?action=null`
- [ ] **VERIFY**: Handles gracefully
- [ ] Navigate to `/activity-history?action=undefined`
- [ ] **VERIFY**: Handles gracefully

### Test 10: Concurrent Requests
- [ ] Open Activity History
- [ ] Quickly change filter dropdown 5 times in 1 second
- [ ] **VERIFY**: Only shows results for final selection
- [ ] **VERIFY**: No race condition errors
- [ ] **VERIFY**: No duplicate API calls shown in Network tab

---

## DEFECT CLASS VERIFICATION

### All URL Parameter Pages

#### 1. ActivityHistory.js ✓ FIXED
- [ ] URL parameter: `action`
- [ ] Reads from: `location.search`
- [ ] Applied to: `filters.action_type`
- [ ] Verified working

#### 2. TemporaryAssignments.js ✓ ALREADY FIXED
- [ ] URL parameter: `status`
- [ ] Reads from: `location.search`
- [ ] Applied to: `statusFilter`
- [ ] Navigate to: `/temporary-assignments?status=Active`
- [ ] **VERIFY**: Shows only Active assignments

#### 3. Warranty.js ✓ HAS URL READING
- [ ] URL parameter: `filter`
- [ ] Reads from: `location.search`
- [ ] Applied to: `days` state
- [ ] Navigate to: `/warranty?filter=expiring90`
- [ ] **VERIFY**: Shows 90-day expiring warranties

#### 4. Asset List (if uses useUrlFilters)
- [ ] Check if asset list reads URL parameters
- [ ] Test: `/assets?status=Available`
- [ ] **VERIFY**: Filters by status
- [ ] Test: `/assets?search=laptop`
- [ ] **VERIFY**: Searches for term

---

## BROWSER CONSOLE VERIFICATION

### Check for Errors
- [ ] Open DevTools → Console
- [ ] Navigate through all lifecycle cards
- [ ] **VERIFY**: No React errors
- [ ] **VERIFY**: No 404 errors
- [ ] **VERIFY**: No CORS errors
- [ ] **VERIFY**: No undefined variable errors

### Check Network Requests
- [ ] Open DevTools → Network tab
- [ ] Clear network log
- [ ] Click "Replaced This Month" card
- [ ] **VERIFY**: Request to `/api/audit-logs?action_type=ASSET_REPLACED`
- [ ] **VERIFY**: NOT to `/api/reports/activity`
- [ ] **VERIFY**: Returns HTTP 200
- [ ] **VERIFY**: Response has `logs`, `total`, `pages` fields
- [ ] Click on request
- [ ] View Response tab
- [ ] **VERIFY**: All logs have `action_type: "ASSET_REPLACED"`

### Check State Updates
- [ ] Install React DevTools browser extension
- [ ] Open React DevTools → Components
- [ ] Navigate to Activity History with filter
- [ ] Find `ActivityHistory` component
- [ ] Check state values:
  - [ ] `filters.action_type` matches URL parameter
  - [ ] `logs` array contains filtered data
  - [ ] `loading` is false after load
  - [ ] `error` is empty string

---

## REGRESSION TESTING

### Dashboard Cards
- [ ] All 4 lifecycle cards clickable
- [ ] All cards navigate to correct URL
- [ ] All target pages load correctly

### Reports Page
- [ ] Navigate to Reports
- [ ] **VERIFY**: Activity log section still works
- [ ] **VERIFY**: Uses updated API endpoint
- [ ] **VERIFY**: Pagination works

### Activity History Features
- [ ] Filter dropdown works
- [ ] Date range filters work
- [ ] Search box works
- [ ] Export CSV works
- [ ] Pagination works
- [ ] Column sorting (if implemented)

---

## PROOF REQUIRED

### Screenshots Needed
1. Dashboard with lifecycle cards visible
2. Activity History with URL parameter in address bar
3. Filtered table showing only ASSET_REPLACED entries
4. Browser DevTools showing API request to `/api/audit-logs`
5. Browser DevTools showing correct query parameters
6. Empty state for zero results
7. Error state with retry button

### Video Recording (Optional)
- Screen recording showing complete flow from Dashboard click to filtered results

---

## SUCCESS CRITERIA

### ALL MUST PASS
- ✅ Dashboard cards navigate correctly
- ✅ URL parameters read on component mount
- ✅ URL parameters applied to filters
- ✅ API receives correct filter parameters
- ✅ Backend filters database query
- ✅ Frontend displays filtered results
- ✅ Browser refresh preserves filters
- ✅ Direct URL navigation works
- ✅ Back/Forward buttons work
- ✅ Zero results show empty state (not error)
- ✅ API errors show retry (not crash)
- ✅ Network errors handled gracefully
- ✅ No console errors
- ✅ No infinite loading
- ✅ No React crashes

---

## MANUAL TESTING SCRIPT

```bash
# 1. Start both servers
cd /home/administrator/Desktop/asset-management
source venv/bin/activate
python3 api_server.py &
cd frontend
npm start

# 2. Wait for servers to start (check logs)

# 3. Open browser to http://localhost:3000

# 4. Execute all test cases above

# 5. Document results
```

---

## DEFECT CLASS FINAL CHECK

### Files That Read URL Parameters
1. **ActivityHistory.js** - ✅ Reads `action` parameter
2. **TemporaryAssignments.js** - ✅ Reads `status` parameter  
3. **Warranty.js** - ✅ Reads `filter` parameter
4. **useUrlFilters.js** - ✅ Generic hook (check which pages use it)

### Files That DON'T Need URL Parameters (Location used for navigation only)
- AssetView.js - Uses location.state only
- AssetEdit.js - Uses location.state only
- Layout.js - Uses location.pathname for active menu

### Files Using useUrlFilters Hook
Search for: `import.*useUrlFilters` or `useUrlFilters()`

---

## NEXT STEPS

1. Start frontend development server
2. Execute all test cases in order
3. Document each pass/fail
4. Take screenshots of critical flows
5. Report results

**BUG-001 remains OPEN until all tests pass.**
