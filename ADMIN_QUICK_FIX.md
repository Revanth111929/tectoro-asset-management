# 🚀 Admin Quick Fix - Enable SMTP AUTH (2 Minutes)

## The Problem:
❌ **SMTP AUTH is disabled by default in Microsoft 365**  
❌ That's why authentication keeps failing

## The Solution:
✅ **Enable SMTP AUTH for revanth.moddelai@tectoro.com**

---

## 🎯 Quick Fix (PowerShell - 2 Minutes)

### On a Windows Computer:

1. **Open PowerShell as Administrator**
   - Right-click PowerShell → "Run as Administrator"

2. **Run these commands** (copy-paste one by one):

```powershell
# Install module (if needed)
Install-Module -Name ExchangeOnlineManagement -Force

# Connect to Exchange Online
Connect-ExchangeOnline

# Enable SMTP AUTH
Set-CASMailbox -Identity revanth.moddelai@tectoro.com -SmtpClientAuthenticationDisabled $false

# Verify it worked
Get-CASMailbox -Identity revanth.moddelai@tectoro.com | Format-List SmtpClientAuthenticationDisabled

# Disconnect
Disconnect-ExchangeOnline
```

3. **Check the output**:
   - Should show: `SmtpClientAuthenticationDisabled : False`
   - This means **SMTP is now ENABLED** ✅

4. **Wait 5-10 minutes** for changes to propagate

5. **Test again** in Asset Management System

---

## ✅ Alternative: Via Microsoft 365 Admin Center

If you don't have PowerShell:

1. **Go to**: https://admin.microsoft.com
2. **Login** with admin account
3. **Click**: Users → Active users
4. **Find**: Revanth Moddelai (revanth.moddelai@tectoro.com)
5. **Click** on the user name
6. **Click**: Mail tab
7. **Click**: "Manage email apps"
8. **Check** ✅: "Authenticated SMTP"
9. **Click**: Save changes
10. **Wait**: 5-10 minutes
11. **Test** again

---

## 🔍 How to Know It Worked:

After enabling, test from Linux machine:

```bash
cd /home/administrator/Desktop/asset-management
python3 diagnose_office365.py
```

**Enter**:
- Email: revanth.moddelai@tectoro.com
- Password: Regular Outlook password
- Recipient: Any test email

**Success looks like**:
```
✅ Connected successfully
✅ EHLO successful
✅ TLS started successfully
✅ Authentication SUCCESSFUL!
✅ Email sent successfully!
✅ ALL TESTS PASSED!
```

**Then configure in web interface and you're done!**

---

## 📞 Don't Have Admin Access?

Ask your IT admin to run the PowerShell commands above.

Copy-paste this message:

> Hi IT Team,
> 
> I need SMTP authentication enabled for revanth.moddelai@tectoro.com 
> to send automated emails from our Asset Management System.
> 
> Please run:
> ```powershell
> Connect-ExchangeOnline
> Set-CASMailbox -Identity revanth.moddelai@tectoro.com -SmtpClientAuthenticationDisabled $false
> ```
> 
> Verify with:
> ```powershell
> Get-CASMailbox -Identity revanth.moddelai@tectoro.com | FL SmtpClientAuthenticationDisabled
> ```
> 
> Should show: False
> 
> Thanks!

---

## 🎉 Once SMTP AUTH is Enabled:

Your Asset Management System will be able to:
- ✅ Send acknowledgment emails from Office 365
- ✅ Use revanth.moddelai@tectoro.com as sender
- ✅ Deliver to users' company email addresses
- ✅ Professional, branded emails

---

**This is the #1 fix for Office 365 SMTP issues!** 🚀
