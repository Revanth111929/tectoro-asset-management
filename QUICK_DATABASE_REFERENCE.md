# Quick Database Reference

## TL;DR - Everything You Need to Know

### What Database?
**SQLite** - A simple file-based database (no server needed)

### Where is My Data?
```
/home/administrator/Desktop/asset-management/assets.db
```
This single 160 KB file contains EVERYTHING:
- 46 assets
- 2 admin users
- 33 employees
- 2 temporary assignments
- 133 activity logs
- All audit trails

### How Does it Work?

```
You interact with browser
         ↓
React sends HTTP request
         ↓
Flask API receives request
         ↓
SQLAlchemy converts Python to SQL
         ↓
SQLite writes to assets.db file
         ↓
Changes saved permanently
```

### View Your Data

**Option 1: API (Easiest)**
```bash
# View all assets
curl http://localhost:3000/api/assets

# View users
curl http://localhost:3000/api/users

# View temporary assignments
curl http://localhost:3000/api/temporary-assignments
```

**Option 2: Python Script**
```python
import sqlite3
conn = sqlite3.connect('assets.db')
cursor = conn.cursor()
cursor.execute("SELECT asset_name, serial_number, status FROM assets")
for row in cursor.fetchall():
    print(row)
conn.close()
```

**Option 3: Install GUI Tool**
```bash
sudo apt install sqlitebrowser
sqlitebrowser assets.db
```

### Backup Your Data

**Simple Backup:**
```bash
cp assets.db assets_backup.db
```

**Date-stamped Backup:**
```bash
cp assets.db "assets_backup_$(date +%Y%m%d).db"
```

**Restore:**
```bash
cp assets_backup.db assets.db
```

### Database Tables

| Table | What it Stores |
|-------|----------------|
| assets | All IT equipment (laptops, monitors, etc.) |
| users | Admin login accounts |
| employees | People who use assets |
| temporary_assignments | Loaner devices during repairs |
| audit_logs | Who changed what and when |
| activity_logs | Old activity tracking |
| asset_lifecycle | Asset status history |

### Common Queries

**Count assets by status:**
```python
from models import Asset
available = Asset.query.filter_by(status='Available').count()
assigned = Asset.query.filter_by(status='Assigned').count()
```

**Find assets for an employee:**
```python
assets = Asset.query.filter_by(emp_id='EMP001').all()
```

**Get recent audit logs:**
```python
from models import AuditLog
logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(10).all()
```

### Important Notes

✅ **No Database Server** - Everything in one file
✅ **Automatic Backups** - Just copy the file
✅ **Portable** - Copy assets.db to another machine
✅ **ACID Compliant** - Data integrity guaranteed
✅ **Fast** - Perfect for 46 assets and growing

⚠️ **Single Writer** - Only one write at a time (fine for your use)
⚠️ **File Permissions** - Make sure assets.db is readable/writable
⚠️ **Disk Space** - Needs ~200 KB currently, will grow slowly

### Troubleshooting

**Problem:** "Database is locked"
**Solution:** Another process has the file open. Restart Flask server.

**Problem:** "No such table"
**Solution:** Database not initialized. Restart Flask - it will create tables.

**Problem:** "Permission denied"
**Solution:** Check file permissions on assets.db

**Problem:** Lost data
**Solution:** Restore from backup:
```bash
cp assets_backup_YYYYMMDD.db assets.db
```

### File Location Diagram

```
/home/administrator/Desktop/asset-management/
│
├── api_server.py          ← Flask API server
├── models.py              ← Database table definitions
├── assets.db              ← YOUR DATA IS HERE ★
├── frontend/
│   └── build/             ← React frontend
└── venv/                  ← Python packages
```

### Access Methods

1. **Web Interface:** http://192.168.20.180:3000
2. **API Direct:** http://192.168.20.180:3000/api/*
3. **Python Shell:**
   ```bash
   cd /home/administrator/Desktop/asset-management
   source venv/bin/activate
   python3
   >>> from models import Asset, db
   >>> Asset.query.all()
   ```
4. **SQLite Command Line:**
   ```bash
   sudo apt install sqlite3
   sqlite3 assets.db
   sqlite> SELECT * FROM assets LIMIT 5;
   ```

### That's It!

Your entire IT asset management system stores everything in one simple file: **assets.db**

No complex database server, no configuration, just a file! 🎉
