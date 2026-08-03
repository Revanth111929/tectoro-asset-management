# Phase 2: Inventory Lifecycle Timeline - Testing Guide

## 🎯 Quick Start Testing

### Application Access
**URL:** http://192.168.20.180:3000

**Status:** ✅ Running on port 3000

---

## 📋 How to Access Lifecycle Page

### Method 1: From Inventory Detail
1. Login to application
2. Click **"Inventory"** in sidebar
3. Select any category (e.g., **"Laptop"**)
4. Click the **📦 (box icon)** for any asset
5. Click **"View Complete Lifecycle"** button
6. Lifecycle Timeline page opens

### Method 2: Direct URL
```
http://192.168.20.180:3000/inventory/lifecycle/1
```
(Replace `1` with any valid asset ID)

---

## ✅ Test Checklist

### 1. Page Load and Layout

- [ ] Page loads successfully
- [ ] Back button appears
- [ ] Asset name and serial number display in header
- [ ] Export buttons visible (PDF, Excel, Print)
- [ ] All 10 summary cards display in top section
- [ ] Timeline renders below filters

### 2. Summary Cards - Row 1

**Current Status Card:**
- [ ] Status badge displays
- [ ] Color matches status (Available=green, Assigned=blue, etc.)

**Current Employee Card:**
- [ ] Shows employee name if assigned
- [ ] Shows employee ID below name
- [ ] Shows "Unassigned" if not assigned

**Purchase Date Card:**
- [ ] Displays purchase date
- [ ] Shows "—" if no date

**Warranty Status Card:**
- [ ] Badge displays (Active/Expiring Soon/Expired/N/A)
- [ ] Color is correct:
  - Green for Active (>90 days)
  - Yellow for Expiring Soon (≤90 days)
  - Red for Expired
  - Gray for N/A
- [ ] Days remaining shows (if applicable)

### 3. Summary Cards - Row 2

**Statistics Cards:**
- [ ] Total Assignments count is accurate
- [ ] Total Repairs count is accurate
- [ ] Total Replacements count is accurate
- [ ] Total Returns count is accurate
- [ ] Total Events count is accurate
- [ ] Last Activity date displays

### 4. Timeline Display

**Visual Elements:**
- [ ] Vertical timeline line visible
- [ ] Event cards display in chronological order
- [ ] Icons show for each event
- [ ] Colors match event types
- [ ] Hover effects work (card lifts, icon scales)
- [ ] Animations play on load

**Event Information:**
- [ ] Event title clear and descriptive
- [ ] Date and time formatted properly
- [ ] Event type badge displays
- [ ] Employee name shows (if applicable)
- [ ] Employee ID shows (if applicable)
- [ ] Status changes display (from → to)
- [ ] Location shows (if applicable)
- [ ] Details/remarks display (if applicable)
- [ ] "Performed by" shows at bottom

### 5. Filter Functionality

**Filter Dropdown:**
- [ ] "All Events" shows total count
- [ ] Click "Assignments" - filters correctly
- [ ] Click "Repairs" - shows only repairs
- [ ] Click "Returns" - shows only returns
- [ ] Click "Transfers" - shows only transfers
- [ ] Click "Warranty" - shows warranty events
- [ ] Click "Replacements" - shows replacements
- [ ] Back to "All Events" - shows everything

**Filter Behavior:**
- [ ] Timeline updates immediately when filter changes
- [ ] Event count reflects filtered results
- [ ] Empty state shows if no matches
- [ ] Filter persists when searching

### 6. Search Functionality

**Search Box:**
- [ ] Type employee name - filters correctly
- [ ] Type event type - finds matches
- [ ] Type date - finds events
- [ ] Type remarks text - finds matches
- [ ] Search is case-insensitive
- [ ] Results update in real-time

**Search Clear:**
- [ ] Click X button - clears search
- [ ] Timeline restores to full list
- [ ] Search box empties

