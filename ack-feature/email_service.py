# email_service.py
# Production-grade email service using admin-configured SMTP settings.
# Supports Outlook / Microsoft 365 / Gmail / any SMTP provider.

import os, secrets, base64, smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from cryptography.fernet import Fernet


# ── Encryption helpers ────────────────────────────────────────────────────────
def _get_fernet():
    key = os.environ.get('EMAIL_ENCRYPT_KEY')
    if not key:
        # Derive a stable key from SECRET_KEY if EMAIL_ENCRYPT_KEY not set
        import hashlib, base64
        sk = os.environ.get('SECRET_KEY', 'assetmgmt-super-secret-2024')
        raw = hashlib.sha256(sk.encode()).digest()
        key = base64.urlsafe_b64encode(raw).decode()
    return Fernet(key.encode() if isinstance(key, str) else key)

def encrypt_password(plain_text: str) -> str:
    return _get_fernet().encrypt(plain_text.encode()).decode()

def decrypt_password(cipher_text: str) -> str:
    return _get_fernet().decrypt(cipher_text.encode()).decode()


# ── Config loader ─────────────────────────────────────────────────────────────
def get_active_config():
    """Return the active EmailConfig row, or None."""
    try:
        from models import EmailConfig
        return EmailConfig.query.filter_by(is_active=True).order_by(EmailConfig.id.desc()).first()
    except Exception:
        return None


# ── Low-level SMTP sender ─────────────────────────────────────────────────────
def _send_via_smtp(cfg, to_email: str, subject: str, html_body: str):
    """
    Send one email using the given EmailConfig.
    Returns (True, None) on success, (False, error_str) on failure.
    """
    try:
        password = decrypt_password(cfg.smtp_password_enc)
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From']    = f"{cfg.sender_name} <{cfg.sender_email}>"
        msg['To']      = to_email
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))

        with smtplib.SMTP(cfg.smtp_server, cfg.smtp_port, timeout=15) as server:
            server.ehlo()
            if cfg.use_tls:
                server.starttls()
                server.ehlo()
            server.login(cfg.smtp_username, password)
            server.sendmail(cfg.sender_email, [to_email], msg.as_string())
        return True, None
    except smtplib.SMTPAuthenticationError:
        return False, "SMTP authentication failed — check username/password"
    except smtplib.SMTPConnectError:
        return False, f"Cannot connect to {cfg.smtp_server}:{cfg.smtp_port}"
    except Exception as e:
        return False, str(e)


# ── Email templates ───────────────────────────────────────────────────────────
def _ack_email_html(asset, assigned_by: str, ack_link: str, expires_at: datetime) -> str:
    assigned_date = asset.date.strftime('%B %d, %Y') if asset.date else datetime.utcnow().strftime('%B %d, %Y')
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;
              box-shadow:0 4px 16px rgba(0,0,0,0.10);overflow:hidden;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:36px 40px;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">
        IT Asset Assignment
      </h1>
      <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">
        Action Required — Please acknowledge receipt of your assigned asset
      </p>
    </div>

    <!-- Body -->
    <div style="padding:36px 40px;">
      <p style="color:#1e293b;font-size:15px;margin-top:0;">
        Dear <strong>{asset.employee_name or 'Team Member'}</strong>,
      </p>
      <p style="color:#475569;line-height:1.6;">
        The IT department has assigned the following asset to you.
        Please review the details below and click the button to confirm receipt.
      </p>

      <!-- Asset details card -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;
                  padding:20px 24px;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:10px 0;color:#64748b;width:150px;">Asset ID</td>
            <td style="padding:10px 0;color:#1e293b;font-weight:600;">#{asset.id}</td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:10px 0;color:#64748b;">Asset Name</td>
            <td style="padding:10px 0;color:#1e293b;font-weight:600;">{asset.asset_name}</td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:10px 0;color:#64748b;">Asset Type</td>
            <td style="padding:10px 0;color:#1e293b;">{asset.category or '—'}</td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:10px 0;color:#64748b;">Model</td>
            <td style="padding:10px 0;color:#1e293b;">{asset.model_name or '—'}</td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:10px 0;color:#64748b;">Serial Number</td>
            <td style="padding:10px 0;color:#0f172a;font-family:monospace;font-size:13px;">
              {asset.serial_number}
            </td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:10px 0;color:#64748b;">Assigned Date</td>
            <td style="padding:10px 0;color:#1e293b;">{assigned_date}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#64748b;">Assigned By</td>
            <td style="padding:10px 0;color:#1e293b;">{assigned_by}</td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="{ack_link}"
           style="display:inline-block;background:#2563eb;color:#ffffff;padding:16px 40px;
                  border-radius:8px;text-decoration:none;font-size:16px;font-weight:700;
                  letter-spacing:0.3px;">
          ✓ &nbsp; Acknowledge Receipt
        </a>
      </div>

      <p style="color:#64748b;font-size:13px;line-height:1.6;">
        By clicking the button above, you confirm that you have received and taken
        responsibility for this asset. If you did not receive this device, please
        contact IT support immediately and do not click the button.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;">
      <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.6;">
        This link expires on <strong>{expires_at.strftime('%B %d, %Y')}</strong>.
        Do not forward this email — the acknowledgment link is unique to you.
        This is an automated message from the IT Asset Management System.
      </p>
    </div>
  </div>
