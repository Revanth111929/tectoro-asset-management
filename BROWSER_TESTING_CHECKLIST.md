# Browser Testing Checklist with DevTools

**Date:** September 2, 2026
**Application:** Tectoro Asset Management
**URL:** http://192.168.20.180:3000
**Database:** SQLite (databases/local_assets.db)

## Pre-Test Setup

1. **Open Browser:** Google Chrome or Firefox (recommended for DevTools)
2. **Open DevTools:** Press F12 or Right-click → Inspect
3. **Configure DevTools:**
   - Open Console tab (check for JavaScript errors)
   - Open Network tab (monitor API calls)
   - Check "Preserve log" in Network tab
   - Check "Disable cache" while testing

---

## Test 1: Login & Authentication

### Steps:
1. Navigate to: `http://192.168.20.180:3000`
2. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
3. Click "Login"

### DevTools Checks:
- **Console:** No errors (red messages)
- **Network:**
  - `POST /api/auth/login` → Status 200
  - Response contains `token` field
- **Application/Storage:**
  - Check localStorage for auth token
  - Token should be stored as `token` key

### Expected Result:
✓ Redirect to Dashboard
✓ No console errors
✓ Token stored in localStorage

---

## Test 2: Dashboard Loading

### Steps:
1. Verify Dashboard displays correctly
2. Check statistics display

### DevTools Checks:
- **Console:** No errors
- **Network:**
  - `GET /api/dashboard/stats` → Status 200
  - `GET /api/dashboard/activity` → Status 200
  - Response data should show asset counts
- **Elements:** Verify DOM elements render correctly

### Expected Result:
✓ Dashboard stats display (Total Assets, Assigned, Available)
✓ Charts/graphs load (if any)
✓ Recent activity shows
✓ No 404 or 500 errors in Network tab

---

## Test 3: Assets Page - List View

### Steps:
1. Navigate to Assets → View All Assets
2. Scroll through the asset list
3. Use filters (Category, Status)
4. Use search box

### DevTools Checks:
- **Console:** No errors
- **Network:**
  - `GET /api/assets?limit=X&offset=Y` → Status 200
  - Pagination requests work correctly
  - Filter requests: `GET /api/assets?category=Laptop&status=Available`
- **Performance:** Check page load time

### Expected Result:
✓ Asset list displays with all columns
✓ Filters work without page reload
✓ Search updates results dynamically
✓ Pagination buttons work
✓ No memory leaks (check DevTools Memory tab)

---

## Test 4: Asset Details & Status Change

### Steps:
1. Click on Asset with Serial: `5BGMX33` (ID: 40)
2. View asset details
3. Change status: Available → Assigned
4. Verify change persists
5. Refresh page (F5)
6. Verify status still shows "Assigned"

### DevTools Checks:
- **Console:** No errors
- **Network:**
  - `GET /api/assets/40` → Status 200
  - `PUT /api/assets/40` → Status 200 (on update)
  - `GET /api/assets/40/details` → Status 200
- **Response Data:** Verify `status` field updates correctly

### Expected Result:
✓ Asset details load correctly
✓ Status change saves immediately
✓ **CRITICAL:** Status persists after page refresh
✓ Audit log created for status change

---

## Test 5: Employee Management

### Steps:
1. Navigate to Employees page
2. Click on Employee: `GGH` (Imran)
3. View employee details and assigned assets
4. Change employee status: Active → Inactive
5. Verify change persists
6. Refresh page

### DevTools Checks:
- **Console:** No errors
- **Network:**
  - `GET /api/employees` → Status 200
  - `GET /api/employees/GGH` → Status 200
  - `PUT /api/employees/GGH` → Status 200 (on update)
  - `GET /api/employees/GGH/assets` → Status 200
- **Response Data:** Check `status` and `is_active` fields

### Expected Result:
✓ Employee list displays correctly
✓ Employee details show assigned assets
✓ **CRITICAL:** Status change persists after refresh
✓ Cannot assign assets to inactive employee

---

## Test 6: Asset Assignment Flow

### Steps:
1. Find an Available asset
2. Click "Assign to Employee"
3. Select employee: `GGH`
4. Assign date and notes
5. Submit assignment
6. Verify asset status → "Assigned"
7. Verify employee shows the asset

### DevTools Checks:
- **Console:** No errors
- **Network:**
  - `POST /api/operations/assign` → Status 200
  - `GET /api/assets/{id}` → Verify `employee_id` populated
  - `GET /api/employees/GGH/assets` → Asset appears in list
- **Response:** Check both asset and employee relationship

### Expected Result:
✓ Assignment succeeds
✓ Asset status updates to "Assigned"
✓ Asset shows employee details
✓ Employee's asset list includes the asset
✓ Lifecycle event created
✓ Audit log entry created

---

## Test 7: Asset Return Flow

### Steps:
1. Find an Assigned asset (use 5BGMX33 if assigned)
2. Click "Return Asset"
3. Enter return date and notes
4. Submit return
5. Verify asset status → "Available"
6. Verify employee no longer shows the asset

### DevTools Checks:
- **Console:** No errors
- **Network:**
  - `POST /api/operations/return` → Status 200
  - Asset `employee_id` should be NULL
  - Status should be "Available"

### Expected Result:
✓ Return succeeds
✓ Asset status updates to "Available"
✓ Asset employee field cleared
✓ Employee's asset list updated
✓ Lifecycle event created

---

## Test 8: CRUD Operations

### Assets - Create:
1. Navigate to Assets → Add New Asset
2. Fill form (name, serial, category, etc.)
3. Submit
4. Verify asset appears in list

