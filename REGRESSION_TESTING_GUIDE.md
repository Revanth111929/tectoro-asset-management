# REGRESSION TESTING GUIDE - QUICK START

**Status:** HTTP Standardization 50% Complete  
**Remaining:** Manual Regression Testing Required  
**Owner:** You (User)  

---

## WHAT TO TEST

7 pages were modified. All must be tested:

1. **Login Page** (/) - 10 scenarios
2. **Dashboard** (/dashboard) - 8 scenarios  
3. **Asset Edit** (/assets/edit/:id) - 10 scenarios
4. **Asset Import** (/assets/import) - 8 scenarios
5. **Inventory Lifecycle** (/inventory/lifecycle/:id) - 10 scenarios
6. **Activity History** (/activity-history) - 8 scenarios
7. **Asset History Timeline** (component) - 6 scenarios

**Plus:** 6 token management tests

**Total:** 66 test scenarios

---

## HOW TO TEST

### Setup
1. Start backend: `cd backend && python run.py`
2. Start frontend: `cd frontend && npm start`
3. Open browser: http://localhost:3000
4. Open DevTools (F12) - keep Console and Network tabs visible

### For Each Page
1. Open `REGRESSION_TEST_CHECKLIST.md`
2. Follow test steps exactly
3. Mark ✓ PASS or ✗ FAIL for each scenario
4. Screenshot any failures
5. Check console for errors/warnings

### Success Criteria
A page PASSES only when:
- ✓ All scenarios PASS
- ✓ No console errors
- ✓ No React warnings
- ✓ No network errors (except when testing error scenarios)
- ✓ Frontend + Backend + Database all work together

---

## TESTING ORDER

**Test in this exact order:**

### Phase 1: Critical Path (MUST PASS)
1. Login Page - Without this, nothing else works
2. Dashboard - Main landing page

**STOP if either fails. Fix before continuing.**

### Phase 2: Core Features
3. Asset Edit - Critical operations (email, PDF)
4. Asset Import - Bulk operations

**STOP if either fails. Fix before continuing.**

### Phase 3: Timeline Features
5. Inventory Lifecycle - Timeline with error handling
6. Activity History - Audit log
7. Asset History Timeline - Component used everywhere

**STOP if any fails. Fix before continuing.**

### Phase 4: Token Management
8. Token Tests - Auth flow verification

---

## WHAT TO CHECK

### Every Page Must Have:
- ✓ Loading spinner during API calls
- ✓ Success state displays correctly
- ✓ Error state displays with user-friendly message
- ✓ Retry button works (where applicable)
- ✓ No console errors
- ✓ No React warnings
- ✓ Network requests use correct auth token
- ✓ Empty states handled
- ✓ Null values handled

### Network Tab Verification:
For each API request, verify:
- ✓ Request URL correct
- ✓ Request method correct (GET/POST/PUT/DELETE)
- ✓ Authorization header present: `Bearer <token>`
- ✓ Response status correct (200, 201, 400, 404, 500)
- ✓ Response body structure correct

---

## COMMON ISSUES TO WATCH FOR

### Response Shape Problems
```javascript
// BEFORE (direct fetch)
const data = await response.json();
const items = data.items;  // ❌ May be undefined

// AFTER (API service)
const response = await assetAPI.getAll();
const items = response.data.items;  // ✓ Must check .data
```

### Blob Handling
```javascript
// PDF downloads MUST use responseType: 'blob'
const response = await assetAPI.getAssignmentForm(id);
const blob = response.data;  // ✓ Already a blob
```

### Error Messages
```javascript
// Check error.response.data.error exists
catch (err) {
  const message = err.response?.data?.error || 'Default message';
}
```

---

## WHEN YOU FIND A BUG

### STOP IMMEDIATELY
1. Do NOT continue testing
2. Document the failure:
   - Page name
   - Scenario name
   - Steps to reproduce
   - Expected result
   - Actual result
   - Screenshot
   - Console log
   - Network log

### Fix Process
3. Identify root cause
4. Fix the code
5. Test the fix
6. Restart testing FROM THE BEGINNING of that page
7. Only continue to next page after current page is 100% PASS

