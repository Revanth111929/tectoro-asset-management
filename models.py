# models.py
# Defines all database tables using SQLAlchemy ORM.
# Each class = one table in the SQLite database.

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import secrets, hashlib

db = SQLAlchemy()

# ─────────────────────────────────────────────
# USER TABLE  – admin login
# ─────────────────────────────────────────────
class User(UserMixin, db.Model):
    __tablename__ = 'users'

    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(80),  unique=True, nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role          = db.Column(db.String(20),  default='admin')
    is_active     = db.Column(db.Boolean, default=True)
    smtp_password = db.Column(db.String(256), nullable=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.username}>'


# ─────────────────────────────────────────────
# ASSET TABLE  – main IT asset / laptop record
# All 20 required columns are here.
# ─────────────────────────────────────────────
class Asset(db.Model):
    __tablename__ = 'assets'

    # 1. Sl No  – auto-increment primary key
    id                   = db.Column(db.Integer, primary_key=True)

    # 2. EMP ID  – employee ID of current holder (nullable when unassigned)
    emp_id               = db.Column(db.String(50), index=True)

    # 3. EMPLOYEE NAME
    employee_name        = db.Column(db.String(150), index=True)

    # 4. MOBILE NUMBER
    mobile_number        = db.Column(db.String(30))

    # 4b. EMPLOYEE EMAIL
    employee_email       = db.Column(db.String(150))

    # 5. Asset NAME
    asset_name           = db.Column(db.String(150), nullable=False, index=True)

    # 6. CATEGORY  (Laptop / Desktop / Monitor / etc.)
    category             = db.Column(db.String(100), index=True)

    # 7. SERIAL NUMBER  – unique hardware identifier
    serial_number        = db.Column(db.String(100), unique=True, nullable=False, index=True)

    # 8. MODEL NAME
    model_name           = db.Column(db.String(150))

    # 9. OS  (Windows 11 / Ubuntu / macOS etc.)
    os                   = db.Column(db.String(100))

    # 10. Version  (OS version or firmware version)
    version              = db.Column(db.String(50))

    # 11. RAM  (e.g. 8GB / 16GB)
    ram                  = db.Column(db.String(30))

    # 12. LOCATION  (office / floor / room)
    location             = db.Column(db.String(150))

    # 13. INVOICE NUMBER
    invoice_number       = db.Column(db.String(100))

    # 14. INVOICE DATE
    invoice_date         = db.Column(db.Date)

    # 15. WARRANTY DATE  – expiry date for warranty alerts
    warranty_date        = db.Column(db.Date)

    # 16. CHARGER SERIAL NUMBER
    charger_serial       = db.Column(db.String(100))

    # 17. OLD USER  – previous employee who had this device
    old_user             = db.Column(db.String(150))

    # 18. DATE  – assignment / entry date
    date                 = db.Column(db.Date, default=datetime.utcnow)

    # 19. OLD DEVICE  – previous device the employee had
    old_device           = db.Column(db.String(150))

    # 20. COMMENTS
    comments             = db.Column(db.Text)
    
    # Additional inventory fields
    purchase_price       = db.Column(db.Float)
    quantity             = db.Column(db.Integer, default=1)
    configuration        = db.Column(db.Text)  # Detailed specs
    laptop_bag_serial    = db.Column(db.String(100))
    hard_disk_serial     = db.Column(db.String(100))
    hard_disk_capacity   = db.Column(db.String(50))
    ups_serial           = db.Column(db.String(100))
    ups_capacity         = db.Column(db.String(50))
    printer_type         = db.Column(db.String(100))  # Inkjet/Laser/etc
    printer_model        = db.Column(db.String(150))
    mobile_imei          = db.Column(db.String(50))
    mobile_number_sim    = db.Column(db.String(30))
    testing_status       = db.Column(db.String(50))  # For mobiles: Passed/Failed/Pending

    # ── New Dynamic Category-Specific Fields ──
    # Basic fields (additional)
    brand_name           = db.Column(db.String(150))  # Brand (Dell, HP, Apple, etc.)
    
    # Computer specifications
    processor            = db.Column(db.String(150))  # CPU details
    storage_type         = db.Column(db.String(50))   # SSD/HDD/Hybrid/NVMe
    storage_capacity     = db.Column(db.String(50))   # 512GB, 1TB, etc.
    graphics_card        = db.Column(db.String(150))  # GPU for desktops
    os_version           = db.Column(db.String(50))   # OS version details
    screen_size          = db.Column(db.String(30))   # Monitor/Laptop screen size
    
    # Mobile/Phone specific
    imei_1               = db.Column(db.String(50))   # Primary IMEI
    imei_2               = db.Column(db.String(50))   # Secondary IMEI (dual SIM)
    mobile_number        = db.Column(db.String(30))   # SIM card number
    
    # Printer specific
    color_or_mono        = db.Column(db.String(30))   # Color or Monochrome
    network_enabled      = db.Column(db.String(10))   # Yes/No
    
    # Monitor specific
    resolution           = db.Column(db.String(50))   # 1920x1080, 4K, etc.
    refresh_rate         = db.Column(db.String(30))   # 60Hz, 144Hz, etc.
    
    # Server specific
    cpu_count            = db.Column(db.Integer)      # Number of CPUs
    raid_config          = db.Column(db.String(100))  # RAID configuration
    ip_address           = db.Column(db.String(50))   # Server IP
    rack_location        = db.Column(db.String(100))  # Rack position
    
    # Hard Disk specific
    interface_type       = db.Column(db.String(50))   # USB/SATA/NVMe/SAS
    
    # UPS specific
    capacity_va          = db.Column(db.String(50))   # VA rating
    battery_type         = db.Column(db.String(100))  # Battery type
    backup_time          = db.Column(db.String(50))   # Backup duration
    
    # Peripherals (Mouse, Headphones)
    connection_type      = db.Column(db.String(50))   # USB/Wireless/Bluetooth
    noise_cancellation   = db.Column(db.String(10))   # Yes/No for headphones
    
    # Laptop Bag specific
    size_compatibility   = db.Column(db.String(50))   # Size compatibility
    color                = db.Column(db.String(50))   # Color
    warranty_period      = db.Column(db.String(50))   # Warranty period
    
    # Purchase & Warranty fields (new naming)
    purchase_vendor      = db.Column(db.String(200))  # Vendor name
    purchase_date        = db.Column(db.Date)         # Purchase date
    warranty_start_date  = db.Column(db.Date)         # Warranty start
    warranty_end_date    = db.Column(db.Date)         # Warranty end
    
    # Assignment fields
    assigned_employee    = db.Column(db.String(150))  # Assigned employee name
    
    # Other fields
    custom_description   = db.Column(db.Text)         # General description
    remarks              = db.Column(db.Text)         # Additional remarks

    # Extra operational fields
    # Acknowledgment fields
    ack_status           = db.Column(db.String(20), default='Not Sent', index=True)  # Not Sent / Pending / Acknowledged
    ack_token            = db.Column(db.String(100), unique=True, nullable=True)
    ack_sent_at          = db.Column(db.DateTime, nullable=True)
    ack_expires_at       = db.Column(db.DateTime, nullable=True)
    ack_received_at      = db.Column(db.DateTime, nullable=True)

    status               = db.Column(db.String(30), default='Available', index=True)  # Available / Assigned / Maintenance / Retired
    created_at           = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at           = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Asset {self.asset_name} [{self.serial_number}]>'

    def to_dict(self):
        """Convert to dictionary for JSON API responses"""
        return {
            'id':              self.id,
            'emp_id':          self.emp_id or '',
            'employee_name':   self.employee_name or '',
            'mobile_number':   self.mobile_number or '',
            'employee_email':  self.employee_email or '',
            'asset_name':      self.asset_name,
            'category':        self.category or '',
            'serial_number':   self.serial_number,
            'model_name':      self.model_name or '',
            'os':              self.os or '',
            'version':         self.version or '',
            'ram':             self.ram or '',
            'location':        self.location or '',
            'invoice_number':  self.invoice_number or '',
            'invoice_date':    self.invoice_date.isoformat() if self.invoice_date else '',
            'warranty_date':   self.warranty_date.isoformat() if self.warranty_date else '',
            'charger_serial':  self.charger_serial or '',
            'old_user':        self.old_user or '',
            'date':            self.date.isoformat() if self.date else '',
            'old_device':      self.old_device or '',
            'comments':        self.comments or '',
            'status':          self.status or 'Available',
            'created_at':      self.created_at.isoformat() if self.created_at else '',
            'updated_at':      self.updated_at.isoformat() if self.updated_at else '',
            'purchase_price':  self.purchase_price or 0,
            'quantity':        self.quantity or 1,
            'configuration':   self.configuration or '',
            'laptop_bag_serial': self.laptop_bag_serial or '',
            'hard_disk_serial': self.hard_disk_serial or '',
            'hard_disk_capacity': self.hard_disk_capacity or '',
            'ups_serial':      self.ups_serial or '',
            'ups_capacity':    self.ups_capacity or '',
            'printer_type':    self.printer_type or '',
            'printer_model':   self.printer_model or '',
            'mobile_imei':     self.mobile_imei or '',
            'mobile_number_sim': self.mobile_number_sim or '',
            'testing_status':  self.testing_status or '',
            'ack_status':      self.ack_status or 'Not Sent',
            'ack_sent_at':     self.ack_sent_at.isoformat() if self.ack_sent_at else '',
            'ack_received_at': self.ack_received_at.isoformat() if self.ack_received_at else '',
            'ack_expires_at':  self.ack_expires_at.isoformat() if self.ack_expires_at else '',
            # New dynamic fields
            'brand_name':      self.brand_name or '',
            'processor':       self.processor or '',
            'storage_type':    self.storage_type or '',
            'storage_capacity': self.storage_capacity or '',
            'graphics_card':   self.graphics_card or '',
            'os_version':      self.os_version or '',
            'screen_size':     self.screen_size or '',
            'imei_1':          self.imei_1 or '',
            'imei_2':          self.imei_2 or '',
            'color_or_mono':   self.color_or_mono or '',
            'network_enabled': self.network_enabled or '',
            'resolution':      self.resolution or '',
            'refresh_rate':    self.refresh_rate or '',
            'cpu_count':       self.cpu_count or 0,
            'raid_config':     self.raid_config or '',
            'ip_address':      self.ip_address or '',
            'rack_location':   self.rack_location or '',
            'interface_type':  self.interface_type or '',
            'capacity_va':     self.capacity_va or '',
            'battery_type':    self.battery_type or '',
            'backup_time':     self.backup_time or '',
            'connection_type': self.connection_type or '',
            'noise_cancellation': self.noise_cancellation or '',
            'size_compatibility': self.size_compatibility or '',
            'color':           self.color or '',
            'warranty_period': self.warranty_period or '',
            'purchase_vendor': self.purchase_vendor or '',
            'purchase_date':   self.purchase_date.isoformat() if self.purchase_date else '',
            'warranty_start_date': self.warranty_start_date.isoformat() if self.warranty_start_date else '',
            'warranty_end_date': self.warranty_end_date.isoformat() if self.warranty_end_date else '',
            'assigned_employee': self.assigned_employee or '',
            'custom_description': self.custom_description or '',
            'remarks':         self.remarks or '',
        }


