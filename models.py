# models.py
# Defines all database tables using SQLAlchemy ORM.
# Each class = one table in the SQLite database.

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

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
    emp_id               = db.Column(db.String(50))

    # 3. EMPLOYEE NAME
    employee_name        = db.Column(db.String(150))

    # 4. MOBILE NUMBER
    mobile_number        = db.Column(db.String(30))

    # 4b. EMPLOYEE EMAIL
    employee_email       = db.Column(db.String(150))

    # 5. Asset NAME
    asset_name           = db.Column(db.String(150), nullable=False)

    # 6. CATEGORY  (Laptop / Desktop / Monitor / etc.)
    category             = db.Column(db.String(100))

    # 7. SERIAL NUMBER  – unique hardware identifier
    serial_number        = db.Column(db.String(100), unique=True, nullable=False)

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

    # Extra operational fields
    status               = db.Column(db.String(30), default='Available')  # Available / Assigned / Maintenance / Retired
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
        }


# ─────────────────────────────────────────────
# ACTIVITY LOG TABLE  – audit trail
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