---

## EXAMPLE TEST EXECUTION

### Test: Login with Valid Credentials

**Steps:**
1. Open http://localhost:3000/
2. Enter username: `admin`
3. Enter password: `admin123`
4. Click LOGIN

**Observe:**
- Loading spinner appears? ✓ YES
- Redirect to /dashboard? ✓ YES
- Check localStorage:
  - Token exists? ✓ YES
  - User exists? ✓ YES
  - Token expiry exists? ✓ YES
- Check console: ✓ NO ERRORS
- Check network:
  - Request to /api/auth/login? ✓ YES
  - Authorization header? ✓ YES (or N/A for login)
  - Response 200? ✓ YES

**Result:** ✅ PASS

---

## MARKING THE CHECKLIST

### In REGRESSION_TEST_CHECKLIST.md:

```markdown
#### 1.1 Valid Login ✅ PASS
**Actual:**
- [x] PASS
- [ ] FAIL: _______________
- [ ] BLOCKED: _______________

**Evidence:**
- Screenshot: login_success.png
- Console: No errors
- Network: 200 OK, token received
```

or

```markdown
#### 1.1 Valid Login ❌ FAIL
**Actual:**
- [ ] PASS
- [x] FAIL: Error message not displayed
- [ ] BLOCKED: _______________

**Evidence:**
- Screenshot: login_error_missing.png
- Console: No errors but no UI feedback
- Network: 400 Bad Request but error not shown to user
- Root Cause: Missing setError() in catch block
```

---

## COMPLETION CRITERIA

### You can mark HTTP Standardization as VERIFIED when:

✅ ALL 66 scenarios PASS  
✅ ALL 7 pages PASS  
✅ Token management PASS  
✅ No console errors anywhere  
✅ No React warnings anywhere  
✅ All screenshots/evidence collected  

### Then update:
- DEFECT_REGISTER.md - Mark BUG-010, BUG-013, BUG-014 as VERIFIED
- AUDIT_METRICS.txt - Update regression testing to 100%
- STABILIZATION_STATUS.md - Mark HTTP Standardization as VERIFIED

---

## TIME ESTIMATE

- Login Page: 15 minutes
- Dashboard: 15 minutes
- Asset Edit: 20 minutes
- Asset Import: 15 minutes
- Inventory Lifecycle: 20 minutes
- Activity History: 15 minutes
- Asset History Timeline: 15 minutes
- Token Management: 10 minutes

**Total:** ~2 hours

**With bug fixes:** Plan for 4-6 hours

---

## TOOLS YOU NEED

- ✓ Browser (Chrome/Firefox recommended)
- ✓ DevTools open (Console + Network tabs)
- ✓ Screenshot tool
- ✓ Text editor for checklist
- ✓ Backend running
- ✓ Frontend running

---

## QUESTIONS TO ASK DURING TESTING

1. Does the page load?
2. Is there a loading indicator?
3. Does the success state look correct?
4. What happens on error?
5. Is there a retry button?
6. Does retry work?
7. Are console logs clean?
8. Are network requests correct?
9. Is the auth token attached?
10. Does token refresh work?

---

## IF YOU GET STUCK

### Backend Issues
- Check backend console for errors
- Verify database connection
- Check API endpoint exists
- Verify backend code matches frontend expectations

### Frontend Issues
- Check browser console
- Check Network tab
- Verify API service method exists
- Check response.data path is correct

### Cannot Test Scenario
- Mark as BLOCKED in checklist
- Document why
- Continue with other scenarios
- Come back later if possible

---

## FINAL REMINDER

🚫 **DO NOT:**
- Skip any test scenario
- Mark PASS without testing
- Continue if a page fails
- Make Git commits

✅ **DO:**
- Test every scenario thoroughly
- Fix bugs immediately
- Document everything
- Take screenshots
- Check console every time
- Verify network requests

---

**Ready to start?**

Open `REGRESSION_TEST_CHECKLIST.md` and begin with Login Page.

Good luck! 🚀