# ─────────────────────────────────────────────
# ENHANCED AUDIT LOG TABLE  – comprehensive audit trail
# ─────────────────────────────────────────────
class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id               = db.Column(db.Integer, primary_key=True)
    timestamp        = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    action_type      = db.Column(db.String(50), nullable=False, index=True)  # CREATED, UPDATED, DELETED, ASSIGNED, etc.
    module           = db.Column(db.String(50), nullable=False)  # Asset, Employee, User, etc.
    
    # Asset information
    asset_id         = db.Column(db.Integer, db.ForeignKey('assets.id'), index=True)
    asset_name       = db.Column(db.String(200))
    asset_serial     = db.Column(db.String(100))
    category         = db.Column(db.String(100))
    
    # Employee information
    employee_id      = db.Column(db.String(50), index=True)
    employee_name    = db.Column(db.String(150))
    
    # Change tracking
    field_name       = db.Column(db.String(100))  # Which field was changed
    old_value        = db.Column(db.Text)         # Previous value
    new_value        = db.Column(db.Text)         # New value
    
    # User tracking
    performed_by     = db.Column(db.String(100), nullable=False)
    user_role        = db.Column(db.String(50))
    ip_address       = db.Column(db.String(50))
    
    # Additional context
    remarks          = db.Column(db.Text)
    extra_data       = db.Column(db.Text)  # JSON string for additional data (renamed from metadata)
    
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    asset = db.relationship('Asset', backref='audit_logs', foreign_keys=[asset_id])

    def to_dict(self):
        return {
            'id':            self.id,
            'timestamp':     self.timestamp.isoformat() if self.timestamp else '',
            'action_type':   self.action_type,
            'module':        self.module,
            'asset_id':      self.asset_id,
            'asset_name':    self.asset_name or '',
            'asset_serial':  self.asset_serial or '',
            'category':      self.category or '',
            'employee_id':   self.employee_id or '',
            'employee_name': self.employee_name or '',
            'field_name':    self.field_name or '',
            'old_value':     self.old_value or '',
            'new_value':     self.new_value or '',
            'performed_by':  self.performed_by,
            'user_role':     self.user_role or '',
            'ip_address':    self.ip_address or '',
            'remarks':       self.remarks or '',
            'extra_data':    self.extra_data or '',
        }

    def __repr__(self):
        return f'<AuditLog {self.action_type} on {self.module} by {self.performed_by}>'