**Combined:**
- [ ] Search + Filter work together
- [ ] Clear search preserves filter
- [ ] Change filter preserves search

### 7. Sort Order

**Toggle Sort:**
- [ ] Default is "Newest First"
- [ ] Events start with most recent
- [ ] Change to "Oldest First"
- [ ] Events reverse (oldest at top)
- [ ] Sort persists with filters
- [ ] Sort persists with search

### 8. Export to PDF

**Generate PDF:**
- [ ] Click PDF button
- [ ] PDF downloads automatically
- [ ] Filename format: `{asset_name}_lifecycle_{date}.pdf`
- [ ] Open PDF file

**PDF Content:**
- [ ] Title "Asset Lifecycle Timeline"
- [ ] Asset name displays
- [ ] Serial number displays
- [ ] Status displays
- [ ] Table with columns: Date, Event, Employee, Details, Performed By
- [ ] All visible events included
- [ ] Filtered events if filter active
- [ ] Professional formatting
- [ ] Readable fonts

### 9. Export to Excel/CSV

**Generate CSV:**
- [ ] Click Excel button
- [ ] CSV downloads automatically
- [ ] Filename format: `{asset_name}_lifecycle_{date}.csv`
- [ ] Open in Excel/Google Sheets

**CSV Content:**
- [ ] Headers: Date & Time, Event Type, Employee, Details, Performed By, Status
- [ ] All rows present
- [ ] Data properly quoted
- [ ] Dates readable
- [ ] Opens correctly in Excel
- [ ] No encoding issues

### 10. Print Functionality

**Print Preview:**
- [ ] Click Print button
- [ ] Browser print dialog opens
- [ ] Print preview shows

**Print Layout:**
- [ ] Export buttons hidden
- [ ] Timeline visible
- [ ] Cards visible
- [ ] Professional layout
- [ ] No overlapping content
- [ ] Proper page breaks

### 11. Navigation

**From Lifecycle Page:**
- [ ] Click back button - returns to previous page
- [ ] Click "Back to Inventory Detail" - opens inventory detail
- [ ] Click "View in Operations" - opens AssetView
- [ ] All links work correctly

**Browser Navigation:**
- [ ] Browser back button works
- [ ] Browser forward button works
- [ ] URL changes appropriately

### 12. Different Asset Types

**Test with Various Assets:**
- [ ] Laptop with full history
- [ ] New asset (minimal history)
- [ ] Asset with repairs
- [ ] Asset with replacements
- [ ] Asset with temporary assignments
- [ ] Retired asset
- [ ] Asset with warranty claims
- [ ] Unassigned asset

### 13. Edge Cases

**Empty States:**
- [ ] Asset with no history shows empty message
- [ ] Filter with no matches shows empty state
- [ ] Search with no results shows message

**Large History:**
- [ ] Asset with 50+ events loads properly
- [ ] Scrolling smooth
- [ ] Performance acceptable
- [ ] All events accessible

**Invalid Data:**
- [ ] Invalid asset ID shows error
- [ ] Missing data shows "—"
- [ ] No crashes or console errors

### 14. Responsive Design

**Desktop (>1024px):**
- [ ] Full layout visible
- [ ] Cards in grid
- [ ] Timeline centered

**Tablet (768px - 1024px):**
- [ ] Layout adapts
- [ ] Content readable
- [ ] Buttons accessible

**Mobile (<768px):**
- [ ] Single column layout
- [ ] Cards stack vertically
- [ ] Timeline adjusts
- [ ] Text readable
- [ ] Buttons tap-friendly

### 15. Performance

**Loading:**
- [ ] Page loads in < 2 seconds
- [ ] Spinner shows while loading
- [ ] No flash of unstyled content

**Interactions:**
- [ ] Filter changes instant
- [ ] Search updates smoothly
- [ ] No lag when scrolling
- [ ] Export generates quickly

**Memory:**
- [ ] No memory leaks
- [ ] Browser stays responsive
- [ ] Can navigate away and back

