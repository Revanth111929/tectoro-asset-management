# Corporate SIM Management - User Guide

## 🎉 Feature is Now Live!

The Corporate SIM inventory management feature is fully implemented and available in your application.

## 📍 How to Access

1. **Login** to your application at: http://192.168.20.180:3000
2. **Navigate** to the sidebar menu
3. **Click** on "**Inventory**" to expand
4. **Click** on "**Corporate SIMs**" (first item with 📱 icon)

## 🚀 Quick Start

### View SIM Cards
- You'll see a table with all your SIM cards
- 6 sample SIMs are already loaded for testing
- Each row shows: ICCID, Mobile Number, Carrier, Status, Assigned To

### Search & Filter
- **Search box**: Type ICCID or mobile number
- **Carrier filter**: Select Airtel, Jio, Vi, BSNL, or Other
- **Status filter**: Select Available, Assigned, Suspended, etc.
- **Clear button**: Reset all filters

### Add New SIM
1. Click "**Add New SIM**" button (top right)
2. Fill in the form:
   - **ICCID** (required): 19-20 digit SIM card number
   - **Mobile Number** (optional): 10 digit phone number
   - **Carrier**: Select operator (Airtel, Jio, Vi, BSNL, Other)
   - **Plan Type**: Prepaid or Postpaid
   - **Monthly Cost**: Enter cost in ₹
   - **Data Limit**: Enter GB limit
   - **Corporate Account**: Account name/number
   - Other fields: Purchase date, activation date, vendor, etc.
3. Click "**Save SIM**"

### Assign SIM to Employee
1. Find the SIM in the list (must be Available status)
2. Click the "👤+" (Assign) button
3. In the modal:
   - **Search for employee** by name or ID
   - **Select employee** from dropdown
   - Add optional **remarks**
4. Click "**Assign SIM**"

### Return SIM from Employee
1. Find the assigned SIM in the list
2. Click the "↩" (Return) button
3. In the modal:
   - Select **new status** (Available, Damaged, Lost, or Terminated)
   - Add optional **remarks** about condition
4. Click "**Return SIM**"

### View SIM Details
1. Click the "👁" (View) button on any SIM
2. See complete information:
   - SIM identification (ICCID, mobile number)
   - Carrier information (plan, cost, data limit)
   - Assignment details (if assigned)
   - Purchase details (vendor, dates)
   - Audit information (created by, updated by)

### Edit SIM
1. Click the "✏" (Edit) button on any SIM
2. Modify fields as needed
3. Click "**Save Changes**"
   - Note: ICCID cannot be edited (read-only)
   - Mobile number must still be unique

### Delete SIM
1. Click the "🗑" (Delete) button
2. Confirm deletion
   - Note: Cannot delete assigned SIMs (return them first)

## 📊 Sample Data

6 SIM cards are pre-loaded:

1. **Airtel Postpaid** (₹599/mo) - Assigned to Revanth Maddela
2. **Jio Postpaid** (₹499/mo) - Available
3. **Vi Postpaid** (₹549/mo) - Assigned to Rajini
4. **Airtel Prepaid** (₹299/mo) - Available
5. **BSNL Postpaid** (₹399/mo) - Suspended
6. **Jio eSIM** (₹699/mo) - Available

## 🔐 Permissions

- **Viewer**: Can only view SIM cards
- **Editor/Admin**: Can create, edit, assign, return SIMs
- **Admin Only**: Can delete SIM cards

## ✅ Features Available

### List View
- ✅ Pagination (20 SIMs per page)
- ✅ Search by ICCID or mobile number
- ✅ Filter by carrier
- ✅ Filter by status
- ✅ Status badges with colors
- ✅ Assigned employee information
- ✅ Quick action buttons

### Add/Edit Form
- ✅ ICCID validation (19-20 digits, unique)
- ✅ Mobile number validation (10 digits, unique)
- ✅ Carrier selection (Indian operators)
- ✅ Plan type (Prepaid/Postpaid)
- ✅ SIM type (Nano/Micro/Mini/eSIM)
- ✅ Cost and data limit fields
- ✅ Corporate account tracking
- ✅ Purchase and activation dates
- ✅ PUK code storage
- ✅ Remarks/notes field

### Assignment
- ✅ Employee search with auto-complete
- ✅ Real-time employee lookup
- ✅ Assignment date tracking
- ✅ Status auto-update to "Assigned"
- ✅ Assignment remarks

