# Database Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    IT ASSET MANAGEMENT SYSTEM                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│   Browser    │        │   Browser    │        │   Browser    │
│  (Admin PC)  │        │  (User PC)   │        │  (Manager)   │
└──────┬───────┘        └──────┬───────┘        └──────┬───────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               │
                    HTTP Requests (Port 3000)
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│                      FLASK API SERVER                           │
│                     (api_server.py)                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Routes: /api/assets, /api/users, /api/audit-logs, etc  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↕                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              SQLAlchemy ORM Layer                        │  │
│  │   (Python Objects ↔ Database Tables)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬───────────────────────────────────┘
                             │
                    SQL Queries (Automatic)
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                     SQLITE DATABASE                             │
│                      (assets.db)                                │
│                  /home/administrator/Desktop/                   │
│               asset-management/assets.db                        │
│                                                                 │
│  File Size: 160 KB                                             │
│  Format: Binary (SQLite 3.x)                                   │
└────────────────────────────────────────────────────────────────┘
```

---

## Database Tables Relationship

```
┌──────────────┐         ┌──────────────┐
│    users     │         │  employees   │
│──────────────│         │──────────────│
│ id (PK)      │         │ emp_id (PK)  │
│ username     │         │ employee_name│
│ email        │         │ email        │
│ password_hash│         │ mobile_number│
│ role         │         │ location     │
│ smtp_password│         │ department   │
└──────────────┘         └──────┬───────┘
                                │
                         Assigned To
                                │
                                ▼
                    ┌───────────────────────┐
                    │       assets          │◄─────┐
                    │───────────────────────│      │
                    │ id (PK)               │      │
                    │ asset_name            │      │
                    │ serial_number (UNIQUE)│      │
                    │ category              │      │
                    │ status                │      │
                    │ emp_id (FK)           │──────┘
                    │ employee_name         │
                    │ model_name            │
                    │ location              │
                    │ warranty_date         │
                    │ ... 50+ fields        │
                    └───────┬───────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────┐  ┌──────────────────┐
│  audit_logs     │  │asset_lifecycle│ │temporary_        │
│─────────────────│  │─────────────│  │assignments       │
│ id (PK)         │  │ id (PK)     │  │──────────────────│
│ asset_id (FK)   │  │ asset_id(FK)│  │ id (PK)          │
│ action_type     │  │ event_type  │  │ employee_id      │
│ field_name      │  │ from_status │  │ original_asset_id│
│ old_value       │  │ to_status   │  │ temp_asset_id    │
│ new_value       │  │ reason      │  │ status           │
│ performed_by    │  │ performed_by│  │ start_date       │
│ timestamp       │  │ created_at  │  │ expected_return  │
└─────────────────┘  └─────────────┘  └──────────────────┘
```

---

## Data Flow: Creating an Asset

```
Step 1: User Action
┌─────────────────┐
│ Admin fills     │
│ "Add Asset"     │
│ form in browser │
└────────┬────────┘
         │
         ▼
Step 2: Frontend Processing
┌─────────────────────────────┐
│ React validates form        │
│ Axios prepares JSON:        │
│ {                          │
│   "asset_name": "Dell XPS", │
│   "serial_number": "SN123", │
│   "status": "Available"     │
│ }                          │
└────────┬────────────────────┘
         │
         ▼ POST /api/assets
Step 3: API Receives Request
┌──────────────────────────────────┐
│ Flask route: @app.route(         │
│   '/api/assets', methods=['POST']│
│ )                                │
│ def create_asset():              │
│   data = request.get_json()      │
└────────┬─────────────────────────┘
         │
         ▼
Step 4: Create Python Object
┌──────────────────────────────────┐
│ SQLAlchemy ORM:                  │
│                                  │
│ asset = Asset(                   │
│   asset_name = data['asset_name'],│
│   serial_number = data['serial'],│
│   status = data['status']        │
│ )                                │
│ db.session.add(asset)            │
└────────┬─────────────────────────┘
         │
         ▼
Step 5: Write to Database
┌──────────────────────────────────┐
│ SQLAlchemy generates SQL:        │
│                                  │
│ INSERT INTO assets (             │
│   asset_name,                    │
│   serial_number,                 │
│   status,                        │
│   created_at                     │
│ ) VALUES (                       │
│   'Dell XPS',                    │
│   'SN123',                       │
│   'Available',                   │
│   '2026-06-19 10:00:00'          │
│ )                                │
└────────┬─────────────────────────┘
         │
         ▼
Step 6: Create Audit Log
┌──────────────────────────────────┐
│ AuditService.log_asset_created(  │
│   asset, 'admin'                 │
│ )                                │
│                                  │
│ INSERT INTO audit_logs (         │
│   action_type='ASSET_CREATED',   │
│   asset_id=1,                    │
│   asset_name='Dell XPS',         │
│   performed_by='admin'           │
│ )                                │
└────────┬─────────────────────────┘
         │
         ▼
Step 7: Create Lifecycle Event
┌──────────────────────────────────┐
│ LifecycleService.record_event(   │
│   asset_id=1,                    │
│   event_type='PROCURED'          │
│ )                                │
│                                  │
│ INSERT INTO asset_lifecycle (    │
│   asset_id=1,                    │
│   event_type='PROCURED',         │
│   to_status='Available'          │
│ )                                │
└────────┬─────────────────────────┘
         │
         ▼