**DevTools:** `POST /api/assets` → Status 201

### Assets - Edit:
1. Edit an existing asset
2. Change RAM or asset name
3. Save
4. Verify changes persist

**DevTools:** `PUT /api/assets/{id}` → Status 200

### Assets - Soft Delete:
1. Delete an asset
2. Verify it moves to "Deleted Assets"
3. Restore the asset
4. Verify it's back in main list

**DevTools:**
- `DELETE /api/assets/{id}` → Status 200
- `POST /api/assets/{id}/restore` → Status 200

### Expected Result:
✓ All CRUD operations work
✓ Changes persist after refresh
✓ No data loss
✓ Proper validation messages

---

## Test 9: Search & Filters

### Steps:
1. Use Global Search (search icon)
2. Search for "Dell"
3. Verify results show assets and employees
4. Test category filters on Assets page
5. Test status filters

### DevTools Checks:
- **Network:**
  - `GET /api/search/global?q=Dell` → Status 200
  - Filter requests show correct parameters

### Expected Result:
✓ Search returns relevant results
✓ Filters apply without page reload
✓ Results update dynamically
✓ No lag or performance issues

---

## Test 10: Audit Logs & History

### Steps:
1. Navigate to Reports → Audit Logs
2. Check recent activities
3. View Asset History for asset 5BGMX33
4. Verify lifecycle events display

### DevTools Checks:
- **Network:**
  - `GET /api/audit-logs` → Status 200
  - `GET /api/assets/40/history` → Status 200
  - `GET /api/lifecycle/asset/40` → Status 200

### Expected Result:
✓ Audit logs display all recent actions
✓ Asset history shows complete timeline
✓ Lifecycle events show assignments/returns
✓ User information shown correctly

---

## Test 11: Static Assets & Resources

### DevTools Checks:
- **Network Tab → Filter by:**
  - JS files: All should load (Status 200)
  - CSS files: All should load (Status 200)
  - Images: No 404 errors
  - Fonts: Load correctly

### Expected Result:
✓ No 404 errors for static files
✓ All JavaScript bundles load
✓ All CSS stylesheets load
✓ Application styles render correctly

---

## Test 12: Performance Check

### DevTools Performance Tab:
1. Record page load
2. Navigate through pages
3. Check for:
   - Long tasks (>50ms)
   - Memory leaks
   - Excessive re-renders

### Console Performance:
- Check for warnings about:
  - Deprecated APIs
  - Performance issues
  - Memory usage

### Expected Result:
✓ Page loads in <2 seconds
✓ No memory leaks detected
✓ Smooth navigation between pages
✓ No performance warnings

---

## Test 13: Service Restart Persistence

### Steps:
1. Make changes (assign asset, update status)
2. **Stop the server:**
   ```bash
   # Find Gunicorn process
   ps aux | grep gunicorn
   # Kill processes
   pkill -f "gunicorn.*api_server"
   ```
3. **Restart the server:**
   ```bash
   cd /home/administrator/Desktop/asset-management
   source venv/bin/activate
   APP_ENV=office gunicorn --bind 0.0.0.0:3000 --workers 2 \
     --timeout 120 api_server:app
   ```
4. Refresh browser
5. Verify all changes persisted

### Expected Result:
✓ **CRITICAL:** All data changes persist
✓ Asset statuses unchanged
✓ Employee statuses unchanged
✓ Assignments remain intact
✓ Database integrity maintained

---

## Common Issues to Check For

### Console Errors:
- ❌ `TypeError: Cannot read property 'X' of undefined`
- ❌ `Failed to fetch` (API connection issues)
- ❌ `SyntaxError` in JavaScript
- ❌ CORS errors

### Network Errors:
- ❌ 404 Not Found (missing endpoints or static files)
- ❌ 500 Internal Server Error (backend crashes)
- ❌ 401 Unauthorized (auth token issues)
- ❌ Long response times (>5 seconds)

### Performance Issues:
- ❌ Memory usage increasing over time
- ❌ Slow page loads
- ❌ Laggy interactions
- ❌ Browser freezing

### Data Issues:
- ❌ Changes not saving
- ❌ Data not persisting after refresh
- ❌ Incorrect data displayed
- ❌ Missing relationships (asset ↔ employee)

---

## Success Criteria

All tests must pass with:
- ✅ **Zero console errors** (warnings acceptable)
- ✅ **All API calls return 200/201** (no 404/500 errors)
- ✅ **Data persists after page refresh**
- ✅ **Data persists after server restart**
- ✅ **No memory leaks**
- ✅ **Fast page loads (<2 seconds)**
- ✅ **Smooth user interactions**
- ✅ **Asset status changes work (5BGMX33)**
- ✅ **Employee status changes work**
- ✅ **Asset assignments/returns work**

---

## Notes

- **Browser:** Chrome/Firefox with latest updates recommended
- **Clear cache** before testing if issues occur
- **Test in incognito/private mode** for clean state
- **Document any errors** with screenshots
- **Check browser compatibility** if needed (Edge, Safari)

---

## Server Information

**Production URL:** http://192.168.20.180:3000
**API Base:** http://192.168.20.180:3000/api
**Database:** SQLite at `/home/administrator/Desktop/asset-management/databases/local_assets.db`
**Backend:** Python Flask + SQLAlchemy
**Frontend:** React + Axios

**Login Credentials:**
- Admin: admin / admin123
- User: Standard / (check with admin)
- Viewer: View / (check with admin)

---

**Testing Status:** Ready for manual browser testing
**Last Updated:** September 2, 2026