### Return
- ✅ Return with status change
- ✅ Options: Available, Damaged, Lost, Terminated
- ✅ Return date tracking
- ✅ Return remarks
- ✅ Employee info preserved in history

### View Details
- ✅ Complete SIM information
- ✅ Carrier and plan details
- ✅ Assignment history (if applicable)
- ✅ Purchase and activation dates
- ✅ PUK code display
- ✅ Audit trail (created/updated by)

## 🎨 Status Badges

| Status | Color | Meaning |
|--------|-------|---------|
| Available | 🟢 Green | Ready to assign |
| Assigned | 🔵 Blue | Currently with employee |
| Active | 🔵 Light Blue | Active service |
| Suspended | 🟡 Yellow | Service suspended |
| Returned | ⚪ Gray | Returned from employee |
| Lost | 🔴 Red | SIM card lost |
| Damaged | 🔴 Red | SIM card damaged |
| Terminated | ⚫ Dark | Service terminated |

## 💡 Tips

1. **ICCID Format**: Always 19-20 digits, printed on SIM card
2. **Mobile Number**: Optional but useful for tracking
3. **PUK Code**: Keep secure, needed to unlock SIM
4. **Search**: Works on ICCID, mobile number, employee name
5. **Filters**: Combine search with filters for better results
6. **Assignment**: Can only assign "Available" or "Returned" SIMs
7. **Deletion**: Must return assigned SIMs before deleting

## 🔧 Validation Rules

### ICCID
- ✅ Required field
- ✅ Must be exactly 19 or 20 digits
- ✅ Must be unique (no duplicates)
- ❌ Cannot contain letters or symbols

### Mobile Number
- ⚪ Optional field
- ✅ If provided, must be exactly 10 digits
- ✅ Must be unique if not empty
- ❌ Cannot contain letters or symbols

### PUK Code
- ⚪ Optional field
- ✅ If provided, must be exactly 8 digits

### Status Transitions
- Available → Assigned (via Assign)
- Assigned → Available/Damaged/Lost/Terminated (via Return)
- Any → Suspended (via Edit)

## 📱 Example Workflow

### Scenario: New Employee Onboarding

1. **Check Available SIMs**
   - Go to Corporate SIMs
   - Filter: Status = "Available"
   - Review available options

2. **Assign SIM to New Employee**
   - Click Assign button on chosen SIM
   - Search for employee "John Doe"
   - Add remark: "Primary SIM for new employee"
   - Click Assign

3. **View Assignment**
   - SIM status changes to "Assigned"
   - Employee name appears in "Assigned To" column
   - Assignment date recorded

### Scenario: Employee Exit

1. **Find Employee's SIM**
   - Search by employee name
   - Or filter by status "Assigned"

2. **Return SIM**
   - Click Return button
   - Select condition:
     * "Available" if in good condition
     * "Damaged" if broken/damaged
     * "Lost" if not returned
   - Add remarks: "Employee exit - SIM returned in good condition"
   - Click Return SIM

3. **Verify Return**
   - SIM status updated
   - Return date recorded
   - Available for reassignment (if status = Available)

## 🐛 Troubleshooting

### SIM Not Appearing in List
- **Check filters**: Clear all filters and search
- **Check status**: Might be filtered out
- **Hard refresh**: Press Ctrl+Shift+R

### Cannot Assign SIM
- **Check status**: Must be "Available" or "Returned"
- **Check employee**: Must exist in employee list
- **Check permissions**: Viewers cannot assign

### Duplicate ICCID Error
- **Check existing SIMs**: ICCID must be unique
- **Verify input**: Ensure correct ICCID number

### Cannot Delete SIM
- **Check status**: Cannot delete assigned SIMs
- **Return first**: Use Return feature, then delete
- **Check permissions**: Only admins can delete

## 📞 Support

If you encounter any issues:
1. Check this user guide
2. Try hard refresh (Ctrl+Shift+R)
3. Check browser console for errors (F12)
4. Contact your administrator

## 🎓 Training Resources

- **Sample Data**: 6 SIMs pre-loaded for practice
- **Test Assignment**: Try assigning/returning SIMs
- **Practice Filters**: Test different search combinations
- **View Details**: Click View on each SIM to explore

---

**Happy SIM Management!** 📱✨

For technical documentation, see `CORPORATE_SIM_STATUS.md`
