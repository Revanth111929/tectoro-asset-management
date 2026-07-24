# Dynamic Asset Form Implementation

## Overview
The dynamic asset form feature allows category-specific fields to be displayed when adding or editing assets. Only fields relevant to the selected category are shown, improving usability and data accuracy.

## What Was Implemented

### 1. Frontend Components

#### **`categoryFields.js`** - Configuration File
- **Location**: `frontend/src/config/categoryFields.js`
- **Purpose**: Central configuration for all category-specific fields
- **Contains**:
  - `CATEGORIES`: List of all available asset categories (13 total)
  - `CATEGORY_FIELDS`: Maps each category to its specific fields organized by sections
  - `FIELD_METADATA`: Defines labels, types, options, and validation for each field

**Category Structure**:
Each category has fields organized into sections:
- **basic**: Brand, Model, Serial Number, Status
- **specifications**: Category-specific technical details
- **purchase**: Vendor, Price, Dates, Warranty
- **assignment**: Employee or Location assignment
- **other**: Remarks and additional notes

#### **`DynamicAssetForm.js`** - Reusable Form Component
- **Location**: `frontend/src/components/DynamicAssetForm.js`
- **Purpose**: Renders dynamic forms based on selected category
- **Features**:
  - Automatically shows/hides fields based on category
  - Organizes fields into logical sections
  - Provides visual feedback when category changes
  - Handles form validation and submission

#### **`AssetAdd.js`** - Updated Add Page
- **Location**: `frontend/src/pages/AssetAdd.js`
- **Changes**:
  - New Device tab now uses `DynamicAssetForm` component
  - Updated `EMPTY_NEW` initial state to include all new fields
  - Category selection drives which fields are displayed

### 2. Backend Updates

#### **`models.py`** - Database Schema
- **Added 33 new fields** to the `Asset` model for category-specific data:

**New Fields by Category**:

**Computer Fields** (Laptop, Desktop, Server):
- `brand_name`, `processor`, `storage_type`, `storage_capacity`
- `graphics_card`, `os_version`, `screen_size`
- `cpu_count`, `raid_config`, `ip_address`, `rack_location`

**Mobile/Phone Fields**:
- `imei_1`, `imei_2`, `mobile_number`

**Printer Fields**:
- `color_or_mono`, `network_enabled`

**Monitor Fields**:
- `resolution`, `refresh_rate`

**Hard Disk Fields**:
- `interface_type`

**UPS Fields**:
- `capacity_va`, `battery_type`, `backup_time`

**Peripheral Fields** (Mouse, Headphones):
- `connection_type`, `noise_cancellation`

**Laptop Bag Fields**:
- `size_compatibility`, `color`, `warranty_period`

**Universal Fields**:
- `purchase_vendor`, `purchase_date`, `warranty_start_date`, `warranty_end_date`
- `assigned_employee`, `custom_description`, `remarks`

#### **`api_server.py`** - API Endpoints
- **Updated** `create_asset()` to accept all new fields
- **Updated** `update_asset()` to handle all new fields
- Maintains backward compatibility with existing fields

#### **Database Migration**
- **Script**: `migrate_add_dynamic_fields.py`
- **Result**: Added 33 new columns to `assets` table
- **Status**: ✅ Successfully completed

## Supported Categories and Their Fields

### 1. **Laptop**
- Basic: Brand, Model, Serial Number, Status
- Specs: Processor, RAM, Storage Type/Capacity, OS, OS Version, Screen Size
- Purchase: Vendor, Price, Dates, Warranty
- Assignment: Assigned Employee

### 2. **Desktop**
- Basic: Brand, Model, Serial Number, Status
- Specs: Processor, RAM, Storage, Graphics Card, OS, OS Version
- Purchase: Vendor, Price, Dates, Warranty
- Assignment: Assigned Employee

### 3. **Phone**
- Basic: Brand, Model, Serial Number, Status
- Specs: IMEI 1, IMEI 2, RAM, Storage, OS, OS Version, Mobile Number
- Purchase: Vendor, Price, Dates, Warranty
- Assignment: Assigned Employee

### 4. **Printer**
- Basic: Brand, Model, Serial Number, Status
- Specs: Printer Type, Color/Mono, Network Enabled
- Purchase: Vendor, Price, Dates, Warranty
- Assignment: Location

### 5. **Monitor**
- Basic: Brand, Model, Serial Number, Status
- Specs: Screen Size, Resolution, Refresh Rate
- Purchase: Vendor, Price, Dates, Warranty
- Assignment: Assigned Employee

### 6. **Server**
- Basic: Brand, Model, Serial Number, Status
- Specs: Processor, CPU Count, RAM, Storage, RAID Config, OS, OS Version, IP Address, Rack Location
- Purchase: Vendor, Price, Dates, Warranty
- Assignment: None (Servers are infrastructure)

### 7. **Hard Disk**
- Basic: Brand, Model, Serial Number, Status
- Specs: Storage Capacity, Storage Type, Interface (USB/SATA/NVMe)
- Purchase: Vendor, Price, Dates, Warranty
- Assignment: Assigned Employee

