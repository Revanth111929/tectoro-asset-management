# Category Name Change: Desktop → CPU

## Change Applied ✅

**Previous Name**: Desktop  
**New Name**: CPU

---

## Why This Change Makes Sense

"Desktop" is technically the full computer setup (monitor + CPU + keyboard + mouse), but in inventory management, we typically track the **CPU/tower unit separately** from the monitor.

**CPU** (Central Processing Unit / Computer Unit) is more accurate for tracking the actual tower/computer box.

---

## What Was Changed

### Files Modified:

1. ✅ **`frontend/src/config/categoryFields.js`**
   - Updated CATEGORIES array: `'Desktop'` → `'CPU'`
   - Updated CATEGORY_FIELDS object: `'Desktop': {...}` → `'CPU': {...}`

2. ✅ **`frontend/src/pages/AssetList.js`**
   - Updated CATEGORIES array

3. ✅ **`frontend/src/pages/AssetEdit.js`**
   - Updated CATEGORIES array

---

## Category List Now:

1. Laptop
2. **CPU** (changed from Desktop)
3. Monitor
4. Printer
5. Phone
6. Server
7. Furniture
8. Mouse
9. Headphones
10. Hard Disk
11. UPS
12. Laptop Bag
13. Other

---

## CPU Category Details

### Fields Shown:
**Basic Details:**
- Brand Name (e.g., Dell, HP, Lenovo)
- Model Name (e.g., OptiPlex 7090)
- Serial Number

**Specifications:**
- Processor (e.g., Intel Core i7-12th Gen)
- RAM (4GB, 8GB, 16GB, 32GB, etc.)
- Storage Type (SSD, HDD, Hybrid, NVMe)
- Storage Capacity (512GB, 1TB, etc.)
- Graphics Card (e.g., NVIDIA GTX 1650, Integrated)
- Operating System (Windows 11, Windows 10, Linux, etc.)
- OS Version (e.g., 22H2)

**Purchase & Warranty:**
- Purchase Vendor
- Purchase Price
- Purchase Date
- Warranty Start/End Dates

**Additional Info:**
- Remarks

---

## Key Difference: CPU vs Monitor

### CPU (Tower/Computer Unit)
- Has: Processor, RAM, Storage, Graphics Card
- No: Screen Size, Resolution, Refresh Rate
- Tracks: The actual computer processing unit

### Monitor (Display Screen)
- Has: Screen Size, Resolution, Refresh Rate
- No: Processor, RAM, Storage
- Tracks: The display screen separately

This separation allows better inventory tracking since:
- ✅ You can track CPU and Monitor independently
- ✅ CPU can be replaced without replacing Monitor
- ✅ Monitor can be replaced without replacing CPU
- ✅ More accurate asset management

---

## Example: Adding a CPU

**Category**: CPU

**Basic Details:**
- Brand Name: Dell
- Model Name: OptiPlex 7090 Micro
- Serial Number: CPU-DELL-001

**Specifications:**
- Processor: Intel Core i5-11th Gen
- RAM: 16GB
- Storage Type: SSD
- Storage Capacity: 512GB
- Graphics Card: Integrated Intel UHD Graphics
- Operating System: Windows 11 Pro
- OS Version: 22H2

**Purchase Details:**
- Purchase Vendor: Dell Direct
- Purchase Price: ₹45,000
- Purchase Date: 2024-06-15
- Warranty: 3 years

---

## Existing Assets with "Desktop"

### Important Note:
If you already have assets in the database with category "Desktop", they will still work. However:

**Recommended Action:**
1. Go to Assets list
2. Filter by category "Desktop" (if any exist)
3. Edit each one
4. Change category to "CPU"
5. Save

This ensures consistency in your inventory.

---

## Testing the Change

### Test Steps:
1. Open: http://192.168.20.180:3000/assets
2. Click: "Add Asset" → "New Device"
3. Click: Category dropdown
4. Verify: Shows "CPU" instead of "Desktop"
5. Select: "CPU"
6. Verify: Shows processor, RAM, storage, graphics card fields
7. Fill and save
8. Verify: Asset saved with category "CPU"

---

## Frontend Needs Refresh

Since this is a frontend JavaScript change, users need to **refresh their browser** to see the update:

**How to refresh:**
- Press **Ctrl + Shift + R** (hard refresh to clear cache)
- Or **Ctrl + F5**
- Or clear browser cache and reload

---

## Files Updated Summary

| File | Change Made |
|------|-------------|
| `categoryFields.js` | CATEGORIES array: Desktop → CPU |
| `categoryFields.js` | CATEGORY_FIELDS config: Desktop → CPU |
| `AssetList.js` | CATEGORIES array: Desktop → CPU |
| `AssetEdit.js` | CATEGORIES array: Desktop → CPU |

---

## Status

✅ **Change Complete**  
✅ **Ready to Test**  
⚠️ **Users Need Browser Refresh** (Ctrl+Shift+R)

---

## Migration Note

**Database Impact**: None - category is just a text field  
**Existing Assets**: Still work, can be updated via Edit  
**New Assets**: Will use "CPU" instead of "Desktop"

---

## Benefits

✅ **More Accurate**: CPU specifically refers to the computer unit  
✅ **Clearer Distinction**: Separate from Monitor tracking  
✅ **Industry Standard**: Common terminology in IT asset management  
✅ **Better Inventory**: Track CPU and Monitor as separate items

---

**Change Date**: June 16, 2026  
**Status**: ✅ Complete  
**Next Step**: Refresh browser and test!
