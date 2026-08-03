# Phase 3 - Employee Asset History Testing Guide

## Quick Access

**Application URL:** http://192.168.20.180:3000

**Test Route:** `/employees/:employeeId/asset-history`

---

## Step-by-Step Testing

### 1. Access Employee List
1. Login to the application (admin credentials required)
2. Navigate to **Employees** from the sidebar
3. You should see the employee list

### 2. Open Employee Asset History
1. Look for the **🕐 clock icon** button in the Actions column
2. Click the clock icon for any employee
3. Employee Asset History page should open

### 3. Verify Summary Cards
✅ Check that 5 summary cards display at the top:
- Current Assigned Devices (count)
- Total Devices Used (count)
- Total Assignments (count)
- Total Replacements (count)
- Total Returns (count)

### 4. Verify Currently Assigned Devices
✅ If employee has current assets:
- Asset cards should display
- Each card shows: name, category, brand, model, serial, assigned date, status
- Click on a card → Should open Inventory Detail page
- Click browser back to return

### 5. Verify Employee Details Card
✅ Check employee information displays:
- Name
- Employee ID
- Email
- Mobile number
- Department
- Designation
- Location

### 6. Verify Asset Usage Statistics Card
✅ Check statistics are accurate:
- Total devices used
- Currently assigned
- Total assignments
- Total returns
- Total events

### 7. Test Complete Timeline
✅ Scroll through the timeline:
- Events should be in chronological order (newest first)
- Each event should show:
  - Event icon and title
  - Date and time
  - Asset name (clickable link)
  - Serial number
  - Brand and model
  - Category badge
  - Location (if available)
  - Details/remarks
  - Performed by (if available)

### 8. Test Asset Links
✅ Click on any asset name in the timeline:
- Should open Inventory Detail page for that asset
- Click browser back to return

### 9. Test Filters

**Try each filter:**
1. **All Events** - Should show everything
2. **Current Assets** - Should show only current assignments
3. **Assignments** - Should show only assignment events
4. **Returns** - Should show only return events
5. **Replacements** - Should show only replacement events
6. **Temporary Assignments** - Should show only temp assignments
7. **Repairs** - Should show only repair-related events

✅ Verify:
- Timeline updates immediately
- Event count matches what's displayed
- Correct events shown for each filter

### 10. Test Search

**Try searching for:**
1. Asset name (e.g., "Dell Latitude")
2. Serial number
3. Category (e.g., "Laptop")
4. Brand (e.g., "HP")
5. Event type (e.g., "Assigned")

✅ Verify:
- Results update as you type
- Matching events are shown
- Non-matching events are hidden
- Clear button (X) works
- Search works with filters

### 11. Test Sort Order

1. Click "Sort Order" dropdown
2. Select **"Oldest First"**
   ✅ Timeline should reverse (oldest events at top)
3. Select **"Newest First"**
   ✅ Timeline should return to normal (newest at top)

### 12. Test PDF Export

1. Click the **PDF icon** button (red)
2. ✅ Verify:
   - PDF downloads automatically
   - Filename: `{employee_name}_asset_history_{date}.pdf`
   - PDF contains employee info
   - PDF contains timeline table
   - All visible events are in the PDF

### 13. Test Excel Export

1. Click the **Excel icon** button (green)
2. ✅ Verify:
   - CSV file downloads automatically
   - Filename: `{employee_name}_asset_history_{date}.csv`
   - File opens in Excel
   - All columns present
   - All visible events are in the CSV

### 14. Test Print

1. Click the **Print icon** button (gray)
2. ✅ Verify:
   - Print preview opens
   - Layout looks good
   - Buttons are hidden
   - Timeline is visible
   - Can print or save as PDF

### 15. Test Navigation

1. Click **"Back to Employees"** button
   ✅ Should return to Employee List
2. Navigate back to employee history
3. Click **browser back button**
   ✅ Should return to previous page
4. Click **browser forward button**
   ✅ Should return to employee history

---

## Edge Case Testing

### Test Employee with No Assets
1. Find or create an employee with no asset history
2. Open their asset history
3. ✅ Verify:
   - Summary cards show zeros
   - No current assets section
   - Timeline shows "No events found" message
   - No errors in console

