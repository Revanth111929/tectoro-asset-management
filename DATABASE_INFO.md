# Database Information - IT Asset Management System

## Database Type: SQLite

**SQLite** is a lightweight, file-based database that doesn't require a separate server process.

---

## Database Location

**File Path:** `/home/administrator/Desktop/asset-management/assets.db`
**File Size:** 160 KB (as of June 17, 2026)

### How to Access:

```python
# In Python code:
import sqlite3
conn = sqlite3.connect('/home/administrator/Desktop/asset-management/assets.db')
cursor = conn.cursor()
```

```bash
# Command line (if sqlite3 is installed):
sqlite3 /home/administrator/Desktop/asset-management/assets.db
```

---

## Database Configuration

Located in `api_server.py`:

```python
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'assets.db')
```

**Translation:** The database file `assets.db` is stored in the same directory as `api_server.py`

---

## ORM Used: SQLAlchemy + Flask-SQLAlchemy

**What it does:** Provides Python classes to interact with database tables instead of writing raw SQL.

**Example:**
```python
# Instead of SQL: SELECT * FROM assets WHERE status='Available'
# You write:
assets = Asset.query.filter_by(status='Available').all()
```

---

## Database Tables & Current Data

| Table Name | Records | Description |
|------------|---------|-------------|
| **assets** | 46 | Main IT assets (laptops, monitors, etc.) |
| **users** | 2 | Admin users (login credentials) |
| **employees** | 33 | Employee records (asset holders) |
| **temporary_assignments** | 2 | Active loaner device assignments |
| **audit_logs** | 9 | New comprehensive audit trail |
| **activity_logs** | 133 | Legacy activity logs |
| **asset_lifecycle** | 4 | Asset lifecycle events |
| **asset_replacements** | 0 | Asset replacement history |
| **employee_exits** | 0 | Employee exit/clearance records |
| **admin_profile** | - | Admin profile settings |
| **email_config** | - | Email configuration |
| **exit_asset_collection** | - | Asset collection during exits |

---

## Table Schemas

### 1. **assets** (Main Asset Table)
Stores all IT assets with ~60 fields including:

**Core Fields:**
- `id` - Primary key (auto-increment)
- `asset_name` - Device name
- `serial_number` - Unique identifier (indexed)
- `category` - Laptop, Desktop, Monitor, etc.
- `status` - Available, Assigned, Maintenance, Retired
- `emp_id` - Current employee ID
- `employee_name` - Current employee name
- `employee_email` - Employee email

**Asset Details:**
- `model_name`, `brand_name`, `os`, `version`, `ram`
- `processor`, `storage_type`, `storage_capacity`
- `graphics_card`, `screen_size`

**Purchase Info:**
- `invoice_number`, `invoice_date`, `purchase_price`
- `warranty_date`, `warranty_start_date`, `warranty_end_date`
- `purchase_vendor`

**Location & Tracking:**
- `location`, `charger_serial`, `laptop_bag_serial`

**Timestamps:**
- `created_at`, `updated_at`

**Model Location:** `models.py` - `Asset` class

---

### 2. **users** (Admin Users)
Stores admin login credentials:

Fields:
- `id` - Primary key
- `username` - Unique username
- `email` - Email address
- `password_hash` - Hashed password (bcrypt)
- `role` - admin, standard, viewer
- `is_active` - Boolean
- `smtp_password` - For sending emails
- `created_at` - Registration date

**Current Users:**
1. admin (admin@company.com)
2. Revanth (revanth.maddela@tectoro.com)

**Model Location:** `models.py` - `User` class

---

### 3. **employees** (Employee Master)
Stores employee information:

Fields:
- `emp_id` - Employee ID (primary key)
- `employee_name` - Full name
- `email` - Email address
- `mobile_number` - Phone number
- `location` - Office location
- `department` - Department
- `designation` - Job title
- `is_active` - Employment status
- `created_at`, `updated_at`

**Current Count:** 33 employees

**Model Location:** `models.py` - `Employee` class

---

### 4. **temporary_assignments** (Loaner Devices)
Tracks temporary device assignments during repairs:

Fields:
- `id` - Assignment ID
- `employee_id` - Employee receiving loaner
- `employee_name` - Employee name
- `original_asset_id` - Asset being repaired
- `original_asset_name` - Name of original asset
- `original_asset_serial` - Serial of original asset
- `temp_asset_id` - Loaner device ID
- `temp_asset_name` - Name of loaner
- `temp_asset_serial` - Serial of loaner
- `reason` - Why temporary assignment needed
- `start_date` - When assignment started
- `expected_return_date` - Expected completion
- `actual_return_date` - Actual return date
- `status` - Active, Completed, Overdue
- `created_at`, `updated_at`

**Current Assignments:**
1. Revanth Maddela - Dell Laptop → Apple Pro (Screen damage)
2. Rajini Goku - Integration Test Laptop → temp device (Screen damage)

**Model Location:** `models.py` - `TemporaryAssignment` class

---

### 5. **audit_logs** (Comprehensive Audit Trail)
New audit system with detailed change tracking:

Fields:
- `id` - Log ID
- `timestamp` - When action occurred
- `action_type` - ASSET_CREATED, ASSET_UPDATED, STATUS_CHANGED, etc.
- `module` - Asset, Employee, User, etc.
- `asset_id`, `asset_name`, `asset_serial`, `category`
- `employee_id`, `employee_name`
- `field_name` - Which field changed
- `old_value` - Previous value
- `new_value` - New value
- `performed_by` - Username who made change
- `user_role` - Role of user
- `ip_address` - Request IP
- `remarks` - Additional notes
- `extra_data` - JSON for complex data
- `created_at`

