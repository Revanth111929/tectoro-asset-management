# New Features Added

## 1. ✅ Dark/Light/System Theme Mode
- **Theme Switcher** in top navbar
- **3 Modes**: Light, Dark, System (follows device preference)
- **Persistent**: Theme choice saved in localStorage
- **Icon**: Sun/Moon/Half-circle icons

**How to use:**
- Click the theme icon in top-right navbar
- Select Light, Dark, or System mode

---

## 2. ✅ Email Notifications for Asset Assignment
- **Automatic email** sent when asset is assigned to employee
- **Professional HTML template** with asset details
- **Configurable** via `.env` file

**Setup:**
1. Copy `.env.example` to `.env`
2. Add your email credentials:
   ```
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-app-password
   ```
3. For Gmail: Enable 2FA and create App Password

---

## 3-9. ✅ Extended Asset Inventory Fields

### New Database Columns Added:

#### Purchase & Inventory
- **Purchase Price** - Asset cost
- **Quantity** - Number of units
- **Configuration** - Detailed specifications

#### Laptop Accessories
- **Laptop Bag Serial** - Serial number of laptop bag

#### Storage Devices
- **Hard Disk Serial** - External HDD serial
- **Hard Disk Capacity** - Storage size (e.g., 1TB, 2TB)

#### Power Backup
- **UPS Serial** - UPS device serial number
- **UPS Capacity** - Power capacity (e.g., 1000VA)

#### Printer Details
- **Printer Type** - Inkjet/Laser/Dot Matrix
- **Printer Model** - Specific printer model

#### Mobile Device Testing
- **Mobile IMEI** - Device IMEI number
- **Mobile SIM Number** - Assigned SIM card number
- **Testing Status** - Passed/Failed/Pending (for QA)

---

## Database Migration

**Run this command to add new columns to existing database:**

```bash
source venv/bin/activate
python3 migrate_db.py
```

This will add all new fields without losing existing data.

---

## Updated Features Summary

1. ✅ **Theme Switcher** - Dark/Light/System modes
2. ✅ **Email Notifications** - Auto-send on asset assignment
3. ✅ **Purchase Inventory** - Price, quantity, configuration
4. ✅ **Mobile Testing** - IMEI, SIM, testing status tracking
5. ✅ **Laptop Bags** - Serial number tracking
6. ✅ **Hard Disks** - Serial & capacity tracking
7. ✅ **UPS Devices** - Serial & capacity tracking
8. ✅ **Printer Inventory** - Type & model columns
9. ✅ **Bulk Selection** - Select multiple assets for bulk actions

---

## Next Steps

1. **Restart Flask backend** to load new models
2. **Run migration script** to update database
3. **Configure email** (optional) in `.env` file
4. **Test theme switcher** in the UI

The React frontend will auto-reload with the theme switcher!