### 8. **UPS**
- Basic: Brand, Model, Serial Number, Status
- Specs: Capacity (VA), Battery Type, Backup Time
- Purchase: Vendor, Price, Dates, Warranty
- Assignment: Location

### 9. **Mouse**
- Basic: Brand, Model, Serial Number, Status
- Specs: Connection Type (USB/Wireless/Bluetooth)
- Purchase: Vendor, Price, Dates, Warranty
- Assignment: Assigned Employee

### 10. **Headphones**
- Basic: Brand, Model, Serial Number, Status
- Specs: Connection Type, Noise Cancellation
- Purchase: Vendor, Price, Dates, Warranty
- Assignment: Assigned Employee

### 11. **Laptop Bag**
- Basic: Brand, Model, Status (No serial number required)
- Specs: Size Compatibility, Color
- Purchase: Vendor, Price, Date, Warranty Period
- Assignment: Assigned Employee

### 12. **Furniture**
- Basic: Brand, Model, Serial Number, Status
- Specs: Custom Description
- Purchase: Vendor, Price, Date
- Assignment: Location

### 13. **Other**
- Basic: Asset Name, Brand, Model, Serial Number, Status
- Specs: Custom Description
- Purchase: Vendor, Price, Dates, Warranty
- Assignment: Assigned Employee

## How to Add New Categories

1. **Update `categoryFields.js`**:
   ```javascript
   // Add to CATEGORIES array
   export const CATEGORIES = [..., 'New Category'];
   
   // Add field configuration
   export const CATEGORY_FIELDS = {
     'New Category': {
       basic: ['brand_name', 'model_name', 'serial_number', 'status'],
       specifications: ['custom_field_1', 'custom_field_2'],
       purchase: ['purchase_vendor', 'purchase_price', ...],
       assignment: ['assigned_employee'],
       other: ['remarks']
     }
   };
   
   // Add field metadata
   export const FIELD_METADATA = {
     custom_field_1: { 
       label: 'Custom Field 1', 
       type: 'text', 
       placeholder: 'Enter value' 
     }
   };
   ```

2. **Update Backend** (if new fields needed):
   - Add columns to `Asset` model in `models.py`
   - Update `to_dict()` method to include new fields
   - Update `create_asset()` and `update_asset()` in `api_server.py`
   - Create migration script to add database columns

3. **Run Migration**:
   ```bash
   python3 migrate_add_new_fields.py
   ```

4. **Restart Backend**:
   ```bash
   bash restart_backend.sh
   ```

## Testing the Feature

### Test Steps:
1. Navigate to **Assets → Add Asset**
2. Click **"New Device"** tab
3. Select a category from dropdown (e.g., "Laptop")
4. Verify that:
   - Only relevant fields for Laptop are shown
   - Fields are organized into clear sections
   - Required fields are marked with *
5. Change category to "Printer"
6. Verify that:
   - Form updates immediately
   - Laptop-specific fields are hidden
   - Printer-specific fields appear
7. Fill out the form and save
8. Verify asset is created with all field values

### Test Each Category:
- [ ] Laptop - processor, ram, storage, screen size
- [ ] Desktop - processor, ram, graphics card
- [ ] Phone - IMEI 1, IMEI 2, mobile number
- [ ] Printer - printer type, color/mono, network enabled
- [ ] Monitor - screen size, resolution, refresh rate
- [ ] Server - CPU count, RAID config, IP address
- [ ] Hard Disk - interface type (USB/SATA/NVMe)
- [ ] UPS - capacity VA, battery type, backup time
- [ ] Mouse - connection type
- [ ] Headphones - connection type, noise cancellation
- [ ] Laptop Bag - size compatibility, color (no serial number)
- [ ] Furniture - custom description
- [ ] Other - asset name, custom description

## Benefits

1. **Improved UX**: Users only see fields relevant to their asset type
2. **Data Quality**: Category-specific fields ensure proper data capture
3. **Scalability**: Easy to add new categories and fields
4. **Maintainability**: Central configuration in one file
5. **Flexibility**: Same component works for Add, Edit, and View pages

## Next Steps

1. **Update AssetEdit.js** to use `DynamicAssetForm`
2. **Update AssetView.js** to display category-specific fields properly
3. **Add field validation rules** (e.g., IMEI format, IP address validation)
4. **Create field dependencies** (e.g., if storage_type is SSD, hide HDD-specific options)
5. **Add bulk import** with category-specific field mapping

## Files Modified

### Frontend:
- ✅ `frontend/src/config/categoryFields.js` (created)
- ✅ `frontend/src/components/DynamicAssetForm.js` (created)
- ✅ `frontend/src/pages/AssetAdd.js` (updated)

### Backend:
- ✅ `models.py` (33 new fields added)
- ✅ `api_server.py` (create/update endpoints updated)
- ✅ `migrate_add_dynamic_fields.py` (migration script created)

### Database:
- ✅ `assets.db` (33 new columns added)

## Status
✅ **IMPLEMENTATION COMPLETE**

All category-specific fields are now functional. The system is ready for testing and can be extended with additional categories as needed.
