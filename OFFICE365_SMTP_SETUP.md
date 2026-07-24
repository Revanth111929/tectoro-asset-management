# Microsoft 365 / Office 365 SMTP Setup Guide

**Date**: June 15, 2026  
**Purpose**: Configure Office 365 email for sending asset acknowledgment emails

---

## 📋 Prerequisites

✅ Microsoft 365 / Office 365 account (e.g., yourname@yourcompany.com)  
✅ Admin access to your Office 365 account  
✅ SMTP authentication enabled in your organization

---

## 🔐 Step 1: Enable SMTP AUTH in Office 365

### Option A: Enable for Your Account (User Level)

1. **Go to Microsoft 365 Admin Center**:
   - Visit: https://admin.microsoft.com
   - Sign in with your admin account

2. **Navigate to User Settings**:
   - Go to **Users** → **Active users**
   - Click on your user account
   - Click **Mail** tab
   - Click **Manage email apps**

3. **Enable Authenticated SMTP**:
   - Check the box for **"Authenticated SMTP"**
   - Click **Save changes**

### Option B: Enable for Organization (Admin Level)

1. **Go to Exchange Admin Center**:
   - Visit: https://admin.exchange.microsoft.com
   - Or from Admin Center: **Admin centers** → **Exchange**

2. **Enable SMTP AUTH**:
   - Go to **Settings** → **Mail flow** → **Authentication**
   - Enable **"SMTP AUTH"** for the organization or specific users

3. **Wait 5-10 minutes** for changes to propagate

---

## 📧 Step 2: Get Your Office 365 SMTP Credentials

### Required Information:

| Setting | Value |
|---------|-------|
| **SMTP Server** | `smtp.office365.com` |
| **SMTP Port** | `587` |
| **Encryption** | TLS (STARTTLS) |
| **Username** | Your full Office 365 email (e.g., `yourname@yourcompany.com`) |
| **Password** | Your Office 365 account password |

### Important Notes:

- ✅ Use your **full email address** as username (not just "yourname")
- ✅ Use your **regular Office 365 password** (App Password not needed for Office 365)
- ✅ If MFA is enabled, see Step 3 below

---

## 🔐 Step 3: If Multi-Factor Authentication (MFA) is Enabled

If your Office 365 account has MFA/2FA enabled, you need to create an App Password:

1. **Go to Security Settings**:
   - Visit: https://mysignins.microsoft.com/security-info
   - Or: https://account.microsoft.com/security

2. **Create App Password**:
   - Click **Add sign-in method**
   - Select **App password**
   - Click **Add**
   - Enter a name: "IT Asset Management System"
   - Click **Next**