### Test Employee with One Asset
1. Find employee with only one assignment
2. ✅ Verify:
   - Summary shows correct counts
   - Current assets section shows the one device
   - Timeline shows assignment event
   - All features work normally

### Test Employee with Multiple Assets
1. Find employee with 5+ assets in history
2. ✅ Verify:
   - All assets appear in timeline
   - Filters work correctly
   - Search works across all assets
   - Export includes all assets

### Test Employee with Replacements
1. Find employee who received a replacement device
2. ✅ Verify:
   - Replacement event shows in timeline
   - Shows both old and new device
   - Old device condition displayed
   - Replacement reason shown

### Test Employee with Temporary Assignments
1. Find employee with loaner device history
2. ✅ Verify:
   - Two events appear (original + temp)
   - Original device shows "sent for repair"
   - Temp device shows "temporary replacement"
   - Both link to correct inventory pages

---

## Regression Testing

### Verify NO Changes to Existing Pages

✅ **Employee List:**
- Still displays all employees
- All columns present
- Other buttons still work
- No console errors

✅ **Inventory Detail (Phase 1):**
- Still displays correctly
- All sections present
- "View Complete Lifecycle" button works

✅ **Inventory Lifecycle (Phase 2):**
- Still displays correctly
- Timeline works
- Filters work
- Export works

✅ **Asset View:**
- Still displays correctly
- All tabs work
- Assignment works

✅ **Asset List:**
- Still displays correctly
- Search works
- Filters work

---

## Performance Testing

### Load Time
1. Open employee history for employee with 20+ events
2. ✅ Check:
   - Page loads in < 2 seconds
   - Timeline renders smoothly
   - No lag when scrolling

### Filter Performance
1. Apply different filters rapidly
2. ✅ Check:
   - Filters apply instantly
   - No lag or freeze
   - Timeline updates smoothly

### Search Performance
1. Type quickly in search box
2. ✅ Check:
   - Results update in real-time
   - No lag while typing
   - Results accurate

---

## Console Check

### Open Browser DevTools (F12)

✅ **Console Tab:**
- No red errors
- No warnings (except build warnings are OK)

✅ **Network Tab:**
- API calls complete successfully
- No 404 or 500 errors
- Response times < 1 second

---

## Browser Compatibility

### Test in Different Browsers

✅ **Chrome/Edge:**
- All features work
- Layout correct
- No errors

✅ **Firefox:**
- All features work
- Layout correct
- No errors

✅ **Safari (if available):**
- All features work
- Layout correct
- No errors

---

## Mobile Testing (Optional)

### Test on Mobile Device or Responsive Mode

1. Open DevTools → Toggle device toolbar (mobile view)
2. ✅ Check:
   - Layout adapts to mobile
   - Timeline still readable
   - Buttons still clickable
   - Cards stack vertically
   - No horizontal scroll

---

## Summary Checklist

- [ ] Employee List has clock icon button
- [ ] Clock icon opens employee history page
- [ ] Summary cards display correct data
- [ ] Current assets section shows assigned devices
- [ ] Employee details card shows all info
- [ ] Statistics card shows accurate counts
- [ ] Timeline displays all events chronologically
- [ ] Events show complete information
- [ ] Asset links work (go to inventory detail)
- [ ] All 7 filters work correctly
- [ ] Search works across all fields
- [ ] Sort order toggle works
- [ ] PDF export works
- [ ] Excel export works
- [ ] Print preview works
- [ ] Navigation works (back buttons, links)
- [ ] Edge cases handled (no assets, one asset, many assets)
- [ ] No regressions in existing pages
- [ ] Performance is good (< 2 seconds)
- [ ] No console errors
- [ ] Works in multiple browsers

---

## If You Find Issues

### Report with:
1. **What page** - Employee Asset History
2. **What action** - What you were doing
3. **Expected result** - What should happen
4. **Actual result** - What actually happened
5. **Browser** - Chrome, Firefox, etc.
6. **Console errors** - Any red errors in DevTools
7. **Screenshots** - If UI issue

---

## Testing Complete ✅

Once all items are checked:
- Phase 3 is working correctly
- Ready for production use
- Proceed to Phase 4 approval

**Next Phase:** Global Search (unified search across assets and employees)
