# Employee Bulk Import - User Guide

## Quick Start

### Step 1: Download Template
1. Go to **Employee Master**
2. Click **"Bulk Import"** button
3. Click **"Download Template"**
4. Save `employee_import_template.xlsx`

### Step 2: Fill Employee Data
Open the Excel file and fill in employee details:

**Required Columns:**
- `emp_id` - Employee ID (must be unique)
- `employee_name` - Full name

**Optional Columns:**
- `email` - Email address (leave empty if not available)
- `mobile_number` - Phone number
- `designation` - Job title
- `department` - Department name
- `team` - Team name
- `project` - Current project
- `manager` - Manager name
- `microsoft_license` - License type (e.g., E3, E5)
- `location` - Office location

### Step 3: Upload and Import
1. Click **"Choose File"** in Bulk Import dialog
2. Select your filled Excel file
3. Click **"Import Employees"**
4. Wait for results

---

## Column Guidelines

### Employee ID (Required)
- **Format:** Any alphanumeric string
- **Examples:** `TT001`, `EMP123`, `GGH`, `RG006`
- **Rules:**
  - Must be unique (duplicates will be skipped)
  - Cannot be empty

### Employee Name (Required)
- **Format:** Full name
- **Examples:** `John Doe`, `Priya Sharma`, `Vaishnavi`
- **Rules:**
  - Cannot be empty

### Email (Optional)
- **Format:** Valid email address
- **Examples:** `john.doe@company.com`, `priya@example.co.in`
- **Rules:**
  - Can be left empty
  - Must be valid format if provided
  - Must be unique (cannot have duplicate emails)
  - Invalid formats will be rejected

**Email Validation Examples:**

✅ **Valid (Will Import):**
- Empty cell (no email provided)
- `john.doe@company.com`
- `user.name@subdomain.example.com`
- `email+tag@domain.co.in`

❌ **Invalid (Will Reject):**
- `invalidemail` (no @ symbol)
- `user@` (incomplete domain)
- `@domain.com` (no username)
- `user @domain.com` (space in email)

### Mobile Number (Optional)
- **Format:** 10-15 digits
- **Examples:** `9876543210`, `+91-9876543210`
- **Rules:**
  - Can be left empty
  - Excel may convert to decimal (e.g., 9876543210.0) - this is handled automatically

### Other Fields (All Optional)
- Can be left empty
- Will be stored as provided

---

## Common Issues & Solutions

### Issue 1: "Invalid email format for [EMP_ID]"

**Cause:** Email column contains invalid format

**Solution:**
1. Check the error message - it shows the actual value
2. Fix the email format in Excel
3. Or leave the email cell empty if email is not available
4. Re-upload the file

**Example Error:**
```
Row 5: Invalid email format for TT054 ('invalidemail')
```
Fix: Change `invalidemail` to `valid@company.com` or leave empty

---

### Issue 2: "Duplicate Employee ID [EMP_ID]"

**Cause:** Employee ID already exists in database

**Solution:**
1. This employee is already in the system
2. Use a different Employee ID
3. Or update the existing employee instead

**Example Error:**
```
Row 12: Duplicate Employee ID TT054
```
This is normal - employee TT054 already exists, so it's skipped.

---

### Issue 3: "Email [email] already exists"

**Cause:** Another employee already has this email

**Solution:**
1. Check who has this email
2. Use a different email
3. Or leave email empty

**Example Error:**
```
Row 8: Email john@company.com already exists for employee EMP001
```

---

### Issue 4: Import Result Shows "Failed: XX"

**Cause:** Some rows have validation errors

**What to do:**
1. Read the error messages carefully
2. Note the row numbers that failed
3. Fix those rows in Excel
4. Re-upload only the failed rows (or the entire file)

**Example:**
```
Imported: 40
Skipped: 2
Failed: 1

Errors:
- Row 15: Invalid email format for EMP999 ('invalid@')
```

**Action:** Fix Row 15 email, re-upload

---

