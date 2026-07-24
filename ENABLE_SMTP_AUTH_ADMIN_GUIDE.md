# Enable SMTP AUTH - Admin Guide for Microsoft 365

**Issue**: Authentication fails because SMTP AUTH is disabled by default in Microsoft 365.

**Solution**: Enable it from your admin account.

---

## 🔐 Method 1: Via Microsoft 365 Admin Center (Easiest)

### Step 1: Login as Admin

1. Go to: **https://admin.microsoft.com**
2. Sign in with your **ADMIN** account (not the regular user account)

---

### Step 2: Navigate to Active Users

1. In the left sidebar, click **Users**
2. Click **Active users**
3. Find and click on: **Revanth Moddelai** (revanth.moddelai@tectoro.com)

---

### Step 3: Enable SMTP for the User

1. In the user details page, click the **Mail** tab
2. Scroll down to **Email apps** section
3. Click **Manage email apps**
4. Make sure these are **checked** ✅:
   - **Authenticated SMTP**
   - **Exchange Web Services**
   - **IMAP**
   - **POP**
5. Click **Save changes**
6. Wait **5-10 minutes** for changes to apply

---

## 🔐 Method 2: Via Exchange Admin Center

### Step 1: Open Exchange Admin Center

1. Go to: **https://admin.exchange.microsoft.com**
2. OR from Microsoft 365 Admin Center:
   - Click **Show all** (left sidebar)
   - Click **Admin centers**
   - Click **Exchange**

---

### Step 2: Enable SMTP AUTH for User

1. Click **Recipients** in the left sidebar
2. Click **Mailboxes**
3. Find and click: **revanth.moddelai@tectoro.com**
4. Look for **Email apps** or **Mailbox settings** tab
5. Find **Authenticated SMTP** setting
6. Make sure it's **Enabled** ✅
7. Click **Save**
8. Wait **5-10 minutes**

---

## 🔐 Method 3: Via PowerShell (Most Reliable - Recommended!)

This is the **BEST** method because it's quick and definitive.

### Prerequisites:
- Windows computer
- Admin access to Microsoft 365
- PowerShell

---

### Steps:

#### 1. Open PowerShell as Administrator

- Right-click **PowerShell**
- Select **Run as Administrator**

---

#### 2. Install Exchange Online Module (if not installed)

```powershell
Install-Module -Name ExchangeOnlineManagement -Force
```

Press **Y** if prompted.

---

#### 3. Connect to Exchange Online

```powershell
Connect-ExchangeOnline
```

- Enter your **ADMIN** email
- Enter your **ADMIN** password
- Complete MFA if required

---

#### 4. Check Current SMTP AUTH Status

```powershell
Get-CASMailbox -Identity revanth.moddelai@tectoro.com | Format-List SmtpClientAuthenticationDisabled
```

**Result**:
- `SmtpClientAuthenticationDisabled : True` → SMTP is **DISABLED** ❌ (This is your issue!)
- `SmtpClientAuthenticationDisabled : False` → SMTP is **ENABLED** ✅

---

#### 5. Enable SMTP AUTH

```powershell
Set-CASMailbox -Identity revanth.moddelai@tectoro.com -SmtpClientAuthenticationDisabled $false
```

You should see: **No error = Success!** ✅

---

#### 6. Verify It's Enabled

```powershell
Get-CASMailbox -Identity revanth.moddelai@tectoro.com | Format-List SmtpClientAuthenticationDisabled
```

Should now show:
```
SmtpClientAuthenticationDisabled : False
```

✅ **This means SMTP AUTH is now ENABLED!**

---

#### 7. Disconnect

```powershell
Disconnect-ExchangeOnline
```

---

#### 8. Wait and Test

- **Wait 5-10 minutes** for changes to propagate
- Go back to your Asset Management System
- Settings → Email Config → Send Test
- **It should work now!** ✅

---

## 🔐 Method 4: Enable for Entire Organization (Optional)

If you want to enable SMTP AUTH for **all users** in your organization:

### Via PowerShell:

```powershell
Connect-ExchangeOnline

# Get all mailboxes and enable SMTP AUTH
Get-CASMailbox -ResultSize Unlimited | Set-CASMailbox -SmtpClientAuthenticationDisabled $false

Disconnect-ExchangeOnline
```

