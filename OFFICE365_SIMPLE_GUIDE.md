# Office 365 Email - Simple Setup (3 Steps)

## 🎯 Good News!

**SMTP is usually already enabled!** Let's just test and configure.

---

## Step 1: Test Your Office 365 Email First

Open terminal and run:

```bash
cd /home/administrator/Desktop/asset-management
python3 test_office365_email.py
```

**You'll be asked for**:
1. Your Office 365 email (e.g., yourname@company.com)
2. Your password
3. A test recipient email

**What happens next?**

### ✅ If Test Succeeds:
Great! SMTP is already enabled. Skip to Step 3.

### ❌ If Test Fails with "Authentication Failed":
Continue to Step 2.

---

## Step 2: Fix Authentication (Only if Step 1 Failed)

### Option A: Create App Password (If you have MFA/2FA)

1. Visit: https://mysignins.microsoft.com/security-info
2. Click: **"+ Add sign-in method"**
3. Select: **"App password"**
4. Name it: **"Asset Management"**
5. Click **Next**
6. **COPY** the 16-character password that appears
7. Go back to Step 1 and test again with this App Password

---

### Option B: Enable SMTP for Your Account

**Method 1: Via Microsoft 365 Admin Center**

1. Go to: https://admin.microsoft.com
2. Click: **Users** → **Active users**
3. Click on your name
4. Click: **Mail** tab
5. Click: **Manage email apps**
6. Check: ✓ **Authenticated SMTP**
7. Click: **Save changes**
8. Wait 5 minutes
9. Go back to Step 1 and test again

**Method 2: Ask Your IT Admin**

If you're not an admin, ask your IT admin to enable SMTP AUTH for your account by running:

```powershell
Set-CASMailbox -Identity yourname@company.com -SmtpClientAuthenticationDisabled $false
```

---

## Step 3: Configure in Asset Management System

Once the test in Step 1 succeeds:

1. **Open Browser**:
   - Go to: http://192.168.20.180:3000
   - Login with your credentials

2. **Go to Settings**:
   - Click the ⚙️ (Settings) icon in the left sidebar
   - Click **"Email Config"** tab

3. **Fill in the form**:
   ```
   Sender Name:       IT Department (or your name)
   Sender Email:      yourname@company.com
   SMTP Server:       smtp.office365.com
   SMTP Port:         587
   SMTP Username:     yourname@company.com
   SMTP Password:     [The password that worked in Step 1]
   Use TLS:          ✓ CHECK THIS BOX
   ```

4. **Test**:
   - Enter a test email in "Test Recipient Email"
   - Click **"Test Connection"**
   - You should see: "✅ Test email sent successfully!"

5. **Save**:
   - Click **"Save Email Config"**

---

## 🎉 Done!

Now when you assign an asset to a user:
1. Enter their Office 365 email address
2. The system will send them an acknowledgment email
3. They click the button in the email to confirm receipt

---

## 📋 Office 365 Settings Summary

| Setting | Value |
|---------|-------|
| SMTP Server | smtp.office365.com |
| Port | 587 |
| Encryption | TLS |
| Username | Full email (yourname@company.com) |
| Password | Office 365 password OR App Password |

---

## ❓ Still Having Issues?

### Check 1: Is MFA/2FA Enabled?
- If YES → You MUST use App Password (not regular password)
- Visit: https://mysignins.microsoft.com/security-info

### Check 2: Are You Using Full Email as Username?
- ✅ Correct: `yourname@company.com`
- ❌ Wrong: `yourname`

### Check 3: Can You Login to Outlook?
- Try: https://outlook.office.com
- If you can't login, your password might be wrong

### Check 4: Wait Time
- After enabling SMTP AUTH, wait 5-10 minutes
- Microsoft services take time to update

---

## 🚀 Quick Start Command

Just run this and follow the prompts:

```bash
cd /home/administrator/Desktop/asset-management
python3 test_office365_email.py
```

If this works, you're 90% done! Just save the settings in the web interface.

---

**Start with Step 1! Most times it just works.** ✨