## Tips for Successful Import

### 1. Check Your Data First
- ✅ All Employee IDs are unique
- ✅ All Employee Names are filled
- ✅ Email formats are correct (or empty)
- ✅ No extra spaces in values
- ✅ No hidden characters

### 2. Start Small
- Test with 5-10 employees first
- Verify they import correctly
- Then upload the full dataset

### 3. Handle Duplicates
- **Duplicate Employee ID:** Employee already exists (normal)
- **Duplicate Email:** Check why two employees have same email

### 4. Don't Modify Template Structure
- ❌ Don't add new columns
- ❌ Don't remove columns
- ❌ Don't rename column headers
- ❌ Don't change sheet name
- ✅ Only fill in the data rows

### 5. Excel Tips
- Save as `.xlsx` format (not `.xls` or `.csv`)
- Don't use formulas in cells
- Copy-paste values only (not formulas)
- Remove any merged cells
- Delete extra empty rows at the bottom

---

## Understanding Import Results

### Result Modal

After import completes, you'll see:

```
┌─────────────────────────────────┐
│   Bulk Import Results           │
├─────────────────────────────────┤
│  Imported: 38  ✅               │
│  Skipped:  2   ⚠️               │
│  Failed:   3   ❌               │
│                                 │
│  Errors:                        │
│  - Row 5: Invalid email...      │
│  - Row 12: Duplicate ID...      │
│  - Row 18: Invalid email...     │
└─────────────────────────────────┘
```

**Imported:** Successfully added to database ✅
**Skipped:** Already exists (duplicate Employee ID) ⚠️
**Failed:** Validation error (needs to be fixed) ❌

---

## Example Data

### Complete Employee Row (All Fields)

```
emp_id: TT999
employee_name: John Doe
designation: Senior Engineer
department: IT
team: Backend Team
project: Project Phoenix
manager: Jane Smith
microsoft_license: E5
email: john.doe@company.com
mobile_number: 9876543210
location: Hyderabad Office
```

**Result:** ✅ Will import successfully

---

### Minimal Employee Row (Required Only)

```
emp_id: TT998
employee_name: Jane Smith
designation: (empty)
department: (empty)
team: (empty)
project: (empty)
manager: (empty)
microsoft_license: (empty)
email: (empty)
mobile_number: (empty)
location: (empty)
```

**Result:** ✅ Will import successfully (optional fields stored as empty)

---

## FAQ

**Q: Can I import employees without email addresses?**
A: Yes! Email is optional for bulk import. Leave the cell empty.

**Q: What happens to duplicate Employee IDs?**
A: They are skipped (not imported). Shown in "Skipped" count.

**Q: Can I update existing employees via bulk import?**
A: No. Bulk import only adds NEW employees. Use "Edit Employee" for updates.

**Q: What's the maximum number of employees I can import?**
A: No hard limit, but recommend importing in batches of 100 for better performance.

**Q: Can I import employees with the same name?**
A: Yes! Employee names don't need to be unique (but Employee IDs must be).

**Q: My mobile numbers show decimals (9876543210.0) - is this a problem?**
A: No problem! This is handled automatically. The decimal is removed during import.

**Q: Can I use the same email for multiple employees?**
A: No. Email addresses must be unique. Leave empty if employees don't have unique emails.

**Q: What if I make a mistake during import?**
A: You can delete the incorrectly imported employees and re-import them.

---

## Need Help?

**Common Errors:**
- Check the error message carefully - it tells you exactly what's wrong
- Error shows row number and the issue
- Fix the specific row in Excel and re-upload

**Still Having Issues?**
1. Download a fresh template
2. Copy your data to the new template (don't modify structure)
3. Save as .xlsx
4. Try importing again

**Contact Support:**
- Provide the error message
- Provide the row number that's failing
- Share the specific value causing the issue (if safe to share)

---

## Version

**Last Updated:** August 30, 2026
**Feature:** Employee Bulk Import
**Status:** Production Ready ✅