# ─────────────────────────────────────────────
# LEGACY ACTIVITY LOG TABLE (keep for compatibility)
# ─────────────────────────────────────────────
class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'

    id          = db.Column(db.Integer, primary_key=True)
    user        = db.Column(db.String(100))
    action      = db.Column(db.String(50))   # CREATE / UPDATE / DELETE / ASSIGN / RETURN
    module      = db.Column(db.String(50))
    description = db.Column(db.Text)
    timestamp   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':          self.id,
            'user':        self.user,
            'action':      self.action,
            'module':      self.module,
            'description': self.description,
            'timestamp':   self.timestamp.isoformat() if self.timestamp else '',
        }

    def __repr__(self):
        return f'<Log {self.action} {self.module}>'


# ─────────────────────────────────────────────
# ASSET LIFECYCLE TABLE – complete movement history
# ─────────────────────────────────────────────
class AssetLifecycle(db.Model):
    __tablename__ = 'asset_lifecycle'

    id                = db.Column(db.Integer, primary_key=True)
    asset_id          = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False, index=True)
    event_type        = db.Column(db.String(50), nullable=False)  # PROCURED, ASSIGNED, RETURNED, REPAIR, REPLACED, RETIRED
    event_date        = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Employee tracking
    from_employee_id  = db.Column(db.String(50))
    from_employee     = db.Column(db.String(150))
    to_employee_id    = db.Column(db.String(50))
    to_employee       = db.Column(db.String(150))
    
    # Status tracking
    from_status       = db.Column(db.String(50))
    to_status         = db.Column(db.String(50))
    
    # Additional information
    reason            = db.Column(db.Text)
    location          = db.Column(db.String(150))
    performed_by      = db.Column(db.String(100))
    remarks           = db.Column(db.Text)
    
    created_at        = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    asset = db.relationship('Asset', backref='lifecycle_events', foreign_keys=[asset_id])

    def to_dict(self):
        return {
            'id':               self.id,
            'asset_id':         self.asset_id,
            'event_type':       self.event_type,
            'event_date':       self.event_date.isoformat() if self.event_date else '',
            'from_employee_id': self.from_employee_id or '',
            'from_employee':    self.from_employee or '',
            'to_employee_id':   self.to_employee_id or '',
            'to_employee':      self.to_employee or '',
            'from_status':      self.from_status or '',
            'to_status':        self.to_status or '',
            'reason':           self.reason or '',
            'location':         self.location or '',
            'performed_by':     self.performed_by or '',
            'remarks':          self.remarks or '',
        }

    def __repr__(self):
        return f'<AssetLifecycle {self.event_type} for Asset {self.asset_id}>'


