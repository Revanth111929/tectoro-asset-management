# 📸 UAT Bug #001 - Visual Guide

## What You'll See After the Fix

---

## 🆕 NEW: Invoice Attachment Section

### Location
**Assets → Add Asset → New Device Tab**

Scroll down after the "Purchase & Warranty" section to see:

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📎 Invoice Attachment (Optional)                   ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                      ┃
┃  📄 Upload Invoice                                   ┃
┃  ┌────────────────────────────┐                     ┃
┃  │ [Choose File] No file chosen│                     ┃
┃  └────────────────────────────┘                     ┃
┃                                                      ┃
┃  Supported formats: PDF, DOC, DOCX, XLS, XLSX,     ┃
┃  JPG, JPEG, PNG (Max 10MB)                          ┃
┃                                                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## ✅ After Selecting a File

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📎 Invoice Attachment (Optional)                   ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                      ┃
┃  📄 Upload Invoice                                   ┃
┃  ┌────────────────────────────┐                     ┃
┃  │ invoice-12345.pdf selected │                     ┃
┃  └────────────────────────────┘                     ┃
┃                                                      ┃
┃  ┌──────────────────────────────────────────────┐  ┃
┃  │ ✅ invoice-12345.pdf     [1.2 MB]  [Remove] │  ┃
┃  └──────────────────────────────────────────────┘  ┃
┃                                                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Features:**
- ✅ Shows filename
- ✅ Shows file size
- ✅ Remove button to clear selection

---

## 📋 Inventory Details Page (WITH Invoice)

After creating the device, go to **Inventory → View Details**:

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📎 Invoice Attachment                               ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                        ┃
┃  ┌──────────────────────────────────────────────────┐ ┃
┃  │  📄                                              │ ┃
┃  │                                                  │ ┃
┃  │  invoice-12345.pdf                               │ ┃
┃  │  1.2 MB • Uploaded Aug 3, 2026                   │ ┃
┃  │                                                  │ ┃
┃  │  [👁️ View]  [⬇️ Download]                       │ ┃
┃  │                                                  │ ┃
┃  └──────────────────────────────────────────────────┘ ┃
┃                                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Features:**
- ✅ Displays original filename
- ✅ Shows file size and upload date
- ✅ **View** button - Opens invoice in new browser tab
- ✅ **Download** button - Downloads file to your computer

---

## 📋 Inventory Details Page (WITHOUT Invoice)

If no invoice was uploaded:

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  📎 Invoice Attachment                               ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                        ┃
┃  No invoice uploaded.                                  ┃
┃                                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## ⚠️ File Size Validation

If you try to upload a file **larger than 10MB**:

```
┌───────────────────────────────────────────────┐
│  ⚠️  Alert                                    │
├───────────────────────────────────────────────┤
│                                               │
│  File size exceeds 10MB limit                 │
│                                               │
│                                 [OK]          │
└───────────────────────────────────────────────┘
```

File is rejected and input is cleared.

---

## 🎨 Color Coding

