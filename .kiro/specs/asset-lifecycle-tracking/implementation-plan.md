# Asset Lifecycle Tracking - Implementation Plan

## Project Overview
Implement comprehensive asset lifecycle management with audit trails, temporary replacements, asset swaps, and employee exit handling.

---

## Phase 1: Database Schema & Models (Week 1)

### Task 1.1: Create Audit Log System
**File**: `models.py`

```python
class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    action_type = db.Column(db.String(50), nullable=False)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'))
    asset_name = db.Column(db.String(200))
    category = db.Column(db.String(100))
    employee_id = db.Column(db.String(50))
    employee_name = db.Column(db.String(150))
    performed_by = db.Column(db.String(100), nullable=False)
    previous_value = db.Column(db.Text)
    new_value = db.Column(db.Text)
    remarks = db.Column(db.Text)
    ip_address = db.Column(db.String(50))
    session_id = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### Task 1.2: Create Asset Lifecycle Table
**File**: `models.py`

```python
class AssetLifecycle(db.Model):
    __tablename__ = 'asset_lifecycle'
    
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)
    event_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    from_employee_id = db.Column(db.String(50))
    to_employee_id = db.Column(db.String(50))
    from_status = db.Column(db.String(50))
    to_status = db.Column(db.String(50))
    reason = db.Column(db.Text)
    performed_by = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    asset = db.relationship('Asset', backref='lifecycle_events')
```

### Task 1.3: Create Temporary Assignment Table
**File**: `models.py`

```python
class TemporaryAssignment(db.Model):
    __tablename__ = 'temporary_assignments'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(50), nullable=False)
    employee_name = db.Column(db.String(150))
    original_asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    temporary_asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    expected_return_date = db.Column(db.Date)
    actual_return_date = db.Column(db.Date)
    status = db.Column(db.String(50), default='Active')
    created_by = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    original_asset = db.relationship('Asset', foreign_keys=[original_asset_id])
    temporary_asset = db.relationship('Asset', foreign_keys=[temporary_asset_id])
```

### Task 1.4: Create Asset Replacement Table
**File**: `models.py`

```python
class AssetReplacement(db.Model):
    __tablename__ = 'asset_replacements'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(50), nullable=False)
    employee_name = db.Column(db.String(150))
    old_asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    new_asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    replacement_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    old_asset_condition = db.Column(db.String(50))
    remarks = db.Column(db.Text)
    performed_by = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    old_asset = db.relationship('Asset', foreign_keys=[old_asset_id])
    new_asset = db.relationship('Asset', foreign_keys=[new_asset_id])
```

### Task 1.5: Create Employee Exit Tables
**File**: `models.py`

```python
class EmployeeExit(db.Model):
    __tablename__ = 'employee_exits'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(50), nullable=False)
    employee_name = db.Column(db.String(150), nullable=False)
    exit_date = db.Column(db.Date, nullable=False)
    exit_type = db.Column(db.String(50))
    processed_by = db.Column(db.String(100))
    total_assets_assigned = db.Column(db.Integer, default=0)
    total_assets_returned = db.Column(db.Integer, default=0)
    total_assets_missing = db.Column(db.Integer, default=0)
    total_assets_damaged = db.Column(db.Integer, default=0)
    remarks = db.Column(db.Text)
    exit_report_generated = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    asset_collections = db.relationship('ExitAssetCollection', backref='exit', lazy=True)

class ExitAssetCollection(db.Model):
    __tablename__ = 'exit_asset_collection'
    
    id = db.Column(db.Integer, primary_key=True)
    exit_id = db.Column(db.Integer, db.ForeignKey('employee_exits.id'), nullable=False)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    collection_status = db.Column(db.String(50), nullable=False)
    condition = db.Column(db.String(50))
    remarks = db.Column(db.Text)
    collected_date = db.Column(db.Date)
    
    # Relationship
    asset = db.relationship('Asset')