Step 8: Commit Transaction
┌──────────────────────────────────┐
│ db.session.commit()              │
│                                  │
│ All 3 INSERTs are written to     │
│ assets.db atomically             │
│ (All succeed or all fail)        │
└────────┬─────────────────────────┘
         │
         ▼
Step 9: Return Response
┌──────────────────────────────────┐
│ return jsonify({                 │
│   'success': True,               │
│   'asset': asset.to_dict()       │
│ }), 201                          │
└────────┬─────────────────────────┘
         │
         ▼ JSON Response
Step 10: Frontend Updates
┌──────────────────────────────────┐
│ React receives success           │
│ Shows "Asset created!"           │
│ Refreshes asset list             │
│ User sees new asset in table     │
└──────────────────────────────────┘
```

---

## SQLite Database File Structure

```
assets.db (Binary File - 160 KB)
│
├── Header (100 bytes)
│   ├── Magic number: "SQLite format 3"
│   ├── Page size: 4096 bytes
│   ├── File format version
│   └── Database text encoding: UTF-8
│
├── Page 1 (Master Table)
│   └── Schema definitions for all tables
│
├── Pages 2-N (Table Data)
│   │
│   ├── assets table
│   │   ├── Row 1: Dell Laptop XPS 15
│   │   ├── Row 2: HP EliteBook 840
│   │   ├── Row 3: Apple MacBook Pro
│   │   └── ... (46 rows total)
│   │
│   ├── users table
│   │   ├── Row 1: admin
│   │   └── Row 2: Revanth
│   │
│   ├── employees table (33 rows)
│   ├── temporary_assignments table (2 rows)
│   ├── audit_logs table (9 rows)
│   └── activity_logs table (133 rows)
│
└── Indexes
    ├── assets_serial_number_idx (for fast lookups)
    ├── audit_logs_timestamp_idx
    ├── audit_logs_asset_id_idx
    └── users_username_idx
```

---

## Data Storage Examples

### How a Row is Stored:

**Python Object:**
```python
asset = Asset(
    id=1,
    asset_name="Dell XPS 15",
    serial_number="SN-DELL-001",
    status="Available",
    created_at=datetime(2026, 6, 19, 10, 0, 0)
)
```

**SQLite Internal Storage (Simplified):**
```
Page: 5, Row: 3
[1|"Dell XPS 15"|"SN-DELL-001"|"Available"|1718791200000|...]
 ↑       ↑              ↑            ↑            ↑
 id   asset_name   serial_number   status   created_at
                                            (Unix timestamp)
```

**API Response:**
```json
{
  "id": 1,
  "asset_name": "Dell XPS 15",
  "serial_number": "SN-DELL-001",
  "status": "Available",
  "created_at": "2026-06-19T10:00:00"
}
```

---

## Transaction Example

**What happens when you update an asset:**

```
BEGIN TRANSACTION;
  ↓
1. UPDATE assets SET status='Maintenance' WHERE id=1;
  ↓
2. INSERT INTO audit_logs (...) VALUES (...);
  ↓
3. INSERT INTO asset_lifecycle (...) VALUES (...);
  ↓
COMMIT;  ← All 3 operations saved together
         ← If any fails, ALL are rolled back
```

**Atomicity (ACID):**
- All operations succeed together
- Or all operations fail together
- Database never in inconsistent state

---

## Current Database State

```
Database: assets.db (160 KB)
Last Modified: June 17, 2026, 13:32

┌─────────────────────────┬──────────┐
│ Table                   │ Records  │
├─────────────────────────┼──────────┤
│ assets                  │    46    │ ← IT devices
│ users                   │     2    │ ← Admins (you + Revanth)
│ employees               │    33    │ ← Asset holders
│ temporary_assignments   │     2    │ ← Active loaner devices
│ audit_logs              │     9    │ ← New audit system
│ activity_logs           │   133    │ ← Legacy logs
│ asset_lifecycle         │     4    │ ← Lifecycle events
│ asset_replacements      │     0    │ ← Replacement tracking
│ employee_exits          │     0    │ ← Exit clearance
│ admin_profile           │     ?    │ ← Admin settings
│ email_config            │     ?    │ ← Email settings
│ exit_asset_collection   │     ?    │ ← Exit collections
└─────────────────────────┴──────────┘

Total Database Size: 160 KB
Estimated Max Capacity: 140 TB (SQLite limit)
Current Usage: 0.0001% of capacity
```

---

## Backup Strategy

```
Current Database
    ↓ (Manual Copy)
┌─────────────────┐
│   assets.db     │
└─────────┬───────┘
          │
          ├── Daily Backup (Recommended)
          │   └── assets_backup_20260619.db
          │
          ├── Weekly Backup
          │   └── assets_backup_week25.db
          │
          └── Monthly Backup
              └── assets_backup_june2026.db

Backup Command:
cp assets.db "assets_backup_$(date +%Y%m%d).db"
```

---

## Summary

**Your Data Storage:**

🗄️  **Type:** SQLite (File-based database)
📍 **Location:** `/home/administrator/Desktop/asset-management/assets.db`
📊 **Size:** 160 KB
📦 **Format:** Binary SQLite 3.x
🔧 **ORM:** SQLAlchemy (Python ↔ SQL)
⚡ **Performance:** Fast for your use case
🔒 **ACID:** Fully transactional
💾 **Backup:** Simple file copy

**Data Flow:**
Browser → React → Axios → Flask → SQLAlchemy → SQLite File

**Everything stored in one file - simple and efficient!** 🚀