3. **Copy the Generated Password**:
   - You'll see a 16-character password like: `abcd-efgh-ijkl-mnop`
   - **Copy it immediately** (you won't be able to see it again)
   - Use this password instead of your regular password

---

## ⚙️ Step 4: Configure in Asset Management System

### Option A: Using the Web Interface (Recommended)

1. **Login to Asset Management System**:
   - Go to: http://192.168.20.180:3000
   - Click **Settings** (gear icon in sidebar)

2. **Go to Email Configuration**:
   - Click **Email Config** tab

3. **Enter Office 365 Settings**:
   ```
   Sender Name:       IT Department
   Sender Email:      yourname@yourcompany.com
   SMTP Server:       smtp.office365.com
   SMTP Port:         587
   SMTP Username:     yourname@yourcompany.com
   SMTP Password:     [Your password or app password]
   Use TLS:          ✓ (checked)
   ```

4. **Test Configuration**:
   - Enter a test recipient email
   - Click **Test Connection**
   - You should see "✅ Test email sent successfully!"

5. **Save Configuration**:
   - Click **Save Email Config**

---

### Option B: Using Environment Variables

Create or update `.env` file:

```bash
# Office 365 SMTP Configuration
SMTP_SERVER=smtp.office365.com
SMTP_PORT=587
SMTP_USERNAME=yourname@yourcompany.com
SMTP_PASSWORD=your_password_or_app_password_here
SMTP_USE_TLS=True
SENDER_EMAIL=yourname@yourcompany.com
SENDER_NAME=IT Department
```

Then restart the backend:
```bash
bash restart_backend.sh
```

---

## 🧪 Step 5: Test Email Sending

### Quick Test from Terminal:

```bash
cd /home/administrator/Desktop/asset-management
python3 -c "
from email_service import test_smtp_config

success, error = test_smtp_config(
    smtp_server='smtp.office365.com',
    smtp_port=587,
    smtp_username='yourname@yourcompany.com',
    plain_password='your_password_here',
    use_tls=True,
    sender_email='yourname@yourcompany.com',
    test_recipient='recipient@company.com'
)

if success:
    print('✅ Email sent successfully!')
else:
    print(f'❌ Error: {error}')
"
```

Replace:
- `yourname@yourcompany.com` with your Office 365 email
- `your_password_here` with your password or app password
- `recipient@company.com` with a test recipient

---

## 🚨 Common Issues & Solutions

### Issue 1: "Authentication Failed"
**Causes**:
- SMTP AUTH not enabled in Office 365
- Wrong username/password
- Need App Password (if MFA is enabled)

**Solutions**:
- ✅ Enable SMTP AUTH in Exchange Admin Center
- ✅ Use full email address as username
- ✅ Create and use App Password if MFA is enabled
- ✅ Wait 5-10 minutes after enabling SMTP AUTH

---

### Issue 2: "Connection Timeout"
**Causes**:
- Port 587 blocked by firewall
- Network connectivity issue

**Solutions**:
- ✅ Check firewall settings
- ✅ Try from a different network
- ✅ Verify with: `telnet smtp.office365.com 587`

---

### Issue 3: "Relay Access Denied"
**Causes**:
- Trying to send to external domains
- SMTP AUTH not properly configured

**Solutions**:
- ✅ Enable SMTP AUTH for your account
- ✅ Use authenticated SMTP (not open relay)
- ✅ Verify username matches sender email

---

### Issue 4: "Too Many Recipients" or Rate Limiting
**Office 365 Limits**:
- Max 30 messages per minute
- Max 10,000 recipients per day
- Max 500 recipients per message

**Solutions**:
- ✅ Add delays between bulk emails
- ✅ Implement retry logic with exponential backoff
- ✅ Contact Microsoft to increase limits if needed

---

## 📊 Office 365 vs Gmail Comparison

| Feature | Office 365 | Gmail |
|---------|-----------|-------|
| SMTP Server | smtp.office365.com | smtp.gmail.com |
| Port | 587 | 587 |
| Encryption | TLS | TLS |
| App Password | Only if MFA enabled | Always required |
| Daily Limit | 10,000 recipients | 500 recipients |
| Rate Limit | 30 msg/min | ~100 msg/min |

---

## ✅ Verification Checklist

After configuration, verify:

- [ ] SMTP AUTH enabled in Office 365
- [ ] Test email received successfully
- [ ] No authentication errors in logs
- [ ] Can send to internal (company) emails
- [ ] Can send to external emails (if needed)
- [ ] Acknowledgment emails working from UI

---

## 🔒 Security Best Practices

1. **Use App Passwords**:
   - Create dedicated app password for this system
   - Don't share your main account password

2. **Limit Permissions**:
   - Use a dedicated service account if possible
   - Grant minimum required permissions

3. **Monitor Usage**:
   - Check Office 365 audit logs regularly
   - Monitor for suspicious activity

4. **Rotate Credentials**:
   - Change passwords periodically
   - Revoke app passwords when not needed

---

## 📝 Example Configuration

### For Company Domain: @yourcompany.com

```
Sender Name:       IT Asset Management
Sender Email:      itassets@yourcompany.com
SMTP Server:       smtp.office365.com
SMTP Port:         587
SMTP Username:     itassets@yourcompany.com
SMTP Password:     [App Password from Step 3]
Use TLS:          ✓
```

### Test Recipients:
- Internal: employee@yourcompany.com
- External: test@gmail.com (if allowed by your org)

---

## 🆘 Need Help?

If you encounter issues:

1. **Check Exchange Online Logs**:
   - Go to Exchange Admin Center → Mail flow → Message trace

2. **Review Backend Logs**:
   ```bash
   tail -f /home/administrator/Desktop/asset-management/logs/app.log
   ```

3. **Test SMTP Connection**:
   ```bash
   telnet smtp.office365.com 587
   ```

4. **Contact Microsoft Support**:
   - If SMTP AUTH issues persist
   - For organization-level configuration help

---

## 📚 Additional Resources

- **Microsoft Docs**: https://learn.microsoft.com/en-us/exchange/mail-flow-best-practices/how-to-set-up-a-multifunction-device-or-application-to-send-email-using-microsoft-365-or-office-365
- **SMTP Settings**: https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b147-6c6c4ac95353
- **App Passwords**: https://support.microsoft.com/en-us/account-billing/manage-app-passwords-for-two-step-verification-d6dc8c6d-4bf7-4851-ad95-6d07799387e9

---

**Status**: Ready to configure ✅  
**Estimated Time**: 5-10 minutes