The invoice section uses **cyan/teal color scheme**:
- Section Header: Cyan (#0891b2)
- Icon: 📎 (paperclip)
- File Preview Box: Light cyan background
- Success State: Green checkmark ✅

Consistent with existing form sections:
- Basic Details: Green (#16a34a)
- Specifications: Purple (#7c3aed)  
- Purchase & Warranty: Orange (#ea580c)
- **Invoice Attachment: Cyan (#0891b2)** ← NEW!

---

## 📱 Responsive Design

Works on all screen sizes:
- **Desktop:** Full-width file input with side-by-side preview
- **Tablet:** Stacked layout, easy touch targets
- **Mobile:** Optimized for small screens

---

## 🔄 Complete Workflow

### Step-by-Step Visual Flow:

1. **Select Category**
   ```
   [Laptop ▼]  ← Choose asset type
   ```

2. **Fill Basic Details**
   ```
   Brand: Dell
   Model: Latitude 5420
   Serial: DEL-LAT-001
   ```

3. **Fill Purchase Info** (optional)
   ```
   Invoice #: INV-2024-001
   Invoice Date: 2024-01-15
   Purchase Price: ₹75,000
   ```

4. **Upload Invoice** ← NEW!
   ```
   📄 [Choose File] → Select invoice-001.pdf
   ✅ invoice-001.pdf [1.2 MB] [Remove]
   ```

5. **Save Device**
   ```
   [➕ Add to Inventory]
   ```

6. **View in Inventory Details**
   ```
   📎 Invoice Attachment
   📄 invoice-001.pdf
   1.2 MB • Uploaded Aug 3, 2026
   [👁️ View] [⬇️ Download]
   ```

---

## ✅ Success Indicators

When everything works correctly, you'll see:

1. ✅ File preview appears after selection
2. ✅ No errors when saving device
3. ✅ Success toast: "New device added to inventory!"
4. ✅ Invoice section appears in Inventory Details
5. ✅ View button opens invoice in new tab
6. ✅ Download button downloads the file

---

## ❌ Error Indicators

If something goes wrong:

1. ❌ Alert: "File size exceeds 10MB limit"
2. ❌ File input doesn't accept unsupported types (.zip, .exe, etc.)
3. ❌ Error toast if backend upload fails (rare)

---

## 🎯 Quick Visual Test Checklist

Open the app and verify you can see:

- [ ] "Invoice Attachment" section in New Device form
- [ ] File input with format description
- [ ] File size limit message (Max 10MB)
- [ ] File preview after selecting file
- [ ] Remove button in file preview
- [ ] Invoice section in Inventory Details page
- [ ] View and Download buttons

---

## 📸 Before vs After

### BEFORE (Missing Feature)
```
Purchase & Warranty Section
├─ Invoice Number: [text input]
├─ Invoice Date: [date input]  
├─ Purchase Price: [number input]
└─ ... other fields

[Add to Inventory] [Cancel]  ← No way to attach invoice file!
```

### AFTER (Feature Complete)
```
Purchase & Warranty Section
├─ Invoice Number: [text input]
├─ Invoice Date: [date input]
├─ Purchase Price: [number input]
└─ ... other fields

📎 Invoice Attachment (Optional)  ← NEW SECTION!
├─ Upload Invoice: [file input]
└─ Supported formats: PDF, DOC, XLS, JPG, PNG (Max 10MB)

[Add to Inventory] [Cancel]
```

---

## 🎬 Testing Animation Flow

Imagine this sequence:

```
User clicks "Choose File"
    ↓
File dialog opens
    ↓
User selects invoice-12345.pdf (2.5 MB)
    ↓
File preview appears: ✅ invoice-12345.pdf [2.5 MB] [Remove]
    ↓
User clicks "Add to Inventory"
    ↓
Device saves... (loading spinner)
    ↓
Success toast appears: "New device added to inventory!"
    ↓
User opens Inventory Details
    ↓
Invoice section shows file with View/Download buttons
    ↓
User clicks "View" → PDF opens in new tab
    ↓
User clicks "Download" → File downloads to computer
    ↓
✅ FEATURE WORKING PERFECTLY!
```

---

## 📱 Screenshots You'll Take

When testing, capture these screens:

1. **Invoice Upload Section** (New Device form)
2. **File Selected Preview** (with Remove button)
3. **Inventory Details** (showing uploaded invoice)
4. **View Invoice** (PDF opened in browser)
5. **File Size Error** (if testing >10MB file)

---

## ✨ Polish & Details

Small touches that show quality:

- 🎨 Consistent color scheme (cyan for invoice section)
- 📏 Proper spacing and alignment
- 🔤 Clear, readable text
- 🎯 Intuitive icons (📎 paperclip, 📄 document)
- ✅ Green checkmark for selected file
- 🗑️ Remove button easy to spot
- 💡 Helpful format and size hints
- 🔔 Clear error messages

---

## 🏁 Final Visual Check

Before approving, verify the UI looks **professional and polished**:

- [ ] No misaligned elements
- [ ] Colors match existing sections
- [ ] Icons are clear and appropriate
- [ ] Text is readable and concise
- [ ] Buttons have proper hover states
- [ ] File preview looks good
- [ ] No console errors in browser
- [ ] Responsive on mobile/tablet

---

**Visual guide complete!** 📸

Use this to understand what you'll see when testing the fix.

If the UI matches these mockups, the fix is working correctly! ✅
