# Asset Lifecycle Tracking & Audit System - Requirements

## Overview
Build a complete enterprise-grade asset lifecycle management system with comprehensive audit trails, temporary replacements, asset swaps, and employee exit handling.

---

## 1. Complete Audit Log / Activity History

### Events to Track
- Asset Created
- Asset Updated
- Asset Deleted
- Asset Assigned
- Asset Returned
- Asset Reassigned
- Asset Replaced
- Asset Sent for Repair
- Asset Received from Repair
- Temporary Asset Assigned
- Employee Exit Asset Collection
- Warranty Updates
- Status Changes
- User Actions

### Log Information Structure
For every activity, store:
- **Timestamp**: Date & Time (ISO format)
- **Action Type**: Action performed
- **Asset ID**: Unique asset identifier
- **Asset Name**: Human-readable name
- **Category**: Asset category
- **Employee Name**: Affected employee (if applicable)
- **Performed By**: Admin/User who performed action
- **Previous Value**: State before change
- **New Value**: State after change
- **Remarks**: Additional notes
- **IP Address**: Source of action
- **Session ID**: For tracking related actions

### Database Schema
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    asset_id INTEGER,
    asset_name VARCHAR(200),
    category VARCHAR(100),
    employee_id VARCHAR(50),
    employee_name VARCHAR(150),
    performed_by VARCHAR(100) NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    remarks TEXT,
    ip_address VARCHAR(50),
    session_id VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Activity History Page Features
- View complete system activity
- Filter by:
  - Date range
  - Asset
  - Employee
  - Action type
  - Performed by
- Search functionality
- Export to CSV/PDF
- Pagination
- Real-time updates

---

## 2. Asset Lifecycle Tracking

### Asset Movement History
Track complete lifecycle:
1. **Procurement**: When added to inventory
2. **Assignment**: Issued to employee
3. **Return**: Returned to inventory
4. **Repair**: Sent for maintenance
5. **Replacement**: Swapped with another asset
6. **Retirement**: Decommissioned

### Database Schema
```sql
CREATE TABLE asset_lifecycle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_date DATETIME NOT NULL,
    from_employee_id VARCHAR(50),
    to_employee_id VARCHAR(50),
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    reason TEXT,
    performed_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id)
);
```

### Asset Timeline View
Display chronological history:
```
📦 01-Jan-2024: Added to Inventory
    Status: Available
    
👤 15-Jan-2024: Assigned to John Smith
    Status: Available → Assigned
    
🔧 10-Jun-2024: Sent for Repair
    Status: Assigned → Under Repair
    Reason: Screen replacement
    
✅ 20-Jun-2024: Repair Completed
    Status: Under Repair → Available
    
👤 25-Jun-2024: Assigned to Michael Johnson
    Status: Available → Assigned
```

---

## 3. Temporary Replacement Device Feature

### Use Case
Employee's asset needs repair, but they need a working device immediately.

### Workflow
1. **Mark Asset for Repair**
   - Select asset
   - Click "Send for Repair"
   - Enter reason and expected return date
   - Status: Assigned → Under Repair

2. **Assign Temporary Device**
   - Click "Assign Temporary Replacement"
   - Select available replacement asset
   - System records:
     - Original asset ID
     - Temporary asset ID
     - Employee
     - Start date
     - Expected return date
     - Reason

3. **Return Process**
   - Original device repaired
   - Employee returns temporary device
   - Original device reassigned
   - System logs complete transaction

### Database Schema
```sql
CREATE TABLE temporary_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(150),
    original_asset_id INTEGER NOT NULL,
    temporary_asset_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    start_date DATE NOT NULL,
    expected_return_date DATE,
    actual_return_date DATE,
    status VARCHAR(50) DEFAULT 'Active',
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (original_asset_id) REFERENCES assets(id),
    FOREIGN KEY (temporary_asset_id) REFERENCES assets(id)
);
```

### UI Features
- "Assign Temporary Replacement" button on asset detail page
- View active temporary assignments
- Notifications for overdue returns
- Auto-complete when original device returned

---

## 4. Permanent Asset Replacement

### Use Case
Old asset replaced with new one (upgrade, malfunction, etc.)

### Workflow
1. **Initiate Replacement**
   - Select current asset
   - Click "Replace Asset"
   - Choose new asset
   - Enter reason (Hardware Upgrade, Malfunction, etc.)

2. **System Actions**
   - Mark old asset as: Replaced/Retired
   - Assign new asset to same employee
   - Create replacement record
   - Update asset history
   - Generate replacement report

### Database Schema
```sql
CREATE TABLE asset_replacements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(150),
    old_asset_id INTEGER NOT NULL,
    new_asset_id INTEGER NOT NULL,
    replacement_date DATE NOT NULL,
    reason TEXT NOT NULL,
    old_asset_condition VARCHAR(50),
    remarks TEXT,
    performed_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (old_asset_id) REFERENCES assets(id),
    FOREIGN KEY (new_asset_id) REFERENCES assets(id)
);
```

### Replacement Reasons
- Hardware Upgrade
- Performance Issues
- Hardware Failure
- Damaged Beyond Repair
- Lost/Stolen
- End of Life
- Employee Request
- Other

---

## 5. Employee Exit / Asset Recovery Process

### Use Case
Employee leaving company - need to collect all assigned assets

### Workflow
1. **Initiate Exit Process**
   - Open employee profile
   - Click "Process Employee Exit"
   - System displays all assigned assets

