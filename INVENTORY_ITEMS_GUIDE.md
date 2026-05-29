# Inventory Items Guide - Mouse & Headphones

## New Inventory Categories Added

### 1. Mouse Inventory
**Location**: Sidebar → INVENTORY → Mouse

**Tracks**:
- EMP ID - Employee assigned to
- Employee Name - Who is using the mouse
- Mouse Name - Brand/model name
- Serial Number - Unique identifier
- Model - Specific model number
- Location - Physical location
- Status - Available/Assigned/Maintenance/Retired

**Use Cases**:
- Track wireless/wired mice assigned to employees
- Monitor mouse inventory and availability
- See who has which mouse model
- Track replacements and maintenance

### 2. Headphones Inventory
**Location**: Sidebar → INVENTORY → Headphones

**Tracks**:
- EMP ID - Employee assigned to
- Employee Name - Who is using the headphones
- Headphones Name - Brand/model name
- Serial Number - Unique identifier
- Model - Specific model number
- Location - Physical location
- Status - Available/Assigned/Maintenance/Retired

**Use Cases**:
- Track headsets/headphones assigned to employees
- Monitor headphone inventory
- See who has which headphone model
- Track replacements for damaged headphones

---

## How to Add Mouse/Headphones

### Method 1: Add Single Item

1. Go to **Assets → Add Asset**
2. Fill in the form:
   - **Asset Name**: e.g., "Logitech MX Master 3" or "Sony WH-1000XM4"
   - **Category**: Select "Mouse" or "Headphones"
   - **Serial Number**: Unique serial number (required)
   - **Model Name**: Model number
   - **EMP ID**: Employee ID (if assigning)
   - **Employee Name**: Employee name (if assigning)
   - **Location**: Office location
   - **Status**: 
     - "Available" if in stock
     - "Assigned" if given to employee
3. Click **Save Asset**

### Method 2: Bulk Import via Excel

1. Go to **Assets → Import Excel**
2. Download the template
3. Add rows with:
   - Asset Name: Mouse/Headphones name
   - Category: "Mouse" or "Headphones"
   - Serial Number: Unique identifier
   - EMP ID: Employee ID (if assigned)
   - Employee Name: Employee name (if assigned)
   - Model Name: Model number
   - Location: Office location
   - Status: Available/Assigned
4. Upload the Excel file

---

## Viewing Inventory

### View All Mouse Items
1. Click **INVENTORY → Mouse** in sidebar
2. See all mouse items with assignment details
3. Filter by status (Available/Assigned/Maintenance/Retired)
4. Search by employee name, serial number, or model

### View All Headphones
1. Click **INVENTORY → Headphones** in sidebar
2. See all headphones with assignment details
3. Filter by status
4. Search by employee name, serial number, or model

---

## Assignment Tracking

### Assign to Employee
1. Go to the inventory page (Mouse or Headphones)
2. Click **Edit** (pencil icon) on the item
3. Fill in:
   - **EMP ID**: Employee ID
   - **Employee Name**: Employee name
   - **Status**: Change to "Assigned"
4. Save changes

### Unassign from Employee
1. Edit the item
2. Clear **EMP ID** and **Employee Name**
3. Change **Status** to "Available"
4. Save changes

### Transfer Between Employees
1. Edit the item
2. Update **EMP ID** and **Employee Name** to new employee
3. Optionally update **Old User** field to track previous owner
4. Save changes

---

## Bulk Operations

All bulk operations work on Mouse and Headphones inventory:

### Bulk Status Change
1. Select multiple items using checkboxes
2. Click **Bulk Actions** → **Change Status**
3. Select new status (Available/Assigned/Maintenance/Retired)
4. Click **Update Status**

### Bulk Delete
1. Select items to delete
2. Click **Bulk Actions** → **Delete Selected**
3. Confirm deletion

### Bulk Export
1. Select items to export
2. Click **Bulk Actions** → **Export Selected**
3. CSV file downloads with selected items

---

## Reports

### View All Assignments
Go to **All Assets** page and:
- Filter by Category: "Mouse" or "Headphones"
- Filter by Status: "Assigned"
- See all assigned items with employee details

### Available Inventory
- Filter by Status: "Available"
- See all unassigned items ready for distribution

### Maintenance Items
- Filter by Status: "Maintenance"
- Track items under repair or replacement

---

## Example Data

### Mouse Example
```
Asset Name: Logitech MX Master 3
Category: Mouse
Serial Number: LGT-MX3-001
Model Name: MX Master 3
EMP ID: EMP001
Employee Name: John Doe
Location: HQ - Floor 2
Status: Assigned
```

### Headphones Example
```
Asset Name: Sony WH-1000XM4
Category: Headphones
Serial Number: SNY-WH4-001
Model Name: WH-1000XM4
EMP ID: EMP002
Employee Name: Jane Smith
Location: HQ - Floor 3
Status: Assigned
```

---

## Best Practices

1. **Serial Numbers**: Always use unique serial numbers for tracking
2. **Assignment**: Update status to "Assigned" when giving to employee
3. **Location**: Keep location updated for easy physical tracking
4. **Old User**: Track previous owners in "Old User" field
5. **Maintenance**: Mark items as "Maintenance" when under repair
6. **Retired**: Mark old/broken items as "Retired" instead of deleting

---

## Dashboard Statistics

Mouse and Headphones are included in:
- **Total Assets** count
- **Category breakdown** chart
- **Status distribution** (Available/Assigned/Maintenance/Retired)
- **Recent Activity** logs

---

## Complete Inventory Categories

Now available in the system:
1. ✓ Laptops
2. ✓ Mobiles
3. ✓ Printers
4. ✓ Hard Disks
5. ✓ UPS Devices
6. ✓ Laptop Bags
7. ✓ **Mouse** (NEW)
8. ✓ **Headphones** (NEW)

All categories support:
- Assignment tracking (EMP ID + Employee Name)
- Bulk operations (status change, delete, export)
- Search and filtering
- Status management
- Excel import/export
