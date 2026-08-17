# Testing Guide: Total Users + IST Timezone Fixes

## Quick Test Checklist

### Test 1: Total Users - Currently Assigned Asset
**Page:** Inventory Detail
**URL:** `http://192.168.20.180:3000/inventory/detail/1`

**Steps:**
1. Open Inventory Detail page for any assigned asset
2. Look at the summary cards at the top
3. Check "Total Users" card (shows people icon)

**Expected Result:**
- Total Users should show **at least 1** (not 0)
- If asset is currently assigned, should show 1 or more

**Example:**
```
Asset: Dell Laptop
Serial: 6YW18Q2
Assigned To: Ajay Budidha (TT919)
Total Users: 1 ✓
```

### Test 2: Total Users - Multiple Historical Users
**Find an asset that has been reassigned**

**Steps:**
1. Look for an asset in Asset List that shows activity history
2. Click View → check Inventory Detail page
3. Verify Total Users count

**Expected Result:**
- If asset was assigned to Employee A, then Employee B, then Employee C
- Total Users should show: **3**

**To Verify History:**
- Click "View Complete Lifecycle Timeline" button
- Check assignment events
- Count unique employee IDs
- Total Users should match unique count

### Test 3: Total Users API Response
**Test the API directly**

```bash
# Test asset ID 1
curl http://localhost:3000/api/assets/1/history | python3 -m json.tool

# Look for:
{
  "total_users": 1,
  "unique_users": ["TT919"],
  ...
}
```

**Expected:**
- `total_users`: Integer count
- `unique_users`: Array of employee IDs
- Count matches array length

### Test 4: IST Date Validation - Part Replacement
**Page:** Part Replacement
**URL:** `http://192.168.20.180:3000/part-replacements`

**Steps:**
1. Click "New Part Replacement"
2. Select an asset
3. Fill in component details
4. For "Replacement Date" enter: **17/08/2026** (today)
5. Complete the form
6. Click Submit

**Expected Result:**
- Date **17/08/2026** should be ACCEPTED (today in IST)
- No error: "Date cannot be in the future"
- Form should submit successfully

**Test Tomorrow's Date:**
1. Enter: **18/08/2026**
2. Try to submit

**Expected Result:**
- Should show error: "Replacement date cannot be in the future"
- Form should NOT submit

### Test 5: IST Date Validation - Asset Replacement
**Page:** Asset Replacements

**Steps:**
1. Create new asset replacement
2. Use today's date: **17/08/2026**
3. Submit

**Expected Result:**
- Should accept today's IST date
- No future date error

### Test 6: Timestamp Display - Activity History
**Page:** Activity History
**URL:** `http://192.168.20.180:3000/activity-history`

**Steps:**
1. Open Activity History page
2. Look at recent activity timestamps
3. Verify times shown

**Expected Result:**
- All timestamps should display in IST
- Times should match India Standard Time (UTC+5:30)
- Format: DD/MM/YYYY HH:MM:SS

### Test 7: Employee Asset History
**Page:** Employee Asset History

**Steps:**
1. Go to Employees page
2. Click "History" for any employee
3. Check the timeline events
4. Verify dates and times

**Expected Result:**
- All dates show IST
- Assignment dates are correct
- Return dates are correct
- No timezone shift issues

## Detailed Testing Scenarios

### Scenario A: New Asset Assignment
**Test Flow:**
1. Create new asset or use Available asset
2. Assign to employee (TT727)
3. Check Inventory Detail page
4. Verify Total Users = 1

**Expected Data:**
```json
{
  "total_users": 1,
  "unique_users": ["TT727"]
}
```

### Scenario B: Asset Reassignment
**Test Flow:**
1. Asset currently assigned to TT919
2. Reassign to TT801
3. Check Inventory Detail page
4. Verify Total Users = 2

**Expected Data:**
```json
{
  "total_users": 2,
  "unique_users": ["TT919", "TT801"]
}
```

### Scenario C: Asset Return and Reassign
**Test Flow:**
1. Asset assigned to TT919
2. Return asset (status → Available)
3. Assign to TT920
4. Check Inventory Detail
5. Verify Total Users = 2

**Expected:**
- TT919 still counted (historical user)
- TT920 counted (current user)
- Total = 2 unique employees

### Scenario D: Same User Twice
**Test Flow:**
1. Asset assigned to TT801
2. Return asset
3. Later, assign to TT919
4. Return asset
5. Assign back to TT801
6. Check Total Users