2. **Asset Collection**
   For each asset, mark as:
   - ✅ Returned (Good Condition)
   - 🔧 Returned (Needs Repair)
   - ⚠️ Damaged
   - ❌ Missing/Lost

3. **System Actions**
   - Update all asset statuses
   - Mark employee as: Exited
   - Generate exit report (PDF)
   - Create audit logs for each asset
   - Calculate missing/damaged charges (if applicable)

### Database Schema
```sql
CREATE TABLE employee_exits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(150) NOT NULL,
    exit_date DATE NOT NULL,
    exit_type VARCHAR(50),
    processed_by VARCHAR(100),
    total_assets_assigned INTEGER,
    total_assets_returned INTEGER,
    total_assets_missing INTEGER,
    total_assets_damaged INTEGER,
    remarks TEXT,
    exit_report_generated BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exit_asset_collection (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exit_id INTEGER NOT NULL,
    asset_id INTEGER NOT NULL,
    collection_status VARCHAR(50) NOT NULL,
    condition VARCHAR(50),
    remarks TEXT,
    collected_date DATE,
    FOREIGN KEY (exit_id) REFERENCES employee_exits(id),
    FOREIGN KEY (asset_id) REFERENCES assets(id)
);
```

### Exit Report Contents
- Employee Details
- Exit Date
- List of Assets Assigned
- Collection Status
- Asset Condition
- Missing/Damaged Items
- Clearance Signature
- Generated PDF

---

## 6. Asset Status Management

### Standard Status Values
1. **Available** - Ready for assignment
2. **Assigned** - Currently with employee
3. **Under Repair** - Being repaired
4. **Repair Completed** - Fixed, ready for use
5. **Temporary Assignment** - Used as replacement
6. **Returned** - Returned by employee
7. **Replaced** - Permanently replaced
8. **Retired** - No longer in use
9. **Lost** - Cannot be located
10. **Damaged** - Unusable condition
11. **Disposed** - Officially disposed

### Status Transitions
```
Available → Assigned → Under Repair → Repair Completed → Available
Available → Assigned → Returned → Available
Available → Temporary Assignment → Returned → Available
Assigned → Replaced → Retired
Any → Lost
Any → Damaged → Disposed
```

### Status Change Logging
Every status change creates:
- Audit log entry
- Lifecycle event
- Optional notification

---

## 7. Dashboard Enhancements

### Key Metrics
1. **Assets Overview**
   - Total Assets
   - Assets Assigned
   - Assets Available
   - Assets Under Repair
   - Assets Replaced

2. **Activity Metrics**
   - Temporary Assets Active
   - Assets Returned Today
   - Pending Repairs
   - Overdue Returns

3. **Employee Metrics**
   - Employees with Assigned Assets
   - Employees Exited (This Month)
   - Assets Pending Collection

### Recent Activity Timeline
Real-time feed showing:
- Last 20 activities
- Auto-refresh every 30 seconds
- Color-coded by action type
- Quick links to details

### Visual Components
- Status distribution chart
- Asset lifecycle chart
- Monthly activity trend
- Category breakdown
- Employee asset distribution

---

## Technical Implementation Plan

### Phase 1: Database Schema (Week 1)
- Create audit_logs table
- Create asset_lifecycle table
- Create temporary_assignments table
- Create asset_replacements table
- Create employee_exits tables
- Run migrations

### Phase 2: Backend APIs (Week 2-3)
- Audit log service
- Lifecycle tracking service
- Temporary assignment endpoints
- Asset replacement endpoints
- Employee exit endpoints
- Enhanced asset update tracking

### Phase 3: Frontend Components (Week 3-4)
- Activity History page
- Asset Timeline component
- Temporary Assignment UI
- Asset Replacement UI
- Employee Exit workflow
- Enhanced Dashboard

### Phase 4: Testing & Refinement (Week 5)
- Unit tests
- Integration tests
- UI/UX testing
- Performance optimization
- Documentation

---

## Success Criteria

✅ **Audit Trail**
- Every action logged automatically
- Complete history available
- Searchable and filterable

✅ **Lifecycle Tracking**
- Complete asset movement history
- Visual timeline view
- Easy to understand

✅ **Temporary Replacements**
- Simple workflow
- Clear tracking
- Automatic status updates

✅ **Asset Replacements**
- One-click process
- Maintains history
- Generates reports

✅ **Employee Exit**
- Comprehensive asset collection
- Auto-generated reports
- Complete audit trail

✅ **Dashboard**
- Real-time metrics
- Activity timeline
- Visual insights

---

## Dependencies

### Backend
- Python Flask (existing)
- SQLAlchemy (existing)
- SQLite (existing)
- ReportLab (for PDF generation)

### Frontend
- React (existing)
- React Router (existing)
- Bootstrap Icons (existing)
- Chart.js (for visualizations)
- Date picker library

---

## Timeline Estimate

**Total Duration**: 5 weeks

**Milestones**:
- Week 1: Database schema + basic audit logging
- Week 2: Lifecycle tracking + temporary assignments
- Week 3: Asset replacements + employee exit
- Week 4: Frontend UI completion
- Week 5: Testing + refinement + deployment

---

## Next Steps

1. Review and approve requirements
2. Create database migration scripts
3. Implement Phase 1: Database Schema
4. Begin Phase 2: Backend APIs
5. Develop Phase 3: Frontend UI
6. Execute Phase 4: Testing
7. Deploy to production

---

**Status**: Requirements Defined - Awaiting Approval
**Priority**: High
**Complexity**: High
**Business Value**: Very High