### 16. Verify No Regressions

**Existing Pages Still Work:**
- [ ] Inventory Detail page unchanged
- [ ] Inventory Category list works
- [ ] AssetView page works
- [ ] AssetEdit page works
- [ ] AssetList page works
- [ ] Original AssetTimeline still accessible at `/assets/timeline/:id`
- [ ] All assignment flows work
- [ ] Activity History works

**Data Integrity:**
- [ ] No duplicate events
- [ ] Event counts accurate
- [ ] Statistics match actual data
- [ ] No missing information

### 17. Browser Compatibility

**Chrome/Edge:**
- [ ] All features work
- [ ] Styling correct
- [ ] Export works

**Firefox:**
- [ ] All features work
- [ ] Styling correct
- [ ] Export works

**Safari:**
- [ ] All features work
- [ ] Styling correct
- [ ] Export works

**Mobile Browsers:**
- [ ] Page loads
- [ ] Touch works
- [ ] Layout responsive

### 18. Console Check

**Developer Console:**
- [ ] No JavaScript errors
- [ ] No API errors (404, 500)
- [ ] No warning messages
- [ ] API calls succeed
- [ ] Response times acceptable

---

## 🐛 Common Issues to Check

### If Timeline Doesn't Load:
- Check browser console for errors
- Verify asset ID is valid
- Check network tab for failed API calls
- Hard refresh (Ctrl+Shift+R)

### If Export Doesn't Work:
- Check browser allows downloads
- Check console for jsPDF errors
- Verify data is loaded
- Try different browser

### If Filters Don't Work:
- Check console for errors
- Verify events are loaded
- Try refreshing page

### If Search Doesn't Work:
- Check console for errors
- Try clearing search
- Verify events have searchable text

---

## ✅ Pass Criteria

**Phase 2 passes if:**

1. ✅ Lifecycle page loads and displays correctly
2. ✅ All 10 summary cards show accurate data
3. ✅ Timeline renders complete event history
4. ✅ Events display in correct chronological order
5. ✅ All event details visible and accurate
6. ✅ Filters work for all event types
7. ✅ Search finds events across all fields
8. ✅ Sort order toggle works (newest/oldest)
9. ✅ PDF export generates valid document
10. ✅ Excel/CSV export works properly
11. ✅ Print layout optimized
12. ✅ Navigation links all work
13. ✅ No regressions in existing pages
14. ✅ No console errors
15. ✅ Responsive on all screen sizes
16. ✅ Performance acceptable
17. ✅ Different asset types display correctly
18. ✅ Edge cases handled gracefully

---

## 📸 Screenshot Checklist

**Take screenshots of:**
1. [ ] Full lifecycle page (laptop with history)
2. [ ] Summary cards section
3. [ ] Timeline with multiple events
4. [ ] Filter dropdown open
5. [ ] Search in action
6. [ ] Generated PDF (opened)
7. [ ] CSV in Excel
8. [ ] Print preview
9. [ ] Mobile responsive view
10. [ ] Different event types

---

## 🔄 Retest After Issues

If any issues found:
1. Note the specific issue
2. Check console errors
3. Verify API responses
4. Re-test after fix
5. Confirm no new regressions

---

## 📞 Report Issues

**If you find issues, provide:**
1. URL/Route where issue occurs
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Browser and version
6. Console errors (if any)
7. Screenshots

---

## Summary

**Testing Status:** Ready for comprehensive testing

**Application:** http://192.168.20.180:3000

**Phase 2 Features:**
- Complete asset lifecycle timeline
- 10 summary statistic cards
- Event type filtering
- Real-time search
- Sort order control
- PDF export
- Excel/CSV export
- Print optimization
- Professional UI
- Responsive design

**Test Duration:** Approximately 30-45 minutes for complete testing

**Next Steps:**
1. Complete all checklist items
2. Report any issues found
3. Take screenshots
4. Await approval for Phase 3
