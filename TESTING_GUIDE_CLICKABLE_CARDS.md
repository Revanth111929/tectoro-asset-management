# Testing Guide - Clickable Dashboard Cards

## Quick Test Instructions

### Test 1: Total Laptops Card
1. Open http://192.168.20.180:3000
2. Login with admin/admin123
3. Hover over "Total Laptops" card (should lift up with shadow)
4. Click "Total Laptops" card
5. **Expected:** Navigate to `/inventory/laptop`
6. **Verify:** Page shows "Laptop Inventory" title with laptop icon
7. **Verify:** All laptops are displayed (70 laptops)

### Test 2: Available Card
1. From Dashboard, click "Available" card
2. **Expected:** Navigate to `/assets?status=Available`
3. **Verify:** Status dropdown shows "Available" selected
4. **Verify:** Only assets with status "Available" are shown (0 assets)
5. **Verify:** URL contains `?status=Available`

### Test 3: Assigned Card
1. From Dashboard, click "Assigned" card
2. **Expected:** Navigate to `/assets?status=Assigned`
3. **Verify:** Status dropdown shows "Assigned" selected
4. **Verify:** Only assets with status "Assigned" are shown (78 assets)
5. **Verify:** URL contains `?status=Assigned`

### Test 4: Maintenance Card
1. From Dashboard, click "Maintenance" card
2. **Expected:** Navigate to `/assets?status=Maintenance`
3. **Verify:** Status dropdown shows "Maintenance" selected
4. **Verify:** Only assets with status "Maintenance" are shown (0 assets)
5. **Verify:** URL contains `?status=Maintenance`

### Test 5: Warranty Expiring Card
1. From Dashboard, click "Warranty Expiring (90d)" card
2. **Expected:** Navigate to `/warranty?filter=expiring90`
3. **Verify:** Days dropdown shows "90 days" selected
4. **Verify:** Shows assets with warranty expiring within 90 days (0 assets)
5. **Verify:** URL contains `?filter=expiring90`

### Test 6: Browser Back Button
1. Click any dashboard card
2. Press browser back button
3. **Expected:** Return to Dashboard
4. **Verify:** Dashboard loads correctly
5. **Verify:** Statistics are still showing

### Test 7: Browser Forward Button
1. Click any dashboard card
2. Press browser back button
3. Press browser forward button
4. **Expected:** Return to filtered view
5. **Verify:** Filter is still applied

### Test 8: Page Refresh
1. Click "Assigned" card
2. Press F5 or Ctrl+R to refresh
3. **Expected:** Page reloads with filter still applied
4. **Verify:** Status dropdown still shows "Assigned"
5. **Verify:** Only assigned assets are shown

### Test 9: Manual Filter Change
1. Click "Available" card
2. Change status dropdown to "Assigned"
3. **Expected:** Assets update to show assigned assets
4. **Verify:** Filter changes work correctly

### Test 10: Hover Effects
1. Go to Dashboard
2. Hover over each stat card
3. **Expected:** Card lifts up (4px)
4. **Expected:** Shadow appears/intensifies
5. **Expected:** Cursor changes to pointer
6. Move mouse away
7. **Expected:** Card returns to normal position

---

## Expected Results Summary

| Test | Expected Result | Status |
|------|----------------|--------|
| Total Laptops Click | Navigate to `/inventory/laptop` | ✅ |
| Available Click | Navigate to `/assets?status=Available` | ✅ |
| Assigned Click | Navigate to `/assets?status=Assigned` | ✅ |
| Maintenance Click | Navigate to `/assets?status=Maintenance` | ✅ |
| Warranty Click | Navigate to `/warranty?filter=expiring90` | ✅ |
| Browser Back | Return to Dashboard | ✅ |
| Browser Forward | Return to filtered view | ✅ |
| Page Refresh | Filter persists | ✅ |
| Manual Filter Change | Filter updates | ✅ |
| Hover Effects | Card lifts with shadow | ✅ |

---

## Troubleshooting

### If cards are not clickable:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Check browser console for errors (F12)

### If filters are not applied:
1. Check URL contains query parameters
2. Verify dropdown shows correct selection
3. Check browser console for errors

### If hover effects don't work:
1. Try different browser
2. Check if JavaScript is enabled
3. Clear browser cache

---

## Quick Access

**Application URL:** http://192.168.20.180:3000  
**Login:** admin / admin123

**All tests should pass successfully!**