**Features:**
- Tracks every field change
- Records who, what, when, where
- Supports filtering and export
- Powers Activity History page

**Model Location:** `models.py` - `AuditLog` class

---

### 6. **activity_logs** (Legacy Activity Log)
Older, simpler activity tracking:

Fields:
- `id` - Log ID
- `user` - Username
- `action` - CREATE, UPDATE, DELETE, etc.
- `module` - Asset, Employee, etc.
- `description` - Text description
- `timestamp` - When it happened

**Note:** Being gradually replaced by `audit_logs`

**Model Location:** `models.py` - `ActivityLog` class

---

### 7. **asset_lifecycle** (Lifecycle Events)
Tracks major lifecycle events:

Fields:
- `id` - Event ID
- `asset_id` - Related asset
- `event_type` - PROCURED, ASSIGNED, RETURNED, etc.
- `from_status`, `to_status` - Status changes
- `from_employee_id`, `to_employee_id` - Employee changes
- `reason` - Why event occurred
- `performed_by` - Who did it
- `created_at`

**Event Types:**
- PROCURED - Asset purchased
- ASSIGNED - Asset given to employee
- RETURNED - Asset returned
- REASSIGNED - Asset moved to new employee
- TEMP_ASSIGNED - Loaner device
- MAINTENANCE_STARTED - Sent for repair
- MAINTENANCE_COMPLETED - Repair done
- REPLACED - Asset replaced
- RETIRED - Asset retired/disposed

**Model Location:** `models.py` - `AssetLifecycleEvent` class

---

## How Data is Stored

### SQLite Storage Format:

SQLite stores everything in a single file (`assets.db`) using a binary format:

1. **File Structure:**
   - Header (100 bytes) - Database metadata
   - Tables - Each table stored as B-tree structure
   - Indexes - For fast lookups (serial_number, emp_id, etc.)

2. **Data Types:**
   - INTEGER - Numbers (IDs, counts)
   - TEXT - Strings (names, serials)
   - REAL - Decimals (prices)
   - BLOB - Binary data (if needed)
   - NULL - Empty values

3. **Relationships:**
   - Foreign Keys: `asset_id` in audit_logs → `id` in assets
   - One-to-Many: One employee → Many assets
   - Many-to-One: Many audit logs → One asset

---

## Data Flow

```
User Action (Browser)
    ↓
React Frontend (JavaScript)
    ↓
Axios HTTP Request
    ↓
Flask API (api_server.py)
    ↓
SQLAlchemy ORM (Python)
    ↓
SQLite Database (assets.db)
```

**Example - Creating an Asset:**

1. User fills form in React
2. Frontend sends POST to `/api/assets`
3. Flask receives JSON data
4. SQLAlchemy creates `Asset` object
5. Object saved to `assets` table
6. Audit log created in `audit_logs` table
7. Lifecycle event created in `asset_lifecycle` table
8. Success response sent back to frontend

---

## Database Initialization

When `api_server.py` starts:

```python
with app.app_context():
    db.create_all()  # Creates all tables if they don't exist
    seed_data()      # Adds sample data if database is empty
```

**First Run:** Creates all tables and seeds sample data
**Subsequent Runs:** Uses existing database

---

## Backup & Migration

### Manual Backup:
```bash
# Copy the database file
cp assets.db assets_backup_$(date +%Y%m%d).db
```

### Restore:
```bash
# Replace with backup
cp assets_backup_20260617.db assets.db
```

### Migration to Another Database:

To switch from SQLite to PostgreSQL/MySQL in the future:

1. Change connection string in `api_server.py`:
```python
# PostgreSQL
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:pass@localhost/assetdb'

# MySQL
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://user:pass@localhost/assetdb'
```

2. Install appropriate driver:
```bash
pip install psycopg2-binary  # PostgreSQL
pip install pymysql          # MySQL
```

3. Run migrations:
```bash
flask db upgrade
```

---

## Database Administration

### View Data:
```python
# Python script
import sqlite3
conn = sqlite3.connect('assets.db')
cursor = conn.cursor()
cursor.execute("SELECT * FROM assets LIMIT 5")
for row in cursor.fetchall():
    print(row)
conn.close()
```

### Direct SQL Queries:
```python
# Using Flask shell
from models import db
result = db.session.execute("SELECT COUNT(*) FROM assets WHERE status='Available'")
print(result.fetchone()[0])
```

### Install SQLite Browser (GUI):
```bash
sudo apt install sqlitebrowser
sqlitebrowser assets.db  # Opens GUI
```

---

## Performance Notes

**SQLite Strengths:**
✅ No server setup needed
✅ Fast for small-to-medium datasets (<100k records)
✅ Zero configuration
✅ Good for single-server applications
✅ ACID compliant (transactions)

**SQLite Limitations:**
❌ No concurrent writes (one write at a time)
❌ Limited to ~140 TB database size
❌ Not ideal for high-traffic multi-user systems
❌ No user management/permissions at DB level

**Current Usage:**
- 46 assets - Perfect ✅
- 2-3 concurrent users - Fine ✅
- Local network only - Ideal ✅

---

## Related Files

- **Database File:** `assets.db`
- **Models Definition:** `models.py`
- **API Server:** `api_server.py`
- **Migrations:** Not currently used (manual schema changes)

---

## Summary

Your IT Asset Management system uses:

1. **Database:** SQLite (file-based, no server needed)
2. **Location:** `/home/administrator/Desktop/asset-management/assets.db`
3. **Size:** 160 KB
4. **ORM:** SQLAlchemy (Python abstraction layer)
5. **Tables:** 13 tables storing assets, users, employees, logs, etc.
6. **Current Data:** 46 assets, 33 employees, 2 users, 2 active temporary assignments

**Simple, efficient, and perfect for your use case!** 🚀