# ─────────────────────────────────────────────
# TEMPORARY ASSIGNMENT TABLE – loaner devices
# ─────────────────────────────────────────────
class TemporaryAssignment(db.Model):
    __tablename__ = 'temporary_assignments'

    id                     = db.Column(db.Integer, primary_key=True)
    employee_id            = db.Column(db.String(50), nullable=False, index=True)
    employee_name          = db.Column(db.String(150), nullable=False)
    employee_email         = db.Column(db.String(150))
    
    # Original asset (under repair)
    original_asset_id      = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    original_asset_name    = db.Column(db.String(200))
    original_asset_serial  = db.Column(db.String(100))
    
    # Temporary replacement asset
    temp_asset_id          = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    temp_asset_name        = db.Column(db.String(200))
    temp_asset_serial      = db.Column(db.String(100))
    
    # Assignment details
    reason                 = db.Column(db.Text, nullable=False)
    start_date             = db.Column(db.Date, nullable=False)
    expected_return_date   = db.Column(db.Date)
    actual_return_date     = db.Column(db.Date)
    
    # Status tracking
    status                 = db.Column(db.String(50), default='Active')  # Active, Completed, Overdue
    
    # Audit fields
    created_by             = db.Column(db.String(100))
    completed_by           = db.Column(db.String(100))
    remarks                = db.Column(db.Text)
    created_at             = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at             = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    original_asset = db.relationship('Asset', foreign_keys=[original_asset_id], backref='original_temp_assignments')
    temp_asset = db.relationship('Asset', foreign_keys=[temp_asset_id], backref='temp_assignments')

    def to_dict(self):
        return {
            'id':                    self.id,
            'employee_id':           self.employee_id,
            'employee_name':         self.employee_name,
            'employee_email':        self.employee_email or '',
            'original_asset_id':     self.original_asset_id,
            'original_asset_name':   self.original_asset_name or '',
            'original_asset_serial': self.original_asset_serial or '',
            'temp_asset_id':         self.temp_asset_id,
            'temp_asset_name':       self.temp_asset_name or '',
            'temp_asset_serial':     self.temp_asset_serial or '',
            'reason':                self.reason,
            'start_date':            self.start_date.isoformat() if self.start_date else '',
            'expected_return_date':  self.expected_return_date.isoformat() if self.expected_return_date else '',
            'actual_return_date':    self.actual_return_date.isoformat() if self.actual_return_date else '',
            'status':                self.status,
            'created_by':            self.created_by or '',
            'completed_by':          self.completed_by or '',
            'remarks':               self.remarks or '',
            'created_at':            self.created_at.isoformat() if self.created_at else '',
            'updated_at':            self.updated_at.isoformat() if self.updated_at else '',
        }

    def __repr__(self):
        return f'<TemporaryAssignment {self.employee_name} - {self.status}>'


