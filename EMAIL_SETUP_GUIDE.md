# Email Acknowledgment Setup Guide

## Current Status
✅ **Employee Email field added** to View page
❌ **Email notifications not configured** - Need to set up SMTP

---

## What Was Fixed

### 1. AssetView.js (View Page)
Added **Employee Email** field to the Employee Information section.

**Now displays**:
- EMP ID
- Employee Name
- **Employee Email** ← NEW
- Mobile Number

---

## Email Notification Setup

### How Email Acknowledgment Works

When you assign an asset to an employee:
1. Fill in employee details including email
2. Save the asset
3. System automatically sends email to employee
4. Email contains:
   - Asset name
   - Serial number
   - Assignment date
   - Acknowledgment message

### Current Issue
Email notifications are **not configured** because:
- No `.env` file with SMTP credentials
- Email service needs SMTP server details

---

## Setup Instructions

### Option 1: Gmail SMTP (Recommended for Testing)

#### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** → **2-Step Verification**
3. Follow steps to enable 2FA

#### Step 2: Create App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
4. Enter name: **Asset Management**
5. Click **Generate**
6. **Copy the 16-character password** (you'll need this)

#### Step 3: Create .env File
```bash
cd /home/administrator/Desktop/asset-management
nano .env
```

#### Step 4: Add Configuration
```env
# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com
```

**Replace**:
- `your-email@gmail.com` with your Gmail address
- `your-16-char-app-password` with the app password from Step 2

#### Step 5: Save and Exit
- Press `Ctrl + O` to save
- Press `Enter` to confirm
- Press `Ctrl + X` to exit

#### Step 6: Restart Backend
```bash
# Kill existing process
kill $(lsof -t -i:5000)

# Start backend
source venv/bin/activate
python3 app.py
```

---

### Option 2: Office 365 / Outlook SMTP

```env
MAIL_SERVER=smtp.office365.com
MAIL_PORT=587
MAIL_USERNAME=your-email@company.com
MAIL_PASSWORD=your-password
MAIL_DEFAULT_SENDER=your-email@company.com
```

---

### Option 3: Custom SMTP Server

```env
MAIL_SERVER=smtp.yourcompany.com
MAIL_PORT=587
MAIL_USERNAME=your-email@yourcompany.com
MAIL_PASSWORD=your-password
MAIL_DEFAULT_SENDER=noreply@yourcompany.com
```

---

## Testing Email Functionality

### Test 1: Assign Asset with Email

1. **Add/Edit an asset**
   - Go to Assets → Add Asset (Existing Device tab)
   - OR Edit an existing asset

2. **Fill employee details**:
   ```
   EMP ID: EMP001
   Employee Name: Test User
   Employee Email: your-test-email@gmail.com
   Mobile Number: 9876543210
   ```

3. **Fill asset details** and save

4. **Check email**:
   - Check inbox of the email you entered
   - Look for: "Asset Assignment Notification"
   - Check spam folder if not in inbox

### Test 2: Check Backend Logs

When you save an asset with email, check terminal for:
```
✓ Email sent successfully to: user@example.com
```

OR

```
❌ Email send failed: [error message]
```

---

## Email Template

The system sends this email:

```
Subject: Asset Assignment Notification

Dear [Employee Name],

This is to acknowledge that the following asset has been assigned to you:

Asset Name: Dell Laptop XPS 15
Serial Number: SN-DELL-001
Date: 2026-05-26

Please take good care of this asset and report any issues immediately.

---
This is an automated message from IT Asset Management System.
```

---

## Troubleshooting

### Issue 1: "Email send failed: Authentication failed"
**Solution**: 
- Check MAIL_USERNAME and MAIL_PASSWORD are correct
- For Gmail: Make sure you're using App Password, not regular password
- Verify 2FA is enabled

### Issue 2: "Email send failed: Connection refused"
**Solution**:
- Check MAIL_SERVER and MAIL_PORT are correct
- Verify firewall allows outgoing connections on port 587
- Try port 465 with SSL instead of TLS

### Issue 3: Email not received
**Solution**:
- Check spam/junk folder
- Verify recipient email is correct
- Check backend logs for errors
- Test with a different email address

### Issue 4: "No .env file found"
**Solution**:
- Create .env file in project root
- Copy from .env.example
- Fill in your SMTP credentials

---

## Quick Setup Script

Run this to create .env file quickly:

```bash
cd /home/administrator/Desktop/asset-management

cat > .env << 'EOF'
# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password-here
MAIL_DEFAULT_SENDER=your-email@gmail.com
EOF

echo "✓ .env file created"
echo "Now edit it with your credentials:"
echo "nano .env"
```

Then edit with your actual credentials:
```bash
nano .env
```

---

## Security Notes

1. **Never commit .env file to Git**
   - Already in .gitignore
   - Contains sensitive passwords

2. **Use App Passwords**
   - Don't use your main Gmail password
   - Create app-specific passwords

3. **Restrict Access**
   - Keep .env file permissions restricted
   ```bash
   chmod 600 .env
   ```

4. **Production Setup**
   - Use company SMTP server
   - Use dedicated email account
   - Enable email logging

---

## Alternative: Disable Email Notifications

If you don't want email notifications:

1. **Leave .env file empty** or don't create it
2. System will work normally without sending emails
3. No errors will be shown
4. Assets can still be assigned

The email feature is **optional** - the system works fine without it.

---

## Verification Checklist

After setup, verify:

- [ ] .env file created in project root
- [ ] SMTP credentials filled in
- [ ] Backend restarted
- [ ] Test email sent successfully
- [ ] Email received in inbox
- [ ] Employee email field visible in:
  - [ ] Add Asset page (Existing Device tab)
  - [ ] Edit Asset page
  - [ ] View Asset page

---

## Current Files

### Backend
- ✅ `email_service.py` - Email sending logic
- ✅ `app.py` - Initializes email service
- ❌ `.env` - **NEEDS TO BE CREATED**

### Frontend
- ✅ `AssetAdd.js` - Has email field
- ✅ `AssetEdit.js` - Has email field
- ✅ `AssetView.js` - **JUST UPDATED** - Now shows email

---

## Summary

**What's Working**:
✅ Employee email field in all forms
✅ Email field saved to database
✅ Email field displayed in view page
✅ Email service code ready

**What's Missing**:
❌ SMTP configuration (.env file)

**To Enable Emails**:
1. Create .env file
2. Add Gmail/SMTP credentials
3. Restart backend
4. Test by assigning asset

**Without Email Setup**:
- System works normally
- No emails sent
- No errors shown
- All other features work

---

**The employee email field is now visible in the View page!**
**To enable email notifications, follow the setup instructions above.**