```

### Task 1.6: Update Asset Model Statuses
**File**: `models.py`

Add new status values to Asset model validation/enum if exists.

### Task 1.7: Create Migration Script
**File**: `migrations/add_lifecycle_tracking.py`

```python
# Migration script to add all new tables
```

**Deliverable**: Complete database schema with all new tables

---

## Phase 2: Backend Services & APIs (Week 2-3)

### Task 2.1: Create Audit Log Service
**File**: `services/audit_service.py`

```python
class AuditService:
    @staticmethod
    def log_action(action_type, asset=None, employee=None, 
                   user=None, previous=None, new=None, remarks=None):
        """Create audit log entry"""
        pass
    
    @staticmethod
    def get_logs(filters=None, pagination=None):
        """Retrieve audit logs with filters"""
        pass
    
    @staticmethod
    def get_asset_history(asset_id):
        """Get complete history for an asset"""
        pass
    
    @staticmethod
    def get_employee_history(employee_id):
        """Get complete history for an employee"""
        pass
```

### Task 2.2: Create Lifecycle Service
**File**: `services/lifecycle_service.py`

```python
class LifecycleService:
    @staticmethod
    def record_event(asset_id, event_type, **kwargs):
        """Record lifecycle event"""
        pass
    
    @staticmethod
    def get_asset_timeline(asset_id):
        """Get chronological timeline for asset"""
        pass
    
    @staticmethod
    def get_asset_holders(asset_id):
        """Get all employees who have held this asset"""
        pass
```

### Task 2.3: Temporary Assignment APIs
**File**: `api_server.py` or `routes.py`

```python
@app.route('/api/temporary-assignments', methods=['POST'])
def create_temporary_assignment():
    """Assign temporary replacement device"""
    pass

@app.route('/api/temporary-assignments/<int:id>/complete', methods=['POST'])
def complete_temporary_assignment(id):
    """Return temporary device and reassign original"""
    pass

@app.route('/api/temporary-assignments/active', methods=['GET'])
def get_active_temporary_assignments():
    """Get all active temporary assignments"""
    pass
```

### Task 2.4: Asset Replacement APIs
**File**: `api_server.py` or `routes.py`

```python
@app.route('/api/assets/<int:asset_id>/replace', methods=['POST'])
def replace_asset(asset_id):
    """Replace asset with new one"""
    pass

@app.route('/api/asset-replacements', methods=['GET'])
def get_replacements():
    """Get replacement history"""
    pass

@app.route('/api/asset-replacements/<int:id>', methods=['GET'])
def get_replacement_details(id):
    """Get specific replacement details"""
    pass
```

### Task 2.5: Employee Exit APIs
**File**: `api_server.py` or `routes.py`

```python
@app.route('/api/employee-exits', methods=['POST'])
def initiate_employee_exit():
    """Start employee exit process"""
    pass

@app.route('/api/employee-exits/<int:id>/collect-asset', methods=['POST'])
def collect_exit_asset(id):
    """Mark asset as collected during exit"""
    pass

@app.route('/api/employee-exits/<int:id>/complete', methods=['POST'])
def complete_employee_exit(id):
    """Complete exit process"""
    pass

@app.route('/api/employee-exits/<int:id>/report', methods=['GET'])
def generate_exit_report(id):
    """Generate PDF exit report"""
    pass
```

### Task 2.6: Enhanced Dashboard APIs
**File**: `api_server.py` or `routes.py`

```python
@app.route('/api/dashboard/lifecycle-stats', methods=['GET'])
def get_lifecycle_stats():
    """Get lifecycle statistics for dashboard"""
    pass

@app.route('/api/dashboard/recent-activities', methods=['GET'])
def get_recent_activities():
    """Get recent activity timeline"""
    pass
