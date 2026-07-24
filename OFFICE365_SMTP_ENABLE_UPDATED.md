# How to Enable SMTP AUTH for Office 365 (Updated Guide)

**Date**: June 15, 2026

---

## Good News! 🎉

**SMTP AUTH is often enabled by default** in Office 365/Microsoft 365. You can skip the enabling step and go directly to testing!

---

## Option 1: Try Testing First (Recommended)

Most Office 365 accounts already have SMTP AUTH enabled. Let's test it:

```bash
cd /home/administrator/Desktop/asset-management
python3 test_office365_email.py
```

**Enter your Office 365 credentials and test!**

If it works → You're done! Skip to "Configure in Web Interface" below.

If it fails with authentication error → Continue to Option 2 or 3 below.

---

## Option 2: Enable SMTP AUTH for YOUR Account (User Level)

### Method A: Via Microsoft 365 Admin Center

1. **Go to Microsoft 365 Admin Center**:
   - Visit: https://admin.microsoft.com
   - Sign in with admin credentials

2. **Navigate to your user**:
   - Click **Users** → **Active users** (left sidebar)
   - Find and click on your user account
   - Click the **Mail** tab

3. **Enable Email Apps**:
   - Scroll down to **Email apps**
   - Click **Manage email apps**
   - Make sure **Authenticated SMTP** is checked ✓
   - Click **Save changes**

4. **Wait 5-10 minutes** for changes to take effect

---

### Method B: Via Exchange Admin Center (Your Screen)

Looking at your screenshot, try this:

1. In Exchange Admin Center (where you are now)
2. Click on **Recipients** (left sidebar)
3. Click **Mailboxes**
4. Find and click your mailbox/user
5. Look for **Email apps** or **Email connectivity** section
6. Enable **Authenticated SMTP**

**OR**

1. Close the Mail settings popup
2. Look for **Settings** (gear icon ⚙️) at the top right
3. Click **Mail flow**
4. Look for **Authentication** or **SMTP AUTH** option

---

## Option 3: Enable SMTP AUTH for Organization (Admin Only)

### Via PowerShell (Most Reliable Method):

1. **Install Exchange Online PowerShell Module** (if not installed):
   ```powershell
   Install-Module -Name ExchangeOnlineManagement
   ```

2. **Connect to Exchange Online**:
   ```powershell
   Connect-ExchangeOnline -UserPrincipalName your-admin@company.com
   ```

3. **Enable SMTP AUTH for your account**:
   ```powershell
   Set-CASMailbox -Identity your-email@company.com -SmtpClientAuthenticationDisabled $false
   ```

4. **Verify it's enabled**:
   ```powershell
   Get-CASMailbox -Identity your-email@company.com | Format-List SmtpClientAuthenticationDisabled
   ```
   
   (Should show: `SmtpClientAuthenticationDisabled : False`)

5. **Disconnect**:
   ```powershell
   Disconnect-ExchangeOnline
   ```

---

### Via Azure AD Portal:

1. **Go to Azure Portal**:
   - Visit: https://portal.azure.com
   - Sign in with admin credentials

2. **Navigate to Exchange**:
   - Search for "Exchange" in the top search bar
   - Click **Exchange admin center**

3. **Enable SMTP AUTH**:
   - Recipients → Mailboxes
   - Select your mailbox
   - Edit → Email Connectivity
   - Enable **Authenticated SMTP**

---

## Option 4: Use App Password (If MFA is Enabled)

If your account has Multi-Factor Authentication (MFA/2FA), you don't need to enable SMTP AUTH - just create an App Password:

1. **Go to Security Settings**:
   - Visit: https://mysignins.microsoft.com/security-info
   - OR: https://account.microsoft.com/security

2. **Create App Password**:
   - Click **+ Add sign-in method**
   - Select **App password**
   - Click **Add**
   - Enter name: **"IT Asset Management System"**
   - Click **Next**

3. **Copy the Password**:
   - You'll see a password like: `abcd-efgh-ijkl-mnop`
   - Copy it (you won't see it again!)
   - Use this instead of your regular password

---

## After Enabling: Test Your Configuration

Run the test script:

```bash
cd /home/administrator/Desktop/asset-management
python3 test_office365_email.py
```

**Enter**:
- Sender Email: your-email@company.com
- Password: Your Office 365 password (or App Password if MFA)
- Test Recipient: any email to test

---

## Configure in Web Interface

Once the test succeeds:

1. **Login to Asset Management**:
   - Go to: http://192.168.20.180:3000

2. **Go to Settings**:
   - Click Settings (⚙️ icon in sidebar)
   - Click **Email Config** tab

3. **Enter Office 365 Settings**:
   ```
   Sender Name:       IT Department
   Sender Email:      your-email@company.com
   SMTP Server:       smtp.office365.com
   SMTP Port:         587
   SMTP Username:     your-email@company.com
   SMTP Password:     [password you just tested]
   Use TLS:          ✓ (checked)
   ```

4. **Test & Save**:
   - Click **Test Connection**
   - Should show: "✅ Test email sent successfully!"
   - Click **Save Email Config**

---

## Troubleshooting

### "Authentication Failed" Error

**Try these in order**:

1. ✅ **Test with App Password first** (if MFA is enabled)
   - Create App Password: https://mysignins.microsoft.com/security-info
   - Use that password instead

2. ✅ **Use full email address as username**
   - Correct: `yourname@company.com`
   - Wrong: `yourname`

3. ✅ **Wait 10 minutes after enabling SMTP AUTH**
   - Changes take time to propagate

4. ✅ **Check if SMTP AUTH is enabled**:
   ```powershell
   Connect-ExchangeOnline
   Get-CASMailbox -Identity your-email@company.com | Format-List SmtpClientAuthenticationDisabled
   ```
   - Should be: `False`

5. ✅ **Verify your password works**
   - Try logging into: https://outlook.office.com
   - If that fails, reset your password

---

### "Connection Timeout" Error

- Check firewall allows port 587
- Test connection: `telnet smtp.office365.com 587`
- Try from different network

---

## Alternative: Use Microsoft Graph API (Advanced)

If SMTP AUTH cannot be enabled (corporate policy), you can use Microsoft Graph API instead. This requires different setup. Let me know if you need this approach.

---

## Summary: Easiest Method

**For most users**:

1. ✅ Try testing first - SMTP might already be enabled
2. ✅ If MFA enabled → Create App Password
3. ✅ If no MFA → Use regular password
4. ✅ Run test script
5. ✅ Configure in web interface

**Try testing first before worrying about enabling SMTP AUTH!**

---

## Need Help?

Contact me with:
- Screenshot of any error messages
- Whether you have MFA enabled
- Whether you're an admin in your organization

---

**Next Step**: Run `python3 test_office365_email.py` and see what happens!