**Warning**: This enables SMTP for ALL users. Only do this if your security policy allows it.

---

## 🔐 Method 5: Via Azure AD (Alternative)

1. Go to: **https://portal.azure.com**
2. Navigate to: **Azure Active Directory** → **Users**
3. Click on: **Revanth Moddelai**
4. Click: **Authentication methods**
5. Ensure SMTP authentication is allowed

---

## ✅ After Enabling SMTP AUTH

### Test Again in Asset Management:

1. **Go to**: http://192.168.20.180:3000
2. **Login** and go to Settings → Email Config
3. **Verify settings**:
   ```
   Sender Email:      revanth.moddelai@tectoro.com
   SMTP Server:       smtp.office365.com
   SMTP Port:         587
   SMTP Username:     revanth.moddelai@tectoro.com
   SMTP Password:     [Your regular Outlook password]
   Use TLS:          ✓ Checked
   ```
4. **Click**: "Send Test"
5. **Should work now!** ✅

---

## 🔍 How to Verify SMTP is Enabled (Without PowerShell)

### Test from Linux:

```bash
cd /home/administrator/Desktop/asset-management
python3 diagnose_office365.py
```

Enter:
- Email: `revanth.moddelai@tectoro.com`
- Password: Your regular Outlook password
- Recipient: Any test email

**If SMTP AUTH is still disabled**, you'll see:
```
❌ Authentication FAILED
Solution 1: Check if SMTP AUTH is enabled
Ask your IT admin to run this PowerShell command...
```

**If SMTP AUTH is enabled**, you'll see:
```
✅ Authentication SUCCESSFUL!
✅ Email sent successfully!
```

---

## 📋 Summary: What Your Admin Needs to Do

**Quick PowerShell Fix** (30 seconds):

```powershell
# 1. Connect
Connect-ExchangeOnline

# 2. Enable SMTP AUTH
Set-CASMailbox -Identity revanth.moddelai@tectoro.com -SmtpClientAuthenticationDisabled $false

# 3. Verify
Get-CASMailbox -Identity revanth.moddelai@tectoro.com | FL SmtpClientAuthenticationDisabled

# 4. Done!
Disconnect-ExchangeOnline
```

**Wait 5-10 minutes, then test again.**

---

## 🚨 Common Admin Account Issues

### Issue 1: "You don't have permission"
**Solution**: Use a Global Administrator account

### Issue 2: "Connect-ExchangeOnline not found"
**Solution**: Install module first:
```powershell
Install-Module -Name ExchangeOnlineManagement -Force
```

### Issue 3: Security Defaults Blocking SMTP
**Solution**: Admin needs to create authentication policy exception

---

## 🎯 Recommended Approach

**If you have admin access**:
1. ✅ Use **Method 3 (PowerShell)** - It's fastest and most reliable
2. ✅ Takes only 2 minutes
3. ✅ Clear confirmation that it worked

**If you don't have admin access**:
1. ✅ Ask your IT admin to run the PowerShell commands
2. ✅ Share this file with them
3. ✅ Or show them the "Summary: What Your Admin Needs to Do" section

---

## 📞 What to Tell Your IT Admin

> "Hi, I need SMTP authentication enabled for my Office 365 account (revanth.moddelai@tectoro.com) 
> so I can send automated emails from our IT Asset Management System.
> 
> Can you please run these PowerShell commands:
> 
> ```powershell
> Connect-ExchangeOnline
> Set-CASMailbox -Identity revanth.moddelai@tectoro.com -SmtpClientAuthenticationDisabled $false
> Get-CASMailbox -Identity revanth.moddelai@tectoro.com | Format-List SmtpClientAuthenticationDisabled
> Disconnect-ExchangeOnline
> ```
> 
> The last command should show: SmtpClientAuthenticationDisabled : False
> 
> Please let me know when it's done so I can test. Thanks!"

---

## ✅ Next Steps

1. **Enable SMTP AUTH** using one of the methods above (PowerShell recommended)
2. **Wait 5-10 minutes**
3. **Test in Asset Management System**
4. **Should work!** ✅

---

**The most common issue is SMTP AUTH being disabled. Once enabled, everything will work!** 🎉
