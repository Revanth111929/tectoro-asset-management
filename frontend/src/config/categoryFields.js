// categoryFields.js - Define which fields to show for each asset category

// Define all available categories first
export const CATEGORIES = [
  'Laptop', 'CPU', 'Monitor', 'Printer', 'Phone', 'Server', 
  'Mouse', 'Headphones', 'Hard Disk', 'UPS', 'Laptop Bag', 'Other'
];

export const CATEGORY_FIELDS = {
  'Laptop': {
    basic: ['brand_name', 'model_name', 'serial_number', 'location'],
    specifications: ['processor', 'ram', 'storage_type', 'storage_capacity', 'os', 'os_version', 'screen_size'],
    purchase: ['purchase_vendor', 'purchase_price', 'purchase_date', 'warranty_start_date', 'warranty_end_date'],
    assignment: [],
    other: ['charger_serial', 'old_user', 'old_device', 'date', 'remarks', 'comments']
  },
  
  'CPU': {
    basic: ['brand_name', 'model_name', 'serial_number', 'location'],
    specifications: ['processor', 'ram', 'storage_type', 'storage_capacity', 'graphics_card', 'os', 'os_version'],
    purchase: ['purchase_vendor', 'purchase_price', 'purchase_date', 'warranty_start_date', 'warranty_end_date'],
    assignment: [],
    other: ['old_user', 'old_device', 'date', 'remarks', 'comments']
  },
  
  'Phone': {
    basic: ['brand_name', 'model_name', 'serial_number', 'location'],
    specifications: ['imei_1', 'imei_2', 'ram', 'storage_capacity', 'os', 'os_version', 'mobile_number'],
    purchase: ['purchase_vendor', 'purchase_price', 'purchase_date', 'warranty_start_date', 'warranty_end_date'],
    assignment: [],
    other: ['old_user', 'old_device', 'date', 'remarks', 'comments']
  },
  
  'Printer': {
    basic: ['brand_name', 'model_name', 'serial_number', 'location'],
    specifications: ['printer_type', 'color_or_mono', 'network_enabled'],
    purchase: ['purchase_vendor', 'purchase_price', 'purchase_date', 'warranty_start_date', 'warranty_end_date'],
    assignment: [],
    other: ['old_user', 'old_device', 'date', 'remarks', 'comments']
  },
  
  'Monitor': {
    basic: ['brand_name', 'model_name', 'serial_number', 'location'],
    specifications: ['screen_size', 'resolution', 'refresh_rate'],
    purchase: ['purchase_vendor', 'purchase_price', 'purchase_date', 'warranty_start_date', 'warranty_end_date'],
    assignment: [],
    other: ['old_user', 'old_device', 'date', 'remarks', 'comments']
  },
  
  'Server': {
    basic: ['brand_name', 'model_name', 'serial_number', 'location'],
    specifications: ['processor', 'cpu_count', 'ram', 'storage_capacity', 'raid_config', 'os', 'os_version', 'ip_address', 'rack_location'],
    purchase: ['purchase_vendor', 'purchase_price', 'purchase_date', 'warranty_start_date', 'warranty_end_date'],
    assignment: [],
    other: ['old_user', 'old_device', 'date', 'remarks', 'comments']
  },
  
  'Hard Disk': {
    basic: ['brand_name', 'model_name', 'serial_number', 'location'],
    specifications: ['storage_capacity', 'storage_type', 'interface_type'],
    purchase: ['purchase_vendor', 'purchase_price', 'purchase_date', 'warranty_start_date', 'warranty_end_date'],
    assignment: [],
    other: ['old_user', 'old_device', 'date', 'remarks', 'comments']
  },
  
  'UPS': {
    basic: ['brand_name', 'model_name', 'serial_number', 'location'],
    specifications: ['capacity_va', 'battery_type', 'backup_time'],
    purchase: ['purchase_vendor', 'purchase_price', 'purchase_date', 'warranty_start_date', 'warranty_end_date'],
    assignment: [],
    other: ['old_user', 'old_device', 'date', 'remarks', 'comments']
  },
  
  'Mouse': {
    basic: ['brand_name', 'model_name', 'serial_number', 'location'],
    specifications: ['connection_type'],
    purchase: ['purchase_vendor', 'purchase_price', 'purchase_date', 'warranty_start_date', 'warranty_end_date'],
    assignment: [],
    other: ['old_user', 'old_device', 'date', 'remarks', 'comments']
  },
  
  'Headphones': {
    basic: ['brand_name', 'model_name', 'serial_number', 'location'],
    specifications: ['connection_type', 'noise_cancellation'],
    purchase: ['purchase_vendor', 'purchase_price', 'purchase_date', 'warranty_start_date', 'warranty_end_date'],
    assignment: [],
    other: ['old_user', 'old_device', 'date', 'remarks', 'comments']
  },
  
  'Laptop Bag': {
    basic: ['brand_name', 'model_name', 'location'],
    specifications: ['size_compatibility', 'color'],
    purchase: ['purchase_vendor', 'purchase_price', 'purchase_date', 'warranty_period'],
    assignment: [],
    other: ['old_user', 'old_device', 'date', 'remarks', 'comments']
  },
  
  'Other': {
    basic: ['asset_name', 'brand_name', 'model_name', 'serial_number', 'location'],
    specifications: ['custom_description'],
    purchase: ['purchase_vendor', 'purchase_price', 'purchase_date', 'warranty_start_date', 'warranty_end_date'],
    assignment: [],
    other: ['old_user', 'old_device', 'date', 'remarks', 'comments']
  }
};

