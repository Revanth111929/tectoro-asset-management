# email_service.py - Email notification service
from flask_mail import Mail, Message
from flask import current_app
import os

mail = Mail()

def init_mail(app):
    """Initialize Flask-Mail with app config"""
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', '')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', '')
    app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@company.com')
    mail.init_app(app)

def send_asset_assignment_email(employee_email, employee_name, asset_name, serial_number):
    """Send email notification when asset is assigned"""
    if not employee_email or not current_app.config.get('MAIL_USERNAME'):
        return False
    
    try:
        msg = Message(
            subject='Asset Assignment Notification',
            recipients=[employee_email],
            html=f'''
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #2563eb;">Asset Assignment Acknowledgment</h2>
                <p>Dear {employee_name},</p>
                <p>This is to acknowledge that the following asset has been assigned to you:</p>
                <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Asset Name:</strong> {asset_name}</p>
                    <p><strong>Serial Number:</strong> {serial_number}</p>
                    <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d')}</p>
                </div>
                <p>Please take good care of this asset and report any issues immediately.</p>
                <p style="color: #64748b; font-size: 12px; margin-top: 30px;">
                    This is an automated message from IT Asset Management System.
                </p>
            </body>
            </html>
            '''
        )
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Email send failed: {str(e)}")
        return False
