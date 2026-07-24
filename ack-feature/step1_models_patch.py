"""
Run this script from your project root:
  python3 step1_models_patch.py
"""

with open('models.py', 'r') as f:
    content = f.read()

# ── 1. Add imports ────────────────────────────────────────────────────────────
old_import = "from datetime import datetime"
new_import  = "from datetime import datetime\nimport secrets, hashlib"
if old_import in content and 'import secrets' not in content:
    content = content.replace(old_import, new_import)
    print("✅ imports updated")

# ── 2. Add EmailConfig model after ActivityLog ────────────────────────────────
email_config_model = '''

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
'''

if 'class EmailConfig' not in content:
    content = content + email_config_model
    print("✅ EmailConfig model added")

# ── 3. Add ack fields to Asset ────────────────────────────────────────────────
old_status = "    status               = db.Column(db.String(30), default='Available')"
new_status  = """    # Acknowledgment tracking
    ack_status       = db.Column(db.String(20), default='Not Sent')
    ack_token        = db.Column(db.String(100), unique=True, nullable=True)
    ack_sent_at      = db.Column(db.DateTime,   nullable=True)
    ack_expires_at   = db.Column(db.DateTime,   nullable=True)
    ack_received_at  = db.Column(db.DateTime,   nullable=True)
    ack_sent_by      = db.Column(db.String(80), nullable=True)

    status               = db.Column(db.String(30), default='Available')"""

if old_status in content and 'ack_status' not in content:
    content = content.replace(old_status, new_status)
    print("✅ ack fields added to Asset")

# ── 4. Update to_dict ─────────────────────────────────────────────────────────
old_dict_end = "            'testing_status':  self.testing_status or '',\n        }"
new_dict_end  = """            'testing_status':  self.testing_status or '',
            'ack_status':      self.ack_status or 'Not Sent',
            'ack_sent_at':     self.ack_sent_at.isoformat() if self.ack_sent_at else '',
            'ack_received_at': self.ack_received_at.isoformat() if self.ack_received_at else '',
            'ack_expires_at':  self.ack_expires_at.isoformat() if self.ack_expires_at else '',
            'ack_sent_by':     self.ack_sent_by or '',
        }"""

if old_dict_end in content:
    content = content.replace(old_dict_end, new_dict_end)
    print("✅ to_dict updated")

with open('models.py', 'w') as f:
    f.write(content)

print("\n✅ models.py fully updated!")