# ─────────────────────────────────────────────
# ASSET REPLACEMENT TABLE – permanent swaps
# ─────────────────────────────────────────────
class AssetReplacement(db.Model):
    __tablename__ = 'asset_replacements'

    id                   = db.Column(db.Integer, primary_key=True)
    employee_id          = db.Column(db.String(50), nullable=False, index=True)
    employee_name        = db.Column(db.String(150), nullable=False)
    employee_email       = db.Column(db.String(150))
    
    # Old asset being replaced
    old_asset_id         = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    old_asset_name       = db.Column(db.String(200))
    old_asset_serial     = db.Column(db.String(100))
    
    # New replacement asset
    new_asset_id         = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    new_asset_name       = db.Column(db.String(200))
    new_asset_serial     = db.Column(db.String(100))
    
    # Replacement details
    replacement_date     = db.Column(db.Date, nullable=False)
    reason               = db.Column(db.Text, nullable=False)
    old_asset_condition  = db.Column(db.String(50))  # Good, Fair, Poor, Damaged, Lost
    
    # Audit fields
    performed_by         = db.Column(db.String(100))
    remarks              = db.Column(db.Text)
    created_at           = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    old_asset = db.relationship('Asset', foreign_keys=[old_asset_id], backref='old_replacements')
    new_asset = db.relationship('Asset', foreign_keys=[new_asset_id], backref='new_replacements')

    def to_dict(self):
        return {
            'id':                  self.id,
            'employee_id':         self.employee_id,
            'employee_name':       self.employee_name,
            'employee_email':      self.employee_email or '',
            'old_asset_id':        self.old_asset_id,
            'old_asset_name':      self.old_asset_name or '',
            'old_asset_serial':    self.old_asset_serial or '',
            'new_asset_id':        self.new_asset_id,
            'new_asset_name':      self.new_asset_name or '',
            'new_asset_serial':    self.new_asset_serial or '',
            'replacement_date':    self.replacement_date.isoformat() if self.replacement_date else '',
            'reason':              self.reason,
            'old_asset_condition': self.old_asset_condition or '',
            'performed_by':        self.performed_by or '',
            'remarks':             self.remarks or '',
            'created_at':          self.created_at.isoformat() if self.created_at else '',
        }

    def __repr__(self):
        return f'<AssetReplacement {self.employee_name} - Old: {self.old_asset_id} New: {self.new_asset_id}>'


