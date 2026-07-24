# Office 365 Authentication Failed - Troubleshooting

**Error**: "Authentication failed - check username/password"

**Your Current Settings**:
- Sender Email: `revanth.moddelai@tectoro.com` ✅
- SMTP Server: `smtp.office365.com` ✅
- SMTP Port: `587` ✅
- TLS: Enabled ✅
- Password: App Password (you created)

---

## 🔍 Root Cause

**App Passwords might NOT work for Office 365 SMTP AUTH!**

Microsoft App Passwords are designed for:
- Older email clients (Outlook 2016, Thunderbird)
- Mobile devices
- **NOT for SMTP authentication in applications**

---

## ✅ Solution: Use Regular Password Instead

### Step 1: Try Your Regular Office 365 Password

1. **Go back to Settings → Email Config**
2. Click **"Edit Configuration"**
3. **In SMTP Password field**: Enter your **REGULAR Office 365 password**
   - NOT the App Password
   - The same password you use to login to Outlook
4. Click **"Save Email Config"**
5. Click **"Send Test"**

**This will likely work!** Most Office 365 SMTP issues are solved by using the regular password.

---

## 🔐 If Regular Password Also Fails

Then SMTP AUTH might not be enabled for your account.

### Check & Enable SMTP AUTH

You need admin access to do this. Choose one method:

---

### Method 1: Diagnostic Script (Run This First)

```bash
cd /home/administrator/Desktop/asset-management
python3 diagnose_office365.py
```

This will:
- Test the connection step-by-step
- Show exactly where it fails
- Give specific error messages
- Suggest fixes

**Enter**:
- Email: `revanth.moddelai@tectoro.com`
- Password: Your REGULAR Office 365 password (try this first)
- Test Recipient: Any email address

---

### Method 2: PowerShell Script (Admin Required)

If you have Windows and admin access:

1. **Save** `check_smtp_auth.ps1` to your Windows machine
2. **Right-click** PowerShell → Run as Administrator
3. **Run**:
   ```powershell
   cd C:\path\to\script
   .\check_smtp_auth.ps1
   ```
4. **Enter** your Office 365 admin credentials
5. **Check** if SMTP AUTH is enabled
6. **Enable** it if needed
7. **Wait** 5-10 minutes
8. **Test again**

---

### Method 3: PowerShell Commands (Quick)

If you know PowerShell:

```powershell
# Connect
Connect-ExchangeOnline

# Check status
Get-CASMailbox -Identity revanth.moddelai@tectoro.com | Format-List SmtpClientAuthenticationDisabled

# Enable SMTP AUTH
Set-CASMailbox -Identity revanth.moddelai@tectoro.com -SmtpClientAuthenticationDisabled $false

# Verify
Get-CASMailbox -Identity revanth.moddelai@tectoro.com | Format-List SmtpClientAuthenticationDisabled

# Disconnect
Disconnect-ExchangeOnline
```

**Wait 5-10 minutes** after enabling, then test again.

---

## 🎯 Quick Action Plan

### Try these in order:

1. ✅ **Use REGULAR password** (not App Password)
   - Edit config → Change password → Test

2. ✅ **Run diagnostic script**
   ```bash
   python3 diagnose_office365.py
   ```

3. ✅ **Enable SMTP AUTH** (if script says it's disabled)
   - Run PowerShell script: `check_smtp_auth.ps1`
   - Or ask IT admin to enable it

4. ✅ **Wait 5-10 minutes** after enabling

5. ✅ **Test again**

---

## 🔍 How to Verify Your Password is Correct

Before testing SMTP, verify your password works:

1. Open browser (incognito/private mode)
2. Go to: https://outlook.office.com
3. Login with:
   - Email: `revanth.moddelai@tectoro.com`
   - Password: The password you're trying to use
4. Can you login?
   - **YES** → Password is correct, issue is SMTP AUTH
   - **NO** → Password is wrong, reset it first

---

## 📊 Comparison: App Password vs Regular Password

| Feature | App Password | Regular Password |
|---------|--------------|------------------|
| Works for Email Clients | ✅ Yes | ✅ Yes |
| Works for SMTP AUTH | ❌ Usually NO | ✅ Usually YES |
| More Secure | ✅ Yes | ⚠️  Less secure |
| Recommended for Apps | ❌ No | ✅ Yes (with SMTP AUTH enabled) |

**For SMTP in applications**: Use **Regular Password** + **SMTP AUTH enabled**

---

## 🆘 Still Not Working?

### Check These:

1. **SMTP AUTH Disabled Organization-Wide**
   - Admin needs to enable it in Exchange Online
   - Security Defaults might be blocking it

2. **Conditional Access Policies**
   - Your organization might block SMTP AUTH
   - Talk to your IT admin

3. **Wrong Email Format**
   - Use: `revanth.moddelai@tectoro.com`
   - NOT: `revanth.moddelai` or `revanth`

4. **Firewall Blocking Port 587**
   - Test: `telnet smtp.office365.com 587`
   - If it fails, firewall is blocking

5. **Account Locked or Disabled**
   - Check in Microsoft 365 Admin Center
   - Make sure account is active

---

## 📝 What to Tell Your IT Admin

If you need help from IT:

> "I need SMTP AUTH enabled for my Office 365 account (revanth.moddelai@tectoro.com) 
> to send automated emails from our Asset Management System.
> 
> Can you please run this PowerShell command:
> 
> Set-CASMailbox -Identity revanth.moddelai@tectoro.com -SmtpClientAuthenticationDisabled $false
> 
> And verify with:
> 
> Get-CASMailbox -Identity revanth.moddelai@tectoro.com | Format-List SmtpClientAuthenticationDisabled
> 
> It should show: SmtpClientAuthenticationDisabled : False"

---

## ✅ Next Step

**Run this now**:

```bash
cd /home/administrator/Desktop/asset-management
python3 diagnose_office365.py
```

**Use your REGULAR Office 365 password** when it asks for password.

This will show exactly what's wrong! 🔍