</body>
</html>
"""


def _ack_success_html(asset) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Acknowledged</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <div style="max-width:500px;margin:80px auto;background:#fff;border-radius:12px;
              box-shadow:0 4px 16px rgba(0,0,0,0.10);padding:48px 40px;text-align:center;">
    <div style="width:72px;height:72px;background:#dcfce7;border-radius:50%;
                display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
      <span style="font-size:36px;line-height:1;">✓</span>
    </div>
    <h2 style="color:#16a34a;margin:0 0 12px;font-size:22px;">Acknowledged Successfully!</h2>
    <p style="color:#475569;margin:0 0 24px;">
      You have confirmed receipt of the following asset:
    </p>
    <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;text-align:left;margin-bottom:24px;">
      <p style="margin:4px 0;font-size:14px;"><strong>Asset:</strong> {asset.asset_name}</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Serial:</strong> {asset.serial_number}</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Acknowledged:</strong>
         {asset.ack_received_at.strftime('%B %d, %Y at %H:%M UTC') if asset.ack_received_at else '—'}
      </p>
    </div>
    <p style="color:#94a3b8;font-size:12px;">
      The IT team has been notified. You may safely close this page.
    </p>
  </div>
</body>
</html>
"""


# ── Public API ────────────────────────────────────────────────────────────────
def send_acknowledgment_email(asset, assigned_by: str, base_url: str):
    """
    Generate token, persist to DB, send ack email.
    Returns (True, None) or (False, error_string).
    """
    cfg = get_active_config()
    if not cfg:
        return False, "No active email configuration found. Please configure email in Settings → Email Config."

    if not asset.employee_email:
        return False, "Asset has no employee email address."

    from models import db
    token      = secrets.token_urlsafe(40)
    now        = datetime.utcnow()
    expires_at = now + timedelta(days=7)

    asset.ack_token      = token
    asset.ack_status     = 'Pending'
    asset.ack_sent_at    = now
    asset.ack_expires_at = expires_at
    asset.ack_sent_by    = assigned_by
    db.session.commit()

    ack_link = f"{base_url.rstrip('/')}/api/acknowledge/{token}"
    subject  = f"Action Required: Acknowledge Receipt of {asset.asset_name}"
    html     = _ack_email_html(asset, assigned_by, ack_link, expires_at)

    success, error = _send_via_smtp(cfg, asset.employee_email, subject, html)

    if not success:
        # Roll back token so admin can retry
        asset.ack_status     = 'Not Sent'
        asset.ack_token      = None
        asset.ack_sent_at    = None
        asset.ack_expires_at = None
        db.session.commit()

    return success, error


def test_smtp_config(smtp_server, smtp_port, smtp_username, plain_password,
                     use_tls, sender_email, test_recipient):
    """Test SMTP credentials before saving. Returns (True, None) or (False, error)."""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'IT Asset System — SMTP Test'
        msg['From']    = sender_email
        msg['To']      = test_recipient
        msg.attach(MIMEText(
            "<p>This is a test email from your IT Asset Management System. "
            "SMTP configuration is working correctly.</p>", 'html'
        ))
        with smtplib.SMTP(smtp_server, int(smtp_port), timeout=10) as server:
            server.ehlo()
            if use_tls:
                server.starttls()
                server.ehlo()
            server.login(smtp_username, plain_password)
            server.sendmail(sender_email, [test_recipient], msg.as_string())
        return True, None
    except smtplib.SMTPAuthenticationError:
        return False, "Authentication failed — check username/password"
    except smtplib.SMTPConnectError as e:
        return False, f"Cannot connect to {smtp_server}:{smtp_port} — {e}"
    except Exception as e:
        return False, str(e)


def get_ack_success_html(asset):
    return _ack_success_html(asset)