// Field metadata - labels, types, options
export const FIELD_METADATA = {
  // Basic fields
  asset_name: { label: 'Asset Name', type: 'text', placeholder: 'Enter asset name', required: false },
  brand_name: { label: 'Brand Name', type: 'text', placeholder: 'e.g. Dell, HP, Apple', required: true },
  model_name: { label: 'Model Name', type: 'text', placeholder: 'e.g. Latitude 5540, ThinkPad X1', required: true },
  serial_number: { label: 'Serial Number', type: 'text', placeholder: 'e.g. SN-DELL-001', required: true },
  category: { label: 'Category', type: 'select', options: CATEGORIES, required: true },
  
  // Computer Specifications
  processor: { label: 'Processor', type: 'text', placeholder: 'e.g. Intel Core i7-12th Gen, AMD Ryzen 5' },
  ram: { label: 'RAM', type: 'select', options: ['4GB', '8GB', '16GB', '32GB', '64GB', '128GB', '256GB', 'Other'] },
  storage_type: { label: 'Storage Type', type: 'select', options: ['SSD', 'HDD', 'Hybrid (SSD+HDD)', 'NVMe SSD'] },
  storage_capacity: { label: 'Storage Capacity', type: 'text', placeholder: 'e.g. 512GB, 1TB, 2TB' },
  graphics_card: { label: 'Graphics Card', type: 'text', placeholder: 'e.g. NVIDIA GTX 1650, Integrated' },
  os: { label: 'Operating System', type: 'select', options: ['Windows 11', 'Windows 10', 'Ubuntu', 'macOS', 'Chrome OS', 'Android', 'iOS', 'Linux', 'Windows Server', 'Other'] },
  os_version: { label: 'OS Version', type: 'text', placeholder: 'e.g. 22H2, 13.5, Ubuntu 22.04' },
  screen_size: { label: 'Screen Size', type: 'text', placeholder: 'e.g. 15.6", 27", 13.3"' },
  
  // Mobile/Phone specific
  imei_1: { label: 'IMEI 1', type: 'text', placeholder: 'Primary IMEI number' },
  imei_2: { label: 'IMEI 2', type: 'text', placeholder: 'Secondary IMEI (if dual SIM)' },
  mobile_number: { label: 'Mobile Number', type: 'text', placeholder: 'Optional - SIM card number' },
  
  // Printer specific
  printer_type: { label: 'Printer Type', type: 'select', options: ['Laser', 'Inkjet', 'Dot Matrix', 'Thermal', '3D Printer', 'Other'] },
  color_or_mono: { label: 'Color or Monochrome', type: 'select', options: ['Color', 'Monochrome'] },
  network_enabled: { label: 'Network Enabled', type: 'select', options: ['Yes', 'No'] },
  
  // Monitor specific
  resolution: { label: 'Resolution', type: 'select', options: ['1920x1080 (Full HD)', '2560x1440 (2K)', '3840x2160 (4K)', '1366x768', '1600x900', 'Other'] },
  refresh_rate: { label: 'Refresh Rate', type: 'text', placeholder: 'e.g. 60Hz, 144Hz, 165Hz' },
  
  // Server specific
  cpu_count: { label: 'CPU Count', type: 'number', placeholder: 'Number of CPUs', min: '1' },
  raid_config: { label: 'RAID Configuration', type: 'text', placeholder: 'e.g. RAID 1, RAID 5, RAID 10' },
  ip_address: { label: 'IP Address', type: 'text', placeholder: 'e.g. 192.168.1.100' },
  rack_location: { label: 'Rack Location', type: 'text', placeholder: 'e.g. Rack A, Slot 3' },
  
  // Hard Disk specific
  interface_type: { label: 'Interface Type', type: 'select', options: ['USB', 'SATA', 'NVMe', 'SAS', 'Thunderbolt'] },
  
  // UPS specific
  capacity_va: { label: 'Capacity (VA)', type: 'text', placeholder: 'e.g. 1000VA, 1500VA' },
  battery_type: { label: 'Battery Type', type: 'text', placeholder: 'e.g. Lead Acid, Lithium-ion' },
  backup_time: { label: 'Backup Time', type: 'text', placeholder: 'e.g. 30 minutes, 1 hour' },
  
  // Peripherals specific
  connection_type: { label: 'Connection Type', type: 'select', options: ['USB', 'Wireless', 'Bluetooth', 'USB-C', 'Wired', '3.5mm Jack'] },
  noise_cancellation: { label: 'Noise Cancellation', type: 'select', options: ['Yes', 'No'] },
  
  // Laptop Bag specific
  size_compatibility: { label: 'Size Compatibility', type: 'text', placeholder: 'e.g. Up to 15.6", 13-14 inch' },
  color: { label: 'Color', type: 'text', placeholder: 'e.g. Black, Gray, Blue' },
  warranty_period: { label: 'Warranty Period', type: 'text', placeholder: 'e.g. 1 year, 2 years' },
  
  // General
  custom_description: { label: 'Description', type: 'textarea', placeholder: 'Detailed description of the asset', rows: 3 },
  location: { label: 'Location', type: 'text', placeholder: 'e.g. Server Room, Office Floor 3' },
  
  // Purchase & Warranty
  purchase_vendor: { label: 'Purchase Vendor', type: 'text', placeholder: 'e.g. Amazon, Dell Direct, Local Vendor' },
  purchase_price: { label: 'Purchase Price (₹)', type: 'number', placeholder: '0.00', step: '0.01' },
  purchase_date: { label: 'Purchase Date', type: 'date' },
  warranty_start_date: { label: 'Warranty Start Date', type: 'date' },
  warranty_end_date: { label: 'Warranty End Date', type: 'date' },
  
  // Assignment
  assigned_employee: { label: 'Assigned Employee', type: 'text', placeholder: 'Employee name or ID' },
  
  // Other
  remarks: { label: 'Remarks', type: 'textarea', placeholder: 'Any additional notes or comments…', rows: 3 },
  
  // Legacy/Additional fields for existing device
  old_user: { label: 'Previous User', type: 'text', placeholder: 'Name of previous user' },
  old_device: { label: 'Previous Device', type: 'text', placeholder: 'Device being replaced' },
  date: { label: 'Assignment Date', type: 'date' },
  charger_serial: { label: 'Charger Serial', type: 'text', placeholder: 'Charger serial number' },
  comments: { label: 'Comments', type: 'textarea', placeholder: 'Any notes...', rows: 3 }
};

// Get fields for a specific category
export const getFieldsForCategory = (category) => {
  return CATEGORY_FIELDS[category] || CATEGORY_FIELDS['Other'];
};

// Check if a field should be shown for a category
export const shouldShowField = (fieldName, category) => {
  if (!category) return false;
  const fields = getFieldsForCategory(category);
  return Object.values(fields).flat().includes(fieldName);
};