**Expected:**
- TT801: Counted ONCE (despite 2 assignments)
- TT919: Counted ONCE
- Total Users = 2 (not 3)

## API Testing

### Test All Asset Categories
```bash
# Get all categories
curl http://localhost:3000/api/assets

# Test each category
for category in Laptop Desktop Monitor Printer Phone Server Mouse Headphones "Hard Disk" UPS; do
  echo "Testing category: $category"
  # Find asset with this category, get its history
done
```

### Test Unassigned Asset
```bash
# Find asset with status=Available and emp_id IS NULL
curl http://localhost:3000/api/assets/history/<unassigned_asset_id>

# Expected:
{
  "total_users": 0,
  "unique_users": []
}
```

## Browser Testing

### Desktop Browsers
- ✅ Chrome
- ✅ Firefox
- ✅ Edge
- ✅ Safari

### Mobile Browsers
- ✅ Chrome Mobile
- ✅ Safari iOS
- ✅ Firefox Mobile

### Test Checklist
- [ ] Total Users displays correct number
- [ ] Number is >= 1 for assigned assets
- [ ] Number is 0 for never-assigned assets
- [ ] Unique employees list shows correctly
- [ ] Today's date (17/08/2026) accepted in forms
- [ ] Tomorrow's date (18/08/2026) rejected in forms
- [ ] Timestamps show IST in activity logs
- [ ] No timezone shift errors
- [ ] No "date in future" errors for today

## Database Verification

### Check Asset History Tables
```sql
-- Check current assignments
SELECT id, asset_name, serial_number, emp_id, employee_name, status 
FROM assets 
WHERE emp_id IS NOT NULL;

-- Check lifecycle events
SELECT asset_id, event_type, from_employee_id, to_employee_id, created_at
FROM asset_lifecycle
WHERE asset_id = 1
ORDER BY created_at DESC;

-- Check audit logs
SELECT asset_id, action_type, old_value, new_value, timestamp
FROM audit_logs
WHERE asset_id = 1 AND field_name = 'emp_id'
ORDER BY timestamp DESC;

-- Check temporary assignments
SELECT asset_id AS original_asset_id, employee_id, created_at
FROM temporary_assignments
WHERE original_asset_id = 1 OR temp_asset_id = 1;
```

## Performance Testing

### Test Large History
**Find asset with many assignments:**
```bash
# Asset with 10+ lifecycle events
curl http://localhost:3000/api/assets/<asset_id>/history

# Verify:
# - Response time < 2 seconds
# - All events returned
# - Unique users calculated correctly
# - No duplicate employee IDs
```

## Error Cases to Test

### Test 1: Invalid Date Format
```
Input: "2026-13-45" (invalid)
Expected: Error message
```

### Test 2: Very Old Date
```
Input: "1990-01-01"
Expected: Accepted (in the past)
```

### Test 3: Missing Asset
```
GET /api/assets/999999/history
Expected: 404 Not Found
```

### Test 4: Asset with No History
```
GET /api/assets/<new_asset_id>/history
Expected: 
{
  "total_users": 0 or 1 (if currently assigned),
  "events": []
}
```

## Regression Testing

### Ensure These Still Work
- [ ] Asset assignment workflow
- [ ] Asset return workflow
- [ ] Asset replacement
- [ ] Part replacement
- [ ] Temporary assignment
- [ ] Employee deletion (soft delete)
- [ ] Employee activation/deactivation
- [ ] Bulk import
- [ ] Reports generation
- [ ] Warranty tracking
- [ ] Dashboard statistics

### Critical Workflows
1. **Create Asset → Assign → View Details**
   - Total Users should show 1

2. **Assign → Return → Reassign**
   - Total Users should show 2 (both employees)

3. **Multiple Replacements**
   - Total Users counts all employees involved

4. **Today's Transactions**
   - All dates show 17/08/2026
   - No future date errors

## Success Criteria

### Total Users Fix
✅ **PASS Criteria:**
- Assigned asset shows Total Users >= 1
- Never-assigned asset shows Total Users = 0
- Multiple users counted correctly
- Same user assigned twice = counted once
- Historical users preserved after return
- All asset categories work consistently

❌ **FAIL Criteria:**
- Any assigned asset shows Total Users = 0
- Count doesn't match unique employee history
- Historical users lost after reassignment
- Duplicate counting of same employee

### IST Timezone Fix
✅ **PASS Criteria:**
- Today's date (17/08/2026) accepted everywhere
- Tomorrow's date (18/08/2026) rejected where future dates not allowed
- All timestamps display IST
- No timezone conversion errors
- Activity logs show correct times