# ─────────────────────────────────────────────
# EMPLOYEE EXIT TABLE – exit process tracking
# ─────────────────────────────────────────────
class EmployeeExit(db.Model):
    __tablename__ = 'employee_exits'

    id                      = db.Column(db.Integer, primary_key=True)
    employee_id             = db.Column(db.String(50), nullable=False, index=True)
    employee_name           = db.Column(db.String(150), nullable=False)
    employee_email          = db.Column(db.String(150))
    department              = db.Column(db.String(100))
    
    # Exit details
    exit_date               = db.Column(db.Date, nullable=False)
    exit_type               = db.Column(db.String(50))  # Resignation, Termination, Retirement, Transfer
    last_working_day        = db.Column(db.Date)
    
    # Asset statistics
    total_assets_assigned   = db.Column(db.Integer, default=0)
    total_assets_returned   = db.Column(db.Integer, default=0)
    total_assets_damaged    = db.Column(db.Integer, default=0)
    total_assets_missing    = db.Column(db.Integer, default=0)
    
    # Process tracking
    exit_status             = db.Column(db.String(50), default='In Progress')  # In Progress, Completed, Pending
    clearance_status        = db.Column(db.String(50), default='Pending')  # Pending, Approved, Rejected
    
    # Audit fields
    processed_by            = db.Column(db.String(100))
    completed_by            = db.Column(db.String(100))
    completed_at            = db.Column(db.DateTime)
    remarks                 = db.Column(db.Text)
    exit_report_path        = db.Column(db.String(500))  # PDF file path
    created_at              = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at              = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    asset_collections = db.relationship('ExitAssetCollection', backref='exit', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':                     self.id,
            'employee_id':            self.employee_id,
            'employee_name':          self.employee_name,
            'employee_email':         self.employee_email or '',
            'department':             self.department or '',
            'exit_date':              self.exit_date.isoformat() if self.exit_date else '',
            'exit_type':              self.exit_type or '',
            'last_working_day':       self.last_working_day.isoformat() if self.last_working_day else '',
            'total_assets_assigned':  self.total_assets_assigned,
            'total_assets_returned':  self.total_assets_returned,
            'total_assets_damaged':   self.total_assets_damaged,
            'total_assets_missing':   self.total_assets_missing,
            'exit_status':            self.exit_status,
            'clearance_status':       self.clearance_status,
            'processed_by':           self.processed_by or '',
            'completed_by':           self.completed_by or '',
            'completed_at':           self.completed_at.isoformat() if self.completed_at else '',
            'remarks':                self.remarks or '',
            'exit_report_path':       self.exit_report_path or '',
            'created_at':             self.created_at.isoformat() if self.created_at else '',
            'updated_at':             self.updated_at.isoformat() if self.updated_at else '',
            'asset_collections':      [ac.to_dict() for ac in self.asset_collections] if self.asset_collections else [],
        }

    def __repr__(self):
        return f'<EmployeeExit {self.employee_name} - {self.exit_status}>'


# ─────────────────────────────────────────────
# EXIT ASSET COLLECTION TABLE – asset return details
# ─────────────────────────────────────────────
class ExitAssetCollection(db.Model):
    __tablename__ = 'exit_asset_collection'

    id                  = db.Column(db.Integer, primary_key=True)
    exit_id             = db.Column(db.Integer, db.ForeignKey('employee_exits.id'), nullable=False)
    asset_id            = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    asset_name          = db.Column(db.String(200))
    asset_serial        = db.Column(db.String(100))
    category            = db.Column(db.String(100))
    
    # Collection details
    collection_status   = db.Column(db.String(50), nullable=False)  # Returned, Damaged, Missing, Lost
    asset_condition     = db.Column(db.String(50))  # Excellent, Good, Fair, Poor, Damaged
    collected_date      = db.Column(db.Date)
    
    # Damage/Loss details
    damage_description  = db.Column(db.Text)
    estimated_cost      = db.Column(db.Float)
    
    # Audit fields
    collected_by        = db.Column(db.String(100))
    remarks             = db.Column(db.Text)
    created_at          = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    asset = db.relationship('Asset', backref='exit_collections')

    def to_dict(self):
        return {
            'id':                  self.id,
            'exit_id':             self.exit_id,
            'asset_id':            self.asset_id,
            'asset_name':          self.asset_name or '',
            'asset_serial':        self.asset_serial or '',
            'category':            self.category or '',
            'collection_status':   self.collection_status,
            'asset_condition':     self.asset_condition or '',
            'collected_date':      self.collected_date.isoformat() if self.collected_date else '',
            'damage_description':  self.damage_description or '',
            'estimated_cost':      self.estimated_cost or 0,
            'collected_by':        self.collected_by or '',
            'remarks':             self.remarks or '',
            'created_at':          self.created_at.isoformat() if self.created_at else '',
        }

    def __repr__(self):
        return f'<ExitAssetCollection Asset {self.asset_id} - {self.collection_status}>'


