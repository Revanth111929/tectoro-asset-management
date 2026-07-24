# 🕐 How to View Asset History Timeline

## Simple Steps:

### Step 1: Open Your Browser
Open **Chrome** or **Firefox** and go to:
```
http://192.168.20.180:3000
```

---

### Step 2: **IMPORTANT - Refresh the Page**
The new code was just built, so you MUST refresh:
- Press **Ctrl + Shift + R** (hard refresh)
- Or press **Ctrl + F5**
- Or press **F5** multiple times

This loads the new code with the timeline feature.

---

### Step 3: Login
- Username: `admin`
- Password: `admin123`
- Click **Login**

---

### Step 4: Go to Assets Page
- Click **"Assets"** in the left sidebar
- Or click **"Tectoro Asset Management"** in the top menu

You'll see a table with all your assets.

---

### Step 5: Find the Clock Icon
In the **Actions** column (last column), you'll see buttons:
- 👁️ Eye icon (View)
- **🕐 Clock icon (Timeline)** ← **THIS ONE!**
- ✏️ Pencil icon (Edit)
- 🗑️ Trash icon (Delete)

---

### Step 6: Click the Clock Icon 🕐
Click the **blue clock icon** button next to any asset.

A new page will open showing the complete timeline!

---

## 🎯 What You'll See

A beautiful timeline showing:
- 📦 When asset was added
- 👤 Who it was assigned to
- 🔄 When it was returned
- 🔧 When it was repaired
- ⏰ Temporary assignments
- All dates and times
- Employee names
- Reasons for changes

---

## 🔍 If You Don't See the Clock Icon

### Option A: Clear Browser Cache
1. Press **Ctrl + Shift + Delete**
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh the page (**F5**)

### Option B: Use Direct URL
1. Pick any asset ID (like 54)
2. Go directly to:
```
http://192.168.20.180:3000/assets/timeline/54
```
3. Replace `54` with any asset ID

### Option C: Check Asset ID
To find valid asset IDs:
1. Go to Assets page
2. Look at the first column (Sl No)
3. Use any number you see there

---

## 📸 Visual Guide

```
Assets Page
┌─────────────────────────────────────────────────────┐
│ Tectoro Asset Management          [+ Add Asset]     │
├─────┬─────────┬──────────┬────────┬──────┬─────────┤
│ ID  │ Asset   │ Serial   │ Status │ ...  │ Actions │
├─────┼─────────┼──────────┼────────┼──────┼─────────┤
│ 54  │ Dell    │ SN-123   │ Assign │ ...  │ 👁️ 🕐 ✏️ 🗑️│ ← Click this clock!
│ 53  │ HP      │ SN-456   │ Avail  │ ...  │ 👁️ 🕐 ✏️ 🗑️│
│ 52  │ Apple   │ SN-789   │ Maint  │ ...  │ 👁️ 🕐 ✏️ 🗑️│
└─────┴─────────┴──────────┴────────┴──────┴─────────┘
                                               ↑
                                        Click this!
```

---

## 🚀 Quick Test

**Fastest way to test:**

1. **Open browser**
2. **Copy this URL:**
```
http://192.168.20.180:3000/assets/timeline/54
```
3. **Paste and press Enter**
4. **Login if needed**
5. **See the timeline immediately!**

---

## ✅ What Timeline Shows

Example for Asset ID 54:
```
┌─────────────────────────────────────────┐
│ 🕐 Asset History Timeline               │
│                                         │
│ Integration Test Laptop                 │
│ SN: INTEG-TEST-001a                    │
│ Status: Under Repair                    │
│                                         │
│ Stats: 7 Events | 3 Lifecycle | 1 Temp │
│                                         │
│ ⏰ 17-Jun-2026, 7:39 AM                │
│    Sent for Repair (Temp Device)       │
│    👤 Rajini Goku                      │
│    💬 Screen damage                    │
│                                         │
│ 👤 17-Jun-2026, 6:01 AM                │
│    Assigned to Employee                 │
│    👤 Rajini Goku                      │
│                                         │
│ 📦 16-Jun-2026, 9:35 AM                │
│    Added to Inventory                   │
└─────────────────────────────────────────┘
```

---

## 🆘 Still Having Issues?

### Check if server is running:
Open terminal and run:
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{"status": "ok", "message": "IT Asset Management API running"}
```

### Check if API works:
```bash
curl http://localhost:3000/api/assets/54/history
```

Should return JSON with history data.

---

## 📱 Alternative: View in Activity History

If you still can't see it:

1. Go to **"Activity History"** page (left sidebar)
2. This shows ALL events for ALL assets
3. Use search to find specific asset
4. Filter by action type

---

**That's it! Just refresh your browser and you'll see it!** 🎉
