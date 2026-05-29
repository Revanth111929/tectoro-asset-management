# Bulk Status Change - User Guide

## How to Change Status for Multiple Assets

### Step-by-Step Instructions

1. **Navigate to Assets Page**
   - Go to "All Assets" page OR
   - Go to any Inventory category (Laptops, Mobiles, Printers, etc.)

2. **Select Assets**
   - Click the checkbox in the leftmost column for each asset you want to update
   - OR click the checkbox in the table header to select all assets on the current page

3. **Choose Bulk Action**
   - Once assets are selected, a toolbar appears showing "X selected"
   - Click the "Bulk Actions" dropdown
   - Select "Change Status"

4. **Select New Status**
   - A modal dialog will open
   - Choose the new status from the dropdown:
     - Available
     - Assigned
     - Maintenance
     - Retired

5. **Confirm Update**
   - Click "Update Status" button
   - Wait for the operation to complete
   - You'll see a success message showing how many assets were updated

### Available on These Pages

✓ All Assets (`/assets`)
✓ Laptop Inventory (`/inventory/laptops`)
✓ Mobile Inventory (`/inventory/mobiles`)
✓ Printer Inventory (`/inventory/printers`)
✓ Hard Disk Inventory (`/inventory/hard-disks`)
✓ UPS Inventory (`/inventory/ups`)
✓ Laptop Bag Inventory (`/inventory/laptop-bags`)

### Other Bulk Actions

**Delete Selected**
- Permanently deletes all selected assets
- Requires confirmation
- Cannot be undone

**Export Selected**
- Downloads selected assets as CSV file
- Includes all relevant columns for that category
- File name includes date stamp

### Tips

- You can select assets across multiple pages, but selection clears when you change pages
- The status change happens individually for each asset
- If some assets fail to update, you'll see which ones and why
- All status changes are logged in the Activity Log

### Troubleshooting

**"Failed to update some assets"**
- Check if you have permission to edit assets
- Verify the backend server is running
- Check browser console for detailed error messages
- Try updating assets one at a time to identify the problem

**Selection not working**
- Refresh the page
- Clear browser cache
- Check if JavaScript is enabled

**Modal not appearing**
- Ensure you've selected at least one asset
- Check if popup blockers are disabled
- Try a different browser

### Status Meanings

- **Available**: Asset is in stock and ready to be assigned
- **Assigned**: Asset is currently assigned to an employee
- **Maintenance**: Asset is under repair or maintenance
- **Retired**: Asset is no longer in use (end of life)

---

For technical issues, check the backend logs or contact your system administrator.
