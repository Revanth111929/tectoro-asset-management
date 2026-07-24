"""
Run this script from your project root:
  python3 step3_routes_patch.py
"""

ACK_ROUTES = '''

# ═══════════════════════════════════════════════════════════════════════════════
# ACKNOWLEDGMENT & EMAIL CONFIG ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

# ── Send acknowledgment email ─────────────────────────────────────────────────
@api_bp.route('/assets/<int:asset_id>/send-ack-email', methods=['POST'])
def send_ack_email(asset_id):
    from email_service import send_acknowledgment_email
    asset = Asset.query.get_or_404(asset_id)

    if not asset.employee_email:
        return jsonify({'success': False, 'error': 'No employee email on this asset'}), 400
    if asset.ack_status == 'Acknowledged':
        return jsonify({'success': False, 'error': 'Asset already acknowledged'}), 400

    # Resolve sender name from Bearer token
    auth_header  = request.headers.get('Authorization', '')
    token_val    = auth_header.replace('Bearer ', '')
    assigned_by  = 'IT Admin'
    if token_val.startswith('user-'):
        parts = token_val.split('-')
        if len(parts) >= 3:
            assigned_by = parts[2]

    base_url = request.host_url.rstrip('/')
    # Prefer env var for production
    import os
    base_url = os.environ.get('APP_BASE_URL', base_url)

    success, error = send_acknowledgment_email(asset, assigned_by, base_url)
    if success:
        log_activity('EMAIL', 'Asset',
                     f'Ack email sent to {asset.employee_email} for {asset.asset_name}')
        return jsonify({'success': True,
                        'message': f'Acknowledgment email sent to {asset.employee_email}'})
    return jsonify({'success': False, 'error': error}), 500


# ── Employee clicks ack link (public, no auth) ────────────────────────────────
@api_bp.route('/acknowledge/<string:token>', methods=['GET'])
def acknowledge_asset(token):
    from email_service import get_ack_success_html
    asset = Asset.query.filter_by(ack_token=token).first()

    if not asset:
        return (\'\'\'<!DOCTYPE html><html><body
            style="font-family:Arial;text-align:center;padding:60px;background:#f1f5f9;">
            <div style="max-width:420px;margin:0 auto;background:#fff;padding:48px;
                        border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.1);">
            <h2 style="color:#dc2626;">&#10007; Invalid Link</h2>
            <p style="color:#475569;">This link is invalid or has already been used.</p>
            </div></body></html>\'\'\', 404)

    if asset.ack_status == 'Acknowledged':
        acked_on = asset.ack_received_at.strftime('%B %d, %Y at %H:%M UTC') if asset.ack_received_at else '—'
        return (f\'\'\'<!DOCTYPE html><html><body
            style="font-family:Arial;text-align:center;padding:60px;background:#f1f5f9;">
            <div style="max-width:420px;margin:0 auto;background:#fff;padding:48px;
                        border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.1);">
            <h2 style="color:#2563eb;">Already Acknowledged</h2>
            <p style="color:#475569;">You confirmed receipt of
               <strong>{asset.asset_name}</strong> on {acked_on}.</p>
            </div></body></html>\'\'\')

    now = datetime.utcnow()
    if asset.ack_expires_at and now > asset.ack_expires_at:
        return (\'\'\'<!DOCTYPE html><html><body
            style="font-family:Arial;text-align:center;padding:60px;background:#f1f5f9;">
            <div style="max-width:420px;margin:0 auto;background:#fff;padding:48px;
                        border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.1);">
            <h2 style="color:#f59e0b;">&#9888; Link Expired</h2>
            <p style="color:#475569;">Please contact IT support to resend the acknowledgment.</p>
            </div></body></html>\'\'\', 410)

    asset.ack_status     = 'Acknowledged'
    asset.ack_received_at = now
    asset.ack_token      = None
    db.session.commit()

    log_activity('ACKNOWLEDGE', 'Asset',
                 f'{asset.employee_name} acknowledged {asset.asset_name} (SN:{asset.serial_number})')
    return get_ack_success_html(asset)


# ── Get ack status ────────────────────────────────────────────────────────────
@api_bp.route('/assets/<int:asset_id>/ack-status', methods=['GET'])
def get_ack_status(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    return jsonify({
        'asset_id':        asset.id,
        'ack_status':      asset.ack_status or 'Not Sent',
        'ack_sent_at':     asset.ack_sent_at.isoformat() if asset.ack_sent_at else None,
        'ack_received_at': asset.ack_received_at.isoformat() if asset.ack_received_at else None,
        'ack_expires_at':  asset.ack_expires_at.isoformat() if asset.ack_expires_at else None,
        'ack_sent_by':     asset.ack_sent_by or '',
    })


# ── Email Config CRUD ─────────────────────────────────────────────────────────
@api_bp.route('/email-config', methods=['GET'])
def get_email_config():
    from models import EmailConfig
    cfg = EmailConfig.query.filter_by(is_active=True).order_by(EmailConfig.id.desc()).first()
    if not cfg:
        return jsonify({'configured': False})
    return jsonify({'configured': True, 'config': cfg.to_dict()})


@api_bp.route('/email-config', methods=['POST'])
def save_email_config():
    from models import EmailConfig
    from email_service import encrypt_password
    data = request.get_json() or {}

    required = ['sender_email', 'sender_name', 'smtp_server', 'smtp_port',
                 'smtp_username', 'smtp_password']
    for field in required:
        if not data.get(field):
            return jsonify({'success': False, 'error': f'{field} is required'}), 400

    # Deactivate old configs
    EmailConfig.query.update({'is_active': False})

    cfg = EmailConfig(
        sender_email      = data['sender_email'].strip(),
        sender_name       = data.get('sender_name', 'IT Asset Management').strip(),
        smtp_server       = data.get('smtp_server', 'smtp.office365.com').strip(),
        smtp_port         = int(data.get('smtp_port', 587)),
        smtp_username     = data['smtp_username'].strip(),
        smtp_password_enc = encrypt_password(data['smtp_password']),
        use_tls           = bool(data.get('use_tls', True)),
        is_active         = True,
        created_by        = data.get('created_by', 'admin'),
    )
    db.session.add(cfg)
    db.session.commit()

    log_activity('UPDATE', 'EmailConfig',
                 f'Email config updated by admin — sender: {cfg.sender_email}')
    return jsonify({'success': True, 'config': cfg.to_dict()})


@api_bp.route('/email-config/test', methods=['POST'])
def test_email_config():
    from email_service import test_smtp_config
    data = request.get_json() or {}
    required = ['smtp_server', 'smtp_port', 'smtp_username', 'smtp_password',
                 'sender_email', 'test_recipient']
    for field in required:
        if not data.get(field):
            return jsonify({'success': False, 'error': f'{field} is required'}), 400

    success, error = test_smtp_config(
        smtp_server    = data['smtp_server'],
        smtp_port      = int(data['smtp_port']),
        smtp_username  = data['smtp_username'],
        plain_password = data['smtp_password'],
        use_tls        = bool(data.get('use_tls', True)),
        sender_email   = data['sender_email'],
        test_recipient = data['test_recipient'],
    )

    if success:
        # Update test timestamp if a config exists
        from models import EmailConfig
        cfg = EmailConfig.query.filter_by(is_active=True).first()
        if cfg:
            cfg.last_tested_at   = datetime.utcnow()
            cfg.last_test_status = 'success'
            db.session.commit()
        return jsonify({'success': True, 'message': f'Test email sent to {data["test_recipient"]}'})

    # Record failure
    from models import EmailConfig
    cfg = EmailConfig.query.filter_by(is_active=True).first()
    if cfg:
        cfg.last_tested_at   = datetime.utcnow()
        cfg.last_test_status = 'failed'
        db.session.commit()
    return jsonify({'success': False, 'error': error}), 500
'''

with open('routes.py', 'r') as f:
    content = f.read()

if '# ACKNOWLEDGMENT & EMAIL CONFIG ROUTES' not in content:
    content = content + ACK_ROUTES
    with open('routes.py', 'w') as f:
        f.write(content)
    print("✅ routes.py updated — ack + email config endpoints added")
else:
    print("⚠️  Routes already present — skipping")