```

### Task 2.7: Update Existing Asset APIs
**File**: `api_server.py`

Modify existing create/update/delete endpoints to:
- Create audit log entries
- Record lifecycle events
- Track status changes

**Deliverable**: Complete backend API with audit logging

---

## Phase 3: Frontend UI Components (Week 3-4)

### Task 3.1: Activity History Page
**File**: `frontend/src/pages/ActivityHistory.js`

Features:
- Complete activity log table
- Search and filters
- Date range picker
- Export to CSV
- Real-time updates

### Task 3.2: Asset Timeline Component
**File**: `frontend/src/components/AssetTimeline.js`

Features:
- Visual timeline of asset lifecycle
- Color-coded events
- Expandable details
- Employee links

### Task 3.3: Temporary Assignment UI
**Files**:
- `frontend/src/pages/TemporaryAssignments.js`
- `frontend/src/components/AssignTemporaryModal.js`
- `frontend/src/components/CompleteTemporaryModal.js`

Features:
- Assign temporary replacement workflow
- View active assignments
- Complete assignment workflow
- Overdue notifications

### Task 3.4: Asset Replacement UI
**Files**:
- `frontend/src/components/ReplaceAssetModal.js`
- `frontend/src/pages/ReplacementHistory.js`

Features:
- Replace asset workflow
- Select new asset
- Enter reason and condition
- View replacement history

### Task 3.5: Employee Exit UI
**Files**:
- `frontend/src/pages/EmployeeExit.js`
- `frontend/src/components/ExitWorkflowModal.js`
- `frontend/src/components/AssetCollectionForm.js`

Features:
- Initiate exit process
- Display assigned assets
- Mark collection status
- Generate exit report
- Download PDF

### Task 3.6: Enhanced Dashboard
**File**: `frontend/src/pages/Dashboard.js`

Add:
- Lifecycle metrics cards
- Recent activity timeline
- Active temporary assignments widget
- Pending repairs widget
- Exit process status

### Task 3.7: Asset Detail Enhancements
**File**: `frontend/src/pages/AssetView.js`

Add:
- Lifecycle timeline tab
- Audit history tab
- Quick actions:
  - Send for Repair
  - Assign Temporary
  - Replace Asset
  - Mark as Lost/Damaged

**Deliverable**: Complete UI with all lifecycle features

---

## Phase 4: Testing & Refinement (Week 5)

### Task 4.1: Unit Tests
- Test audit logging
- Test lifecycle tracking
- Test temporary assignments
- Test replacements
- Test exit process

### Task 4.2: Integration Tests
- End-to-end workflows
- API integration
- Database transactions

### Task 4.3: UI/UX Testing
- User acceptance testing
- Workflow validation
- Performance testing

### Task 4.4: Documentation
- User manual
- API documentation
- Admin guide

**Deliverable**: Tested and documented system

---

## File Structure

```
asset-management/
├── models.py (enhanced)
├── api_server.py (enhanced)
├── services/
│   ├── audit_service.py (new)
│   └── lifecycle_service.py (new)
├── migrations/
│   └── add_lifecycle_tracking.py (new)
├── frontend/src/
│   ├── pages/
│   │   ├── ActivityHistory.js (new)
│   │   ├── TemporaryAssignments.js (new)
│   │   ├── ReplacementHistory.js (new)
│   │   ├── EmployeeExit.js (new)
│   │   ├── Dashboard.js (enhanced)
│   │   └── AssetView.js (enhanced)
│   ├── components/
│   │   ├── AssetTimeline.js (new)
│   │   ├── AssignTemporaryModal.js (new)
│   │   ├── ReplaceAssetModal.js (new)
│   │   ├── ExitWorkflowModal.js (new)
│   │   └── AssetCollectionForm.js (new)
│   └── services/
│       └── api.js (enhanced)
```

---

## Priority Order

### High Priority (Must Have)
1. Audit Log System
2. Asset Lifecycle Tracking
3. Activity History Page
4. Enhanced Dashboard

### Medium Priority (Should Have)
5. Temporary Assignment Feature
6. Asset Replacement Feature
7. Asset Timeline Component

### Lower Priority (Nice to Have)
8. Employee Exit Process
9. Advanced Reporting
10. PDF Generation

---

## Risk Assessment

### Technical Risks
- Database migration complexity: **Medium**
- Performance with large audit logs: **Medium**
- Frontend state management: **Low**

### Mitigation Strategies
- Test migrations on copy of database first
- Implement pagination and indexing for audit logs
- Use React context for state management

---

## Success Metrics

- ✅ 100% of actions logged in audit trail
- ✅ Asset timeline visible within 1 second
- ✅ Temporary assignment workflow < 5 clicks
- ✅ Exit process completion < 10 minutes
- ✅ Dashboard loads < 2 seconds
- ✅ Zero data loss during transitions

---

## Next Immediate Steps

1. **Review this plan** - Confirm scope and approach
2. **Create Phase 1 branch** - `feature/lifecycle-tracking-phase1`
3. **Start with database** - Create models and migrations
4. **Implement audit service** - Core logging functionality
5. **Build basic UI** - Activity history page

Would you like me to start implementing Phase 1 now?
