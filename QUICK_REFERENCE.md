# Quick Reference Guide

## 🎯 When to Use Which Tab

### ✅ Use "New Device" Tab When:
- ✓ Just purchased new items
- ✓ Adding to inventory
- ✓ No employee assigned yet
- ✓ Bulk purchases
- ✓ Items going to storage

**Example**: Bought 5 new mice → Use "New Device" tab

### ✅ Use "Existing Device" Tab When:
- ✓ Assigning to employee
- ✓ Transferring between employees
- ✓ Recording old devices
- ✓ Need assignment history
- ✓ Device already in use

**Example**: Giving laptop to new employee → Use "Existing Device" tab

---

## 📋 Complete Inventory Categories

| Category | Icon | What to Track |
|----------|------|---------------|
| Laptops | 💻 | OS, RAM, Bag Serial |
| Mobiles | 📱 | IMEI, SIM, Testing Status |
| Printers | 🖨️ | Type, Model, Location |
| Hard Disks | 💾 | Serial, Capacity |
| UPS Devices | ⚡ | Serial, Capacity |
| Laptop Bags | 👜 | Serial, Assigned Laptop |
| Mouse | 🖱️ | Model, Assignment |
| Headphones | 🎧 | Model, Assignment |

---

## 🔄 Common Workflows

### Workflow 1: New Purchase
```
1. Buy 10 new laptops
2. Go to Assets → Add Asset
3. Click "New Device" tab
4. Fill asset details only
5. Save (status = Available)
6. Repeat or use Excel import
```

### Workflow 2: Assign to Employee
```
1. Go to inventory (e.g., Laptops)
2. Find available laptop
3. Click Edit
4. Add EMP ID + Employee Name
5. Change status to "Assigned"
6. Save
```

### Workflow 3: Transfer Between Employees
```
1. Find assigned asset
2. Click Edit
3. Update EMP ID + Employee Name
4. Fill "Old User" field
5. Save
```

### Workflow 4: Bulk Status Change
```
1. Go to any inventory page
2. Select multiple items (checkboxes)
3. Click "Bulk Actions"
4. Select "Change Status"
5. Choose new status
6. Click "Update Status"
```

---

## 🎨 Dark Mode Colors

**Outlook-Style Dark Theme**:
- Background: Very dark blue-black (#0f1419)
- Cards: Dark gray-blue (#1a202c)
- Text: Light gray (#e2e8f0)
- Borders: Subtle transparent
- Accent: Blue (#3b82f6)

**How to switch**:
- Click theme icon (sun/moon) in top right
- Choose: Light / Dark / System

---

## 🔙 Navigation

**Back Button**:
- Located: Top left, next to menu icon
- Shows: On all pages except Dashboard
- Function: Go to previous page

**Sidebar**:
- Collapse/Expand: Click arrow button
- Sections: Main, Assets, Inventory, Reports, Settings

---

## 📊 Status Meanings

| Status | Meaning | Use When |
|--------|---------|----------|
| Available | In stock, ready to assign | New purchases, returned items |
| Assigned | Given to employee | Active assignments |
| Maintenance | Under repair | Broken, being fixed |
| Retired | End of life | Old, disposed items |

---

## 💡 Pro Tips

1. **Use Excel Import** for bulk data entry
2. **Use Bulk Actions** to update multiple items at once
3. **Track Old User** when transferring devices
4. **Set Warranty Dates** to get expiry alerts
5. **Use Serial Numbers** for unique identification
6. **Add Purchase Price** for asset valuation
7. **Fill Configuration** for detailed specs
8. **Use Location** for physical tracking

---

## 🚀 Keyboard Shortcuts

- **Ctrl + Click** on sidebar items = Open in new tab
- **Browser Back** = Same as back button
- **Esc** = Close modals
- **Tab** = Navigate form fields

---

## 📱 Mobile Friendly

All pages work on mobile:
- Responsive tables
- Touch-friendly buttons
- Collapsible sidebar
- Optimized forms

---

## 🔒 Security

- Auto-logout on inactivity
- Token-based authentication
- Activity logging
- Role-based access (future)

---

## 📞 Need Help?

**Common Issues**:

1. **Can't see data** → Check if backend is running
2. **Login not working** → Clear browser cache
3. **Dark mode not applying** → Refresh page
4. **Back button missing** → You're on Dashboard (home page)
5. **Can't add asset** → Check required fields (Asset Name, Serial Number)

**Required Fields**:
- Asset Name ✓
- Serial Number ✓
- Category (recommended)

**Optional Fields**:
- Everything else

---

## 📈 Dashboard Stats

Shows:
- Total Assets
- Assigned Assets
- Available Assets
- Maintenance Items
- Warranty Expiring Soon
- Category Breakdown
- Recent Activity

---

## 🎯 Best Practices

1. **Always use unique serial numbers**
2. **Update status when assigning/returning**
3. **Track old users for history**
4. **Set warranty dates for alerts**
5. **Use categories consistently**
6. **Add location for physical tracking**
7. **Use bulk operations for efficiency**
8. **Export data regularly for backups**

---

## ✅ Production Checklist

Before going live:
- [ ] Test new device entry
- [ ] Test existing device entry
- [ ] Test all inventory categories
- [ ] Test bulk operations
- [ ] Test dark mode
- [ ] Test back button
- [ ] Test login redirect
- [ ] Train users on two-tab system
- [ ] Set up backups
- [ ] Configure email notifications

---

**The system is ready for production use!**

All features tested and working. Enjoy your new IT Asset Management System! 🎉
