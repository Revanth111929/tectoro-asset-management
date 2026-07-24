# How to Send Asset Acknowledgment Email

## ✅ Email Test is Working!

Now you can send acknowledgment emails when assigning assets to users.

---

## 📧 How It Works

### Step 1: Add or Edit an Asset
1. Go to **Assets → Add Asset** or edit an existing asset
2. Select the **"Existing Device"** tab (for assigned assets)
3. Fill in the employee details:
   - **EMP ID**: Employee ID
   - **Employee Name**: Full name
   - **Employee Email**: `user@gmail.com` ← **Important!**
   - **Mobile**: Phone number

### Step 2: Save the Asset
1. Click **"Add Asset"** or **"Update Asset"**
2. The asset is saved with the employee email

### Step 3: Send Acknowledgment Email

#### Option A: From Asset List
1. Go to **Assets → All Assets**
2. Find the asset you just assigned
3. Click the **"View"** button (eye icon)
4. Look for **"Send Acknowledgment Email"** button
5. Click it
6. ✅ Email sent to the employee's Gmail!

#### Option B: From Asset View Page
1. After creating/updating the asset
2. You'll see the asset details
3. Click **"Send Acknowledgment Email"** button
4. ✅ Email sent!

---

## 📬 What the Employee Receives

The employee will receive an email with:

### Email Subject:
```
Action Required: Acknowledge Receipt of [Asset Name]
```

### Email Content:
- Professional email from "Tectoro IT Assets"
- Asset details:
  - Asset ID
  - Asset Name
  - Model
  - Serial Number
  - Assigned Date
  - Assigned By
- **Blue button**: "✓ Acknowledge Receipt"
- Expiration date (7 days)

### Example Email:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IT Asset Assignment
Action Required — Please acknowledge receipt
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear [Employee Name],

The IT department has assigned the following 
asset to you. Please review and confirm.

┌─────────────────────────────────┐
│ Asset ID:      #123             │
│ Asset Name:    Dell Laptop      │
│ Model:         Latitude 5400    │
│ Serial:        ABC123XYZ        │
│ Assigned:      June 15, 2026    │
│ Assigned By:   Admin            │
└─────────────────────────────────┘

      [✓ Acknowledge Receipt]

Link expires: June 22, 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔄 Acknowledgment Flow

### 1. Employee Receives Email
- Email lands in their Gmail inbox
- From: "Tectoro IT Assets"
- Contains unique acknowledgment link

### 2. Employee Clicks Button
- Opens acknowledgment page in browser
- Shows asset details
- Confirms receipt

### 3. System Records Acknowledgment
- ✅ Status changed to "Acknowledged"
- Date/time recorded
- Asset tracking updated

### 4. Admin Can See Status
- In asset list: Shows "Acknowledged" status
- In asset view: Shows acknowledgment date
- Tracking is complete

---

## 📊 Asset Acknowledgment Statuses

| Status | Meaning |
|--------|---------|
| **Not Sent** | Email hasn't been sent yet |
| **Pending** | Email sent, waiting for employee response |
| **Acknowledged** | Employee confirmed receipt ✅ |
| **Expired** | Link expired (after 7 days) |

---

## 🎯 Complete Example

### Scenario: Assigning a Laptop

**Step 1: Create/Edit Asset**
```
Asset Name:       Dell Latitude 5400
Serial Number:    ABC123XYZ
Category:         Laptop
Status:           Assigned
EMP ID:           EMP001
Employee Name:    Revanth Maddela
Employee Email:   revanth4551@gmail.com  ← Important!
Mobile:           +91 1234567890
```

**Step 2: Save Asset**
- Click "Add Asset"
- Asset created successfully

**Step 3: Send Email**
- Click "Send Acknowledgment Email"
- Confirmation: "✓ Email sent to revanth4551@gmail.com"

**Step 4: Employee Receives**
- Email appears in revanth4551@gmail.com inbox
- Subject: "Action Required: Acknowledge Receipt of Dell Latitude 5400"

**Step 5: Employee Acknowledges**
- Opens email
- Clicks "✓ Acknowledge Receipt"
- Sees success page: "Acknowledged Successfully!"

**Step 6: Admin Sees Status**
- Asset status: "Acknowledged"
- Acknowledged date: June 15, 2026 at 10:30 AM

---

## 🔔 Important Notes

### Email Requirements
- ✅ **Employee Email** must be filled in
- ✅ Email must be valid (e.g., user@gmail.com)
- ✅ SMTP must be configured (already done!)

### Email Sending
- ⏱️ Takes 2-5 seconds to send
- 📬 Lands in inbox (not spam with proper SMTP)
- 🔗 Link is unique and expires in 7 days
- 🔒 Secure token-based authentication

### Troubleshooting
- **No email received?**
  - Check employee email is correct
  - Check spam/junk folder
  - Verify SMTP config is saved
  - Try sending test email first

- **Link expired?**
  - Resend acknowledgment email
  - Employee has 7 days to respond
  - Can resend multiple times if needed

---

## 🚀 Quick Start Workflow

```
1. Add Asset → Existing Device tab
2. Enter employee details + EMAIL
3. Save asset
4. Click "Send Acknowledgment Email"
5. ✅ Email sent!
6. Employee receives and acknowledges
7. Status updates automatically
```

---

## 📝 Email Template Preview

The email is professionally designed with:
- ✅ Blue gradient header
- ✅ Clean asset details table
- ✅ Large blue CTA button
- ✅ Professional footer
- ✅ Mobile-responsive design
- ✅ Secure acknowledgment link

---

## 💡 Pro Tips

1. **Always fill in employee email** when assigning assets
2. **Test first** - Send yourself a test to see how it looks
3. **Check spam** - First email might go to spam
4. **Resend if needed** - Can resend anytime
5. **Track status** - Monitor who has/hasn't acknowledged

---

## 🎓 Video Tutorial

If you need help, refer to:
- `EMAIL_SETUP_GUIDE.md` - Initial setup
- `GMAIL_SMTP_SETUP.md` - Gmail configuration
- This file - How to use acknowledgment emails

---

**Your email system is ready! Just add employee emails when assigning assets and send acknowledgments!** 📧✅
