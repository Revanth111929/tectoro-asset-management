#!/usr/bin/env python3
"""
Quick Office 365 SMTP Test Script
Tests email sending with Microsoft 365 / Office 365 account
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def test_office365_smtp():
    print("=" * 70)
    print("Office 365 / Microsoft 365 SMTP Test")
    print("=" * 70)
    print()
    
    # Get configuration from user
    print("📧 Enter your Office 365 SMTP settings:")
    print()
    
    sender_email = input("Sender Email (e.g., yourname@company.com): ").strip()
    smtp_password = input("Password (or App Password if MFA enabled): ").strip()
    recipient = input("Test Recipient Email: ").strip()
    
    if not sender_email or not smtp_password or not recipient:
        print("❌ All fields are required!")
        return
    
    print()
    print("⚙️ Configuration:")
    print(f"   SMTP Server: smtp.office365.com")
    print(f"   Port: 587")
    print(f"   Encryption: TLS (STARTTLS)")
    print(f"   Username: {sender_email}")
    print(f"   Sender: {sender_email}")
    print(f"   Recipient: {recipient}")
    print()
    
    # Create test message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'IT Asset Management System - Office 365 Test'
    msg['From'] = f"IT Asset Management <{sender_email}>"
    msg['To'] = recipient
    
    html = """
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #f8fafc; 
                    padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h2 style="color: #2563eb; margin-top: 0;">✅ Office 365 SMTP Test Successful!</h2>
            
            <p style="color: #475569; line-height: 1.6;">
                This is a test email from your IT Asset Management System.
                Office 365 SMTP configuration is working correctly!
            </p>
            
            <div style="background: #fff; padding: 20px; border-radius: 8px; 
                        border: 1px solid #e2e8f0; margin: 20px 0;">
                <h3 style="color: #1e293b; margin-top: 0;">Configuration Details:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">SMTP Server:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">smtp.office365.com</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Port:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">587 (TLS)</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Sender:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">""" + sender_email + """</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">Status:</td>
                        <td style="padding: 8px 0; color: #16a34a; font-weight: 600;">✓ Connected & Authenticated</td>
                    </tr>
                </table>
            </div>
            
            <div style="background: #dcfce7; border: 1px solid #86efac; 
                        padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #166534; font-weight: 600;">
                    ✓ Your Office 365 email configuration is ready!
                </p>
                <p style="margin: 8px 0 0 0; color: #166534; font-size: 14px;">
                    You can now send asset acknowledgment emails to users.
                </p>
            </div>
            
            <p style="color: #94a3b8; font-size: 12px; margin: 20px 0 0 0;">
                This is an automated test message from IT Asset Management System.
            </p>
        </div>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    
    # Try sending
    print("📤 Connecting to Office 365 SMTP server...")
    try:
        with smtplib.SMTP('smtp.office365.com', 587, timeout=15) as server:
            print("   ✓ Connected to smtp.office365.com:587")
            
            server.ehlo()
            print("   ✓ EHLO successful")
            
            server.starttls()
            print("   ✓ TLS encryption enabled")
            
            server.ehlo()
            
            print("   🔐 Authenticating...")
            server.login(sender_email, smtp_password)
            print("   ✓ Authentication successful")
            
            print("   📧 Sending test email...")
            server.sendmail(sender_email, [recipient], msg.as_string())
            print("   ✓ Email sent!")
        
        print()
        print("=" * 70)
        print("✅ SUCCESS! Office 365 SMTP is working correctly!")
        print("=" * 70)
        print()
        print("Next steps:")
        print("1. Check the recipient's inbox for the test email")
        print("2. Go to Settings → Email Config in the web interface")
        print("3. Enter these settings and click 'Save Email Config'")
        print()
        print("Settings to use:")
        print(f"   Sender Email:    {sender_email}")
        print(f"   SMTP Server:     smtp.office365.com")
        print(f"   SMTP Port:       587")
        print(f"   SMTP Username:   {sender_email}")
        print(f"   SMTP Password:   [your password]")
        print(f"   Use TLS:         ✓ (checked)")
        print()
        
    except smtplib.SMTPAuthenticationError as e:
        print()
        print("=" * 70)
        print("❌ AUTHENTICATION FAILED")
        print("=" * 70)
        print()
        print("Possible causes:")
        print("1. Wrong password or username")
        print("2. SMTP AUTH not enabled in Office 365")
        print("3. If MFA/2FA is enabled, you need an App Password")
        print()
        print("Solutions:")
        print("1. Enable SMTP AUTH in Exchange Admin Center:")
        print("   → https://admin.exchange.microsoft.com")
        print("   → Settings → Mail flow → Authentication")
        print()
        print("2. If MFA is enabled, create an App Password:")
        print("   → https://mysignins.microsoft.com/security-info")
        print("   → Add sign-in method → App password")
        print()
        print("3. Use your FULL email address as username")
        print(f"   (not just the part before @)")
        print()
        print("4. Wait 5-10 minutes after enabling SMTP AUTH")
        print()
        print(f"Error details: {e}")
        print()
        
    except smtplib.SMTPConnectError as e:
        print()
        print("=" * 70)
        print("❌ CONNECTION FAILED")
        print("=" * 70)
        print()
        print("Cannot connect to smtp.office365.com:587")
        print()
        print("Possible causes:")
        print("1. Firewall blocking port 587")
        print("2. Network connectivity issue")
        print("3. Office 365 service issue")
        print()
        print("Solutions:")
        print("1. Test connection:")
        print("   telnet smtp.office365.com 587")
        print()
        print("2. Check firewall settings")
        print("3. Try from a different network")
        print()
        print(f"Error details: {e}")
        print()
        
    except Exception as e:
        print()
        print("=" * 70)
        print("❌ ERROR")
        print("=" * 70)
        print()
        print(f"Error: {e}")
        print()
        print("Please check:")
        print("1. Your internet connection")
        print("2. Email settings are correct")
        print("3. Office 365 SMTP is enabled for your account")
        print()

if __name__ == '__main__':
    test_office365_smtp()