# ─────────────────────────────────────────────
# EMAIL CONFIG TABLE  – admin-managed SMTP settings
# ─────────────────────────────────────────────
class EmailConfig(db.Model):
    __tablename__ = 'email_config'

    id               = db.Column(db.Integer, primary_key=True)
    sender_email     = db.Column(db.String(150), nullable=False)
    sender_name      = db.Column(db.String(100), default='IT Asset Management')
    smtp_server      = db.Column(db.String(150), default='smtp.office365.com')
    smtp_port        = db.Column(db.Integer,     default=587)
    smtp_username    = db.Column(db.String(150), nullable=False)
    smtp_password_enc= db.Column(db.String(512), nullable=False)   # encrypted
    use_tls          = db.Column(db.Boolean,     default=True)
    is_active        = db.Column(db.Boolean,     default=True)
    created_by       = db.Column(db.String(80))
    updated_at       = db.Column(db.DateTime,    default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at       = db.Column(db.DateTime,    default=datetime.utcnow)
    last_tested_at   = db.Column(db.DateTime,    nullable=True)
    last_test_status = db.Column(db.String(20),  nullable=True)   # success / failed

    def to_dict(self, include_password=False):
        d = {
            'id':            self.id,
            'sender_email':  self.sender_email,
            'sender_name':   self.sender_name,
            'smtp_server':   self.smtp_server,
            'smtp_port':     self.smtp_port,
            'smtp_username': self.smtp_username,
            'use_tls':       self.use_tls,
            'is_active':     self.is_active,
            'updated_at':    self.updated_at.isoformat() if self.updated_at else '',
            'last_tested_at':   self.last_tested_at.isoformat() if self.last_tested_at else '',
            'last_test_status': self.last_test_status or '',
        }
        return d


# ─────────────────────────────────────────────
# EMPLOYEE TABLE  – stores user details permanently
# ─────────────────────────────────────────────
class Employee(db.Model):
    __tablename__ = 'employees'

    id             = db.Column(db.String(50))
    emp_id         = db.Column(db.String(50), unique=True, nullable=False, primary_key=True, index=True)
    employee_name  = db.Column(db.String(150), nullable=False, index=True)
    email          = db.Column(db.String(150), unique=True)
    mobile_number  = db.Column(db.String(30))
    department     = db.Column(db.String(100))
    designation    = db.Column(db.String(100))
    location       = db.Column(db.String(150))
    is_active      = db.Column(db.Boolean, default=True)
    status         = db.Column(db.String(50), default='Active')  # Active, Exited, Inactive
    exit_date      = db.Column(db.Date)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at     = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id':            self.id,
            'emp_id':        self.emp_id,
            'employee_name': self.employee_name,
            'email':         self.email or '',
            'mobile_number': self.mobile_number or '',
            'department':    self.department or '',
            'designation':   self.designation or '',
            'location':      self.location or '',
            'is_active':     self.is_active,
            'status':        self.status or 'Active',
            'exit_date':     self.exit_date.isoformat() if self.exit_date else None,
        }


