# Office 365 Email - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Enable SMTP AUTH in Office 365

1. Go to: https://admin.exchange.microsoft.com
2. Navigate to: **Settings → Mail flow → Authentication**
3. Enable **"SMTP AUTH"** for your account
4. Wait 5 minutes for changes to apply

---

### Step 2: Test Your Office 365 Email

Run the test script:

```bash
cd /home/administrator/Desktop/asset-management
python3 test_office365_email.py
```

Enter when prompted:
- **Sender Email**: yourname@company.com
- **Password**: Your Office 365 password (or App Password if MFA is enabled)
- **Test Recipient**: any email address to test

---

### Step 3: Configure in Web Interface

1. **Login**: http://192.168.20.180:3000
2. **Go to**: Settings (⚙️ icon) → Email Config
3. **Enter settings**:

```
Sender Name:       IT Department
Sender Email:      yourname@company.com
SMTP Server:       smtp.office365.com
SMTP Port:         587
SMTP Username:     yourname@company.com
SMTP Password:     [your password]
Use TLS:          ✓ (checked)
```

4. **Click**: "Test Connection"
5. **Click**: "Save Email Config"

---

## 📧 Office 365 SMTP Settings

| Setting | Value |
|---------|-------|
| **SMTP Server** | `smtp.office365.com` |
| **Port** | `587` |
| **Encryption** | TLS |
| **Username** | Full email (e.g., name@company.com) |
| **Password** | Office 365 password or App Password |

---

## 🔐 If MFA/2FA is Enabled

Create an App Password:

1. Go to: https://mysignins.microsoft.com/security-info
2. Click: **Add sign-in method** → **App password**
3. Name it: "IT Asset Management"
4. **Copy** the generated password (16 characters)
5. Use this password instead of your regular password

---

## ✅ Done!

Now you can:
- Send acknowledgment emails from Office 365
- Users will receive emails at their company email addresses
- All emails will come from your Office 365 account

---

## 🆘 Troubleshooting

**Authentication Failed?**
- Enable SMTP AUTH in Exchange Admin Center
- Wait 5-10 minutes after enabling
- Use App Password if MFA is enabled
- Use full email address as username

**Can't Connect?**
- Check firewall allows port 587
- Test: `telnet smtp.office365.com 587`
- Try from different network

**Still Issues?**
- Read full guide: `OFFICE365_SMTP_SETUP.md`
- Check Exchange message trace logs
- Contact Microsoft Support

---

**Ready to send Office 365 emails!** 🎉
