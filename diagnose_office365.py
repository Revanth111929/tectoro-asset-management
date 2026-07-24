#!/usr/bin/env python3
"""
Office 365 SMTP Diagnostic Tool
Tests various authentication scenarios
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def test_connection(username, password, test_recipient):
    print("=" * 80)
    print("Office 365 SMTP Diagnostic Test")
    print("=" * 80)
    print()
    print(f"Testing with:")
    print(f"  Server: smtp.office365.com:587")
    print(f"  Username: {username}")
    print(f"  Password: {'*' * len(password)}")
    print(f"  Test Recipient: {test_recipient}")
    print()
    
    # Create test message
    msg = MIMEMultipart()
    msg['Subject'] = 'Office 365 SMTP Test'
    msg['From'] = username
    msg['To'] = test_recipient
    msg.attach(MIMEText('This is a test email from Office 365 SMTP.', 'plain'))
    
    print("📡 Step 1: Connecting to smtp.office365.com:587...")
    try:
        server = smtplib.SMTP('smtp.office365.com', 587, timeout=20)
        print("   ✅ Connected successfully")
    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
        return False
    
    try:
        print("\n📡 Step 2: Sending EHLO...")
        server.ehlo()
        print("   ✅ EHLO successful")
        
        print("\n📡 Step 3: Starting TLS encryption...")
        server.starttls()
        print("   ✅ TLS started successfully")
        
        print("\n📡 Step 4: Sending EHLO again (after TLS)...")
        server.ehlo()
        print("   ✅ EHLO successful")
        
        print("\n🔐 Step 5: Attempting authentication...")
        print(f"   Username: {username}")
        print(f"   Password length: {len(password)} characters")
        
        try:
            server.login(username, password)
            print("   ✅ Authentication SUCCESSFUL!")
            
            print("\n📧 Step 6: Sending test email...")
            server.sendmail(username, [test_recipient], msg.as_string())
            print("   ✅ Email sent successfully!")
            
            server.quit()
            
            print("\n" + "=" * 80)
            print("✅ ALL TESTS PASSED!")
            print("=" * 80)
            print("\nYour Office 365 SMTP is working correctly!")
            print("The settings in the web interface should work now.")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            print(f"   ❌ Authentication FAILED: {e}")
            print("\n" + "=" * 80)
            print("❌ AUTHENTICATION ERROR")
            print("=" * 80)
            print("\nPossible causes:")
            print("1. ❌ Wrong password")
            print("2. ❌ SMTP AUTH not enabled for your account")
            print("3. ❌ Security defaults blocking SMTP AUTH")
            print("4. ❌ Conditional access policies blocking authentication")
            print("\nSolutions to try:")
            print("\n▶ Solution 1: Check if SMTP AUTH is enabled")
            print("   Ask your IT admin to run this PowerShell command:")
            print(f"   Set-CASMailbox -Identity {username} -SmtpClientAuthenticationDisabled $false")
            print("\n▶ Solution 2: Verify the password")
            print("   - Try logging into https://outlook.office.com with the same password")
            print("   - If that works, the password is correct")
            print("\n▶ Solution 3: Check organization settings")
            print("   - SMTP AUTH might be disabled organization-wide")
            print("   - Admin needs to enable it in Exchange Online")
            print("\n▶ Solution 4: Try different authentication")
            print("   - App Passwords might not work for SMTP")
            print("   - Try your REGULAR Office 365 password instead")
            
            server.quit()
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        try:
            server.quit()
        except:
            pass
        return False

def main():
    print("\n🔧 Office 365 SMTP Diagnostic Tool\n")
    
    username = input("Enter your Office 365 email (e.g., name@tectoro.com): ").strip()
    if not username:
        print("❌ Email is required!")
        return
    
    print("\n⚠️  Password Input:")
    print("   - If you created an App Password, enter it here")
    print("   - Otherwise, enter your regular Office 365 password")
    print()
    
    password = input("Enter password (App Password or regular): ").strip()
    if not password:
        print("❌ Password is required!")
        return
    
    test_recipient = input("Enter test recipient email: ").strip()
    if not test_recipient:
        print("❌ Test recipient is required!")
        return
    
    print()
    test_connection(username, password, test_recipient)

if __name__ == '__main__':
    main()