# ─────────────────────────────────────────────
# ADMIN PROFILE TABLE  – stored once, reused forever
# ─────────────────────────────────────────────
class AdminProfile(db.Model):
    __tablename__ = 'admin_profile'

    id           = db.Column(db.Integer, primary_key=True)
    name         = db.Column(db.String(150))
    email        = db.Column(db.String(150))
    phone        = db.Column(db.String(30))
    department   = db.Column(db.String(100))
    designation  = db.Column(db.String(100))
    updated_at   = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id':          self.id,
            'name':        self.name or '',
            'email':       self.email or '',
            'phone':       self.phone or '',
            'department':  self.department or '',
            'designation': self.designation or '',
            'updated_at':  self.updated_at.isoformat() if self.updated_at else '',
        }
# ─────────────────────────────────────────────────────────────────────────────
# ONBOARDING MODELS — append this block to models.py
# Paste this at the END of models.py (after the existing Employee/AdminProfile
# classes), so it can reference db, Asset, Employee already defined above it.
# ─────────────────────────────────────────────────────────────────────────────

# ─────────────────────────────────────────────
# ONBOARDING TABLE  – new-employee onboarding records
# ─────────────────────────────────────────────
class Onboarding(db.Model):
    __tablename__ = 'onboarding'

    id                  = db.Column(db.Integer, primary_key=True)

    # Core onboarding fields (per spec)
    name                = db.Column(db.String(150), nullable=False)
    email               = db.Column(db.String(150), unique=True, nullable=False)
    phone_number        = db.Column(db.String(30), nullable=False)
    designation         = db.Column(db.String(100), nullable=False)
    team                = db.Column(db.String(100), nullable=False)

    # Application Access — stored as comma-separated string, same pattern
    # used elsewhere in this codebase for multi-value fields (e.g. category lists)
    application_access  = db.Column(db.Text)  # e.g. "Email,HRMS,Asset Management,Slack"

    # Status: Pending / In Progress / Completed / Converted
    status              = db.Column(db.String(30), default='Pending')

    # Link to the real Employee record once converted (nullable until then)
    converted_emp_id    = db.Column(db.String(50), db.ForeignKey('employees.emp_id'), nullable=True)
    converted_at        = db.Column(db.DateTime, nullable=True)

    created_at          = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at          = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to assigned assets (one onboarding record -> many asset assignments)
    asset_assignments   = db.relationship(
        'OnboardingAssetAssignment',
        backref='onboarding',
        lazy=True,
        cascade='all, delete-orphan'
    )

    def to_dict(self, include_assets=True):
        data = {
            'id':                 self.id,
            'name':               self.name,
            'email':              self.email,
            'phone_number':       self.phone_number,
            'designation':        self.designation,
            'team':               self.team,
            'application_access': self.application_access.split(',') if self.application_access else [],
            'status':             self.status or 'Pending',
            'converted_emp_id':   self.converted_emp_id or '',
            'converted_at':       self.converted_at.isoformat() if self.converted_at else '',
            'created_at':         self.created_at.isoformat() if self.created_at else '',
            'updated_at':         self.updated_at.isoformat() if self.updated_at else '',
        }
        if include_assets:
            data['assets_assigned'] = [a.to_dict() for a in self.asset_assignments]
        return data

    def __repr__(self):
        return f'<Onboarding {self.name} [{self.email}] {self.status}>'


# ─────────────────────────────────────────────
# ONBOARDING ASSET ASSIGNMENT  – links onboarding records to REAL assets
# ─────────────────────────────────────────────
class OnboardingAssetAssignment(db.Model):
    __tablename__ = 'onboarding_asset_assignments'

    id              = db.Column(db.Integer, primary_key=True)
    onboarding_id   = db.Column(db.Integer, db.ForeignKey('onboarding.id'), nullable=False)

    # Real link into the existing assets table — this is what keeps inventory in sync
    asset_id        = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    asset_name      = db.Column(db.String(150))   # denormalized snapshot for fast display
    asset_serial    = db.Column(db.String(100))   # denormalized snapshot for fast display
    asset_category  = db.Column(db.String(100))   # denormalized snapshot for fast display

    assigned_at     = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':             self.id,
            'onboarding_id':  self.onboarding_id,
            'asset_id':       self.asset_id,
            'asset_name':     self.asset_name or '',
            'asset_serial':   self.asset_serial or '',
            'asset_category': self.asset_category or '',
            'assigned_at':    self.assigned_at.isoformat() if self.assigned_at else '',
        }

    def __repr__(self):
        return f'<OnboardingAssetAssignment onboarding={self.onboarding_id} asset={self.asset_id}>'