❌ **FAIL Criteria:**
- Today's date rejected as "future"
- Timestamps show wrong timezone
- Date off-by-one errors
- Activity times incorrect

## Automated Testing Commands

### Quick Smoke Test
```bash
#!/bin/bash
echo "Testing Total Users API..."
response=$(curl -s http://localhost:3000/api/assets/1/history)
total=$(echo $response | python3 -c "import sys,json; print(json.load(sys.stdin)['total_users'])")
echo "Total Users for Asset 1: $total"

if [ "$total" -ge 1 ]; then
  echo "✅ PASS: Total Users >= 1"
else
  echo "❌ FAIL: Total Users = 0"
fi
```

### Test Multiple Assets
```bash
#!/bin/bash
for id in 1 2 3 4 5; do
  echo "Asset $id:"
  curl -s http://localhost:3000/api/assets/$id/history | \
    python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"  Total Users: {d['total_users']}\"); print(f\"  Unique: {d['unique_users']}\")"
done
```

## Manual Verification Steps

### Step-by-Step Verification

**1. Open Application**
```
http://192.168.20.180:3000
```

**2. Navigate to Dashboard**
- Should load without errors
- Recent activity shows IST timestamps

**3. Open Any Assigned Asset**
- Assets → View any assigned asset
- Or: Inventory → Laptop → Click any asset

**4. Check Inventory Detail Page**
Look for the summary cards:
```
┌───────────┐  ┌───────────┐  ┌───────────┐
│  👥       │  │  🔧       │  │  🔄       │
│   1       │  │   0       │  │   0       │
│Total Users│  │Repairs    │  │Replaces   │
└───────────┘  └───────────┘  └───────────┘
```

**5. Verify Number**
- Total Users should be 1 or more
- NOT 0 for assigned assets

**6. Check Unique Users Section**
Below the cards, should see:
```
Users Who Used This Device
══════════════════════════
3 unique employee(s) have used this device:
[TT727] [TT801] [TT919]
```

**7. Test Date Input**
- Go to Part Replacement
- Enter today's date: 17/08/2026
- Should accept without "future date" error

## Troubleshooting

### If Total Users Still Shows 0

**Check 1: API Response**
```bash
curl http://localhost:3000/api/assets/1/history | python3 -m json.tool | grep -A 3 total_users
```
Should show: `"total_users": 1` or more

**Check 2: Frontend Console**
- Open browser dev tools (F12)
- Check Console for errors
- Check Network tab for API response

**Check 3: Backend Logs**
```bash
tail -50 /home/administrator/Desktop/asset-management/api_server.log
```
Look for errors in `/api/assets/<id>/history` endpoint

**Check 4: Database**
```bash
sqlite3 databases/local_assets.db "SELECT emp_id FROM assets WHERE id=1;"
```
Should return an employee ID (not NULL)

### If Date Validation Still Fails

**Check 1: Timezone Utility**
```bash
cd /home/administrator/Desktop/asset-management
python3 -c "from utils.timezone_utils import get_ist_today; print(get_ist_today())"
```
Should print: `2026-08-17`

**Check 2: Backend Import**
```bash
python3 -c "from utils.timezone_utils import validate_date_not_future; from datetime import date; print(validate_date_not_future(date(2026, 8, 17)))"
```
Should print: `(True, None)`

## Final Checklist

Before marking as complete, verify:

- [ ] Total Users displays >= 1 for assigned assets
- [ ] Total Users = 0 for unassigned assets  
- [ ] Multiple users counted correctly
- [ ] Same user assigned twice = counted once
- [ ] Today's date (17/08/2026) accepted
- [ ] Tomorrow's date (18/08/2026) rejected in no-future-date fields
- [ ] Activity timestamps show IST
- [ ] No browser console errors
- [ ] No backend API errors
- [ ] All asset categories work
- [ ] Frontend build successful
- [ ] Backend running correctly
- [ ] Database queries work
- [ ] No regression in other features

## Support

### If Issues Found
1. Check browser console (F12)
2. Check backend logs: `tail -f api_server.log`
3. Test API directly with curl
4. Check database with sqlite3
5. Review `/home/administrator/Desktop/asset-management/TOTAL_USERS_IST_FIX_COMPLETE.md`

### Contact Information
- Documentation: See `TOTAL_USERS_IST_FIX_COMPLETE.md`
- API Logs: `api_server.log`
- Database: `databases/local_assets.db`
- Frontend: `http://192.168.20.180:3000`
