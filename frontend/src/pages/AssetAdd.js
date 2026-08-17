// AssetAdd.js – Two tabs: New Device (inventory) | Existing Device (full form)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetAPI, employeeAPI, ackAPI } from '../services/api';
import DynamicAssetForm from '../components/DynamicAssetForm';
import EmployeeAutocomplete from '../components/EmployeeAutocomplete'; // Phase 2
import { CATEGORY_FIELDS, FIELD_METADATA } from '../config/categoryFields';

// ── NEW DEVICE FORM (inventory entry, no employee) ────────────────────────────
const EMPTY_NEW = {
  // Basic fields
  asset_name: '', 
  category: '', 
  serial_number: '', 
  model_name: '',
  brand_name: '',
  status: 'Available',
  
  // Legacy fields
  os: '', 
  version: '', 
  ram: '', 
  location: '',
  invoice_number: '', 
  invoice_date: '', 
  warranty_date: '',
  purchase_price: '', 
  quantity: '1', 
  configuration: '',
  charger_serial: '', 
  laptop_bag_serial: '', 
  hard_disk_serial: '',
  hard_disk_capacity: '', 
  ups_serial: '', 
  ups_capacity: '',
  printer_type: '', 
  printer_model: '',
  mobile_imei: '', 
  mobile_number_sim: '', 
  testing_status: '',
  comments: '',
  
  // New dynamic category-specific fields
  // Computer specifications
  processor: '',
  storage_type: '',
  storage_capacity: '',
  graphics_card: '',
  os_version: '',
  screen_size: '',
  
  // Mobile/Phone specific
  imei_1: '',
  imei_2: '',
  mobile_number: '',
  
  // Printer specific
  color_or_mono: '',
  network_enabled: '',
  
  // Monitor specific
  resolution: '',
  refresh_rate: '',
  
  // Server specific
  cpu_count: '',
  raid_config: '',
  ip_address: '',
  rack_location: '',
  
  // Hard Disk specific
  interface_type: '',
  
  // UPS specific
  capacity_va: '',
  battery_type: '',
  backup_time: '',
  
  // Peripherals
  connection_type: '',
  noise_cancellation: '',
  
  // Laptop Bag specific
  size_compatibility: '',
  color: '',
  warranty_period: '',
  
  // Purchase & Warranty
  purchase_vendor: '',
  purchase_date: '',
  warranty_start_date: '',
  warranty_end_date: '',
  
  // Assignment
  assigned_employee: '',
  
  // Other
  custom_description: '',
  remarks: '',
};

// ── EXISTING DEVICE FORM (full form with employee) ────────────────────────────
const EMPTY_EXISTING = {
  // Employee fields
  emp_id: '', 
  employee_name: '', 
  mobile_number: '', 
  employee_email: '',
  
  // Basic fields
  asset_name: '', 
  category: '', 
  serial_number: '', 
  model_name: '',
  brand_name: '',
  status: 'Assigned',
  
  // Legacy fields
  os: '', 
  version: '', 
  ram: '', 
  location: '',
  invoice_number: '', 
  invoice_date: '', 
  warranty_date: '',
  purchase_price: '', 
  quantity: '1', 
  configuration: '',
  charger_serial: '', 
  laptop_bag_serial: '', 
  hard_disk_serial: '',
  hard_disk_capacity: '', 
  ups_serial: '', 
  ups_capacity: '',
  printer_type: '', 
  printer_model: '',
  mobile_imei: '', 
  mobile_number_sim: '', 
  testing_status: '',
  comments: '',
  
  // New dynamic category-specific fields
  processor: '',
  storage_type: '',
  storage_capacity: '',
  graphics_card: '',
  os_version: '',
  screen_size: '',
  imei_1: '',
  imei_2: '',
  color_or_mono: '',
  network_enabled: '',
  resolution: '',
  refresh_rate: '',
  cpu_count: '',
  raid_config: '',
  ip_address: '',
  rack_location: '',
  interface_type: '',
  capacity_va: '',
  battery_type: '',
  backup_time: '',
  connection_type: '',
  noise_cancellation: '',
  size_compatibility: '',
  color: '',
  warranty_period: '',
  purchase_vendor: '',
  purchase_date: '',
  warranty_start_date: '',
  warranty_end_date: '',
  assigned_employee: '',
  custom_description: '',
  remarks: '',
  
  // Old device tracking
  old_user: '', 
  date: '', 
  old_device: '',
};
const SEND_ACK_DEFAULT = false;

// ── Reusable Field wrapper ────────────────────────────────────────────────────
const F = ({ label, required, col = 'col-md-4', error, children }) => (
  <div className={col}>
    <label className="form-label fw-500">
      {label}{required && <span className="text-danger ms-1">*</span>}
    </label>
    {children}
    {error && <div className="text-danger small mt-1">{error}</div>}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// NEW DEVICE TAB - Using Dynamic Form
// ═══════════════════════════════════════════════════════════════════════════════
function NewDeviceForm({ navigate }) {
  const [form,     setForm]     = useState(EMPTY_NEW);
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);

  const validate = () => {
    const errs = {};
    // Category is always required
    if (!form.category) {
      errs.category = 'Required';
      return errs;
    }
    
    // Check required fields based on FIELD_METADATA
    const categoryFields = CATEGORY_FIELDS[form.category];
    if (categoryFields) {
      // Get all fields for this category
      const allFields = [
        ...(categoryFields.basic || []),
        ...(categoryFields.specifications || []),
        ...(categoryFields.purchase || []),
        ...(categoryFields.assignment || []),
        ...(categoryFields.other || [])
      ];
      
      // Check each field for required validation
      allFields.forEach(fieldName => {
        const metadata = FIELD_METADATA[fieldName];
        if (metadata && metadata.required) {
          if (!form[fieldName]?.toString().trim()) {
            errs[fieldName] = 'Required';
          }
        }
      });
    }
    
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true); setApiError('');
    try {
      // Generate asset_name from brand_name and model_name if not provided
      const assetData = { ...form };
      if (!assetData.asset_name && assetData.brand_name && assetData.model_name) {
        assetData.asset_name = `${assetData.brand_name} ${assetData.model_name}`.trim();
      } else if (!assetData.asset_name && assetData.brand_name) {
        assetData.asset_name = assetData.brand_name;
      } else if (!assetData.asset_name && assetData.model_name) {
        assetData.asset_name = assetData.model_name;
      }
      
      await assetAPI.create({ 
        ...assetData, 
        emp_id: '', 
        employee_name: '', 
        mobile_number: '', 
        employee_email: '' 
      }, invoiceFile);
      navigate('/assets', { state: { success: 'New device added to inventory!' } });
    } catch (err) {
      // Phase 3: Enhanced error handling
      const errorData = err.response?.data;
      if (errorData) {
        // Display main error message
        const mainError = errorData.error || 'Failed to save asset';
        setApiError(mainError);
        
        // If there are specific field errors, set them
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const fieldErrors = {};
          errorData.errors.forEach(error => {
            // Try to extract field name from error message
            const lowerError = error.toLowerCase();
            if (lowerError.includes('serial number')) {
              fieldErrors.serial_number = error;
            } else if (lowerError.includes('asset name')) {
              fieldErrors.asset_name = error;
            } else if (lowerError.includes('category')) {
              fieldErrors.category = error;
            }
          });
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          }
        }
        
        // Log warnings if present
        if (errorData.warnings && Array.isArray(errorData.warnings)) {
          errorData.warnings.forEach(warning => {
            console.warn('Validation warning:', warning);
          });
        }
      } else {
        setApiError('Failed to save asset');
      }
    } finally { setSaving(false); }
  };

  return (
    <>
      {apiError && (
        <div className="alert alert-danger mb-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Error:</strong> {apiError}
        </div>
      )}
      
      <DynamicAssetForm
        form={form}
        setForm={setForm}
        errors={errors}
        onSubmit={handleSubmit}
        saving={saving}
        onCancel={() => navigate('/assets')}
        invoiceFile={invoiceFile}
        setInvoiceFile={setInvoiceFile}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXISTING DEVICE TAB - NEW 5-STEP WORKFLOW
// ═══════════════════════════════════════════════════════════════════════════════
function ExistingDeviceForm({ navigate }) {
  // Step navigation
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Employee selection
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Step 2: Action selection (assign or replace)
  const [deviceAction, setDeviceAction] = useState(''); // 'assign' or 'replace'
  
  // Step 3: Device selection
  const [primaryDevice, setPrimaryDevice] = useState(null);
  const [oldDevice, setOldDevice] = useState(null);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [employeeDevices, setEmployeeDevices] = useState([]);
  const [deviceSearchQuery, setDeviceSearchQuery] = useState('');
  
  // Step 4: Accessories selection
  const [selectedAccessories, setSelectedAccessories] = useState([]);
  const [availableAccessories, setAvailableAccessories] = useState({ mouse: [], headphones: [] });
  const [mouseSearchQuery, setMouseSearchQuery] = useState('');
  const [headphonesSearchQuery, setHeadphonesSearchQuery] = useState('');
  
  // Step 5: Review and submission
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [errors, setErrors] = useState({});
  
  // Load available devices (for assign) on mount
  useEffect(() => {
    const loadAvailableDevices = async () => {
      try {
        const res = await assetAPI.getAll({ status: 'Available' });
        const assetList = res.data.assets || res.data || [];
        // Exclude Mouse and Headphones from primary device selection
        const devices = assetList.filter(asset => 
          asset.category !== 'Mouse' && asset.category !== 'Headphones'
        );
        setAvailableDevices(devices);
      } catch (err) {
        console.error('Failed to load available devices:', err);
      }
    };
    loadAvailableDevices();
  }, []);
  
  // Load available accessories on mount
  useEffect(() => {
    const loadAccessories = async () => {
      try {
        const res = await assetAPI.getAll({ status: 'Available' });
        const assetList = res.data.assets || res.data || [];
        const mouse = assetList.filter(asset => asset.category === 'Mouse');
        const headphones = assetList.filter(asset => asset.category === 'Headphones');
        setAvailableAccessories({ mouse, headphones });
      } catch (err) {
        console.error('Failed to load accessories:', err);
      }
    };
    loadAccessories();
  }, []);
  
  // When employee is selected, load their current devices
  const handleEmployeeSelect = async (employee) => {
    setSelectedEmployee(employee);
    setErrors({});
    try {
      const res = await employeeAPI.getAssets(employee.emp_id);
      const assets = res.data.assets || [];
      setEmployeeDevices(assets);
    } catch (err) {
      console.error('Failed to load employee devices:', err);
      setEmployeeDevices([]);
    }
  };
  
  const handleEmployeeClear = () => {
    setSelectedEmployee(null);
    setEmployeeDevices([]);
    setCurrentStep(1);
  };
  
  const handleStepNext = () => {
    // Validate current step
    const errs = {};
    
    if (currentStep === 1) {
      if (!selectedEmployee) {
        errs.employee = 'Please select an employee';
        setErrors(errs);
        return;
      }
    }
    
    if (currentStep === 2) {
      if (!deviceAction) {
        errs.action = 'Please choose assign or replace';
        setErrors(errs);
        return;
      }
    }
    
    if (currentStep === 3) {
      if (!primaryDevice) {
        errs.device = 'Please select a device';
        setErrors(errs);
        return;
      }
      if (deviceAction === 'replace' && !oldDevice) {
        errs.oldDevice = 'Please select the device to replace';
        setErrors(errs);
        return;
      }
    }
    
    setErrors({});
    setCurrentStep(currentStep + 1);
  };
  
  const handleStepBack = () => {
    setErrors({});
    setCurrentStep(currentStep - 1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation
    if (!selectedEmployee || !primaryDevice || !deviceAction) {
      setApiError('Missing required information. Please complete all steps.');
      return;
    }
    
    if (deviceAction === 'replace' && !oldDevice) {
      setApiError('Please select the device to replace.');
      return;
    }
    
    setSaving(true);
    setApiError('');
    
    try {
      console.group('=== EXISTING DEVICE CONFIRM ASSIGNMENT ===');
      console.log('Action:', deviceAction);
      console.log('Employee:', selectedEmployee);
      console.log('Old Device:', oldDevice);
      console.log('New Device (Primary):', primaryDevice);
      console.log('Accessories:', selectedAccessories);
      console.log('Reason:', reason);
      console.log('Remarks:', remarks);
      console.groupEnd();
      
      if (deviceAction === 'assign') {
        // Use the assign endpoint for ASSIGN DEVICE action
        const payload = {
          asset_id: primaryDevice.id || primaryDevice.asset_id,
          emp_id: selectedEmployee.emp_id,
          comments: remarks || reason || 'Device assignment'
        };
        
        console.group('=== API REQUEST (ASSIGN) ===');
        console.log('Endpoint: POST /api/operations/assign');
        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.groupEnd();
        
        const response = await assetAPI.assignAsset(payload);
        
        console.group('=== API RESPONSE (ASSIGN) ===');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        console.groupEnd();
        
      } else if (deviceAction === 'replace') {
        // Use the replacement endpoint for REPLACE DEVICE action
        const payload = {
          employee_id: selectedEmployee.emp_id,
          employee_name: selectedEmployee.employee_name,
          employee_email: selectedEmployee.email || selectedEmployee.employee_email || '',
          old_asset_id: oldDevice.id || oldDevice.asset_id,
          new_asset_id: primaryDevice.id || primaryDevice.asset_id,
          reason: reason || 'Device replacement',
          replacement_date: new Date().toISOString().split('T')[0],
          old_asset_condition: 'Good',
          remarks: remarks || ''
        };
        
        console.group('=== API REQUEST (REPLACE) ===');
        console.log('Endpoint: POST /api/asset-replacements');
        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.groupEnd();
        
        const response = await assetAPI.createAssetReplacement(payload);
        
        console.group('=== API RESPONSE (REPLACE) ===');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        console.groupEnd();
      }
      
      // Handle accessories if any (for both actions)
      if (selectedAccessories.length > 0) {
        console.log('Assigning accessories:', selectedAccessories.length);
        for (const accessory of selectedAccessories) {
          await assetAPI.assignAsset({
            asset_id: accessory.id || accessory.asset_id,
            emp_id: selectedEmployee.emp_id,
            comments: 'Accessory assignment'
          });
        }
      }
      
      navigate('/assets', { 
        state: { 
          success: deviceAction === 'replace' 
            ? 'Device replaced successfully!' 
            : 'Device assigned successfully!' 
        } 
      });
    } catch (err) {
      console.group('=== API ERROR ===');
      console.error('Full error:', err);
      console.error('Status:', err.response?.status);
      console.error('Response:', err.response?.data);
      console.error('Request URL:', err.config?.url);
      console.error('Request method:', err.config?.method);
      console.error('Request data:', err.config?.data);
      console.groupEnd();
      
      const backendError = 
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.response?.data?.details ||
        err?.message ||
        'Unknown error';
      setApiError(`Error: ${backendError}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Filtered device lists for search
  const filteredDevices = availableDevices.filter(device =>
    device.asset_name?.toLowerCase().includes(deviceSearchQuery.toLowerCase()) ||
    device.serial_number?.toLowerCase().includes(deviceSearchQuery.toLowerCase()) ||
    device.model_name?.toLowerCase().includes(deviceSearchQuery.toLowerCase()) ||
    device.category?.toLowerCase().includes(deviceSearchQuery.toLowerCase())
  );
  
  const filteredMouse = availableAccessories.mouse.filter(mouse =>
    mouse.asset_name?.toLowerCase().includes(mouseSearchQuery.toLowerCase()) ||
    mouse.serial_number?.toLowerCase().includes(mouseSearchQuery.toLowerCase())
  );
  
  const filteredHeadphones = availableAccessories.headphones.filter(hp =>
    hp.asset_name?.toLowerCase().includes(headphonesSearchQuery.toLowerCase()) ||
    hp.serial_number?.toLowerCase().includes(headphonesSearchQuery.toLowerCase())
  );
  
  const toggleAccessory = (accessory) => {
    const accessoryId = accessory.id || accessory.asset_id;
    const isSelected = selectedAccessories.some(acc => (acc.id || acc.asset_id) === accessoryId);
    
    if (isSelected) {
      setSelectedAccessories(selectedAccessories.filter(acc => (acc.id || acc.asset_id) !== accessoryId));
    } else {
      setSelectedAccessories([...selectedAccessories, accessory]);
    }
  };
  
  return (
    <>
      {apiError && (
        <div className="alert alert-danger mb-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Error:</strong> {apiError}
        </div>
      )}
      
      {/* Step Progress Indicator */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          {[1, 2, 3, 4, 5].map(step => (
            <div key={step} className="d-flex align-items-center" style={{ flex: 1 }}>
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${
                  step < currentStep ? 'bg-success text-white' :
                  step === currentStep ? 'bg-primary text-white' : 'bg-light text-muted'
                }`}
                style={{ width: 36, height: 36 }}
              >
                {step < currentStep ? '✓' : step}
              </div>
              {step < 5 && (
                <div 
                  className={`flex-grow-1 mx-2 ${step < currentStep ? 'bg-success' : 'bg-light'}`}
                  style={{ height: 2 }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="d-flex justify-content-between small text-muted px-2">
          <span style={{ width: '20%' }}>Employee</span>
          <span style={{ width: '20%' }} className="text-center">Action</span>
          <span style={{ width: '20%' }} className="text-center">Device</span>
          <span style={{ width: '20%' }} className="text-center">Accessories</span>
          <span style={{ width: '20%' }} className="text-end">Review</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* STEP 1: Employee Search */}
        {currentStep === 1 && (
          <div className="p-4 rounded" style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.2)' }}>
            <h5 className="fw-bold mb-3" style={{ color:'#2563eb' }}>
              <i className="bi bi-person-fill me-2"></i>Step 1: Select Employee
            </h5>
            
            <div className="mb-3">
              <label className="form-label fw-500">
                Search Employee <span className="text-danger">*</span>
              </label>
              <EmployeeAutocomplete
                value={selectedEmployee}
                onChange={handleEmployeeSelect}
                onClear={handleEmployeeClear}
                required={true}
                placeholder="Search by Employee ID, Name, Email, or Phone..."
                error={errors.employee}
                showDetails={true}
              />
              <small className="text-muted d-block mt-1">
                <i className="bi bi-info-circle me-1"></i>
                Employee information will be loaded from Employee Master
              </small>
            </div>
            
            {selectedEmployee && (
              <div className="p-3 rounded bg-light">
                <h6 className="fw-bold mb-2">Employee Details:</h6>
                <div className="row g-2 small">
                  <div className="col-md-6">
                    <strong>Employee ID:</strong> {selectedEmployee.emp_id}
                  </div>
                  <div className="col-md-6">
                    <strong>Name:</strong> {selectedEmployee.employee_name}
                  </div>
                  <div className="col-md-6">
                    <strong>Email:</strong> {selectedEmployee.email || 'N/A'}
                  </div>
                  <div className="col-md-6">
                    <strong>Mobile:</strong> {selectedEmployee.mobile_number || 'N/A'}
                  </div>
                  <div className="col-md-6">
                    <strong>Department:</strong> {selectedEmployee.department || 'N/A'}
                  </div>
                  <div className="col-md-6">
                    <strong>Designation:</strong> {selectedEmployee.designation || 'N/A'}
                  </div>
                </div>
              </div>
            )}
            
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => navigate('/assets')}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleStepNext}
                disabled={!selectedEmployee}
              >
                Next <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
        )}
        
        {/* STEP 2: Device Action (Assign or Replace) */}
        {currentStep === 2 && (
          <div className="p-4 rounded" style={{ background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.2)' }}>
            <h5 className="fw-bold mb-3" style={{ color:'#8b5cf6' }}>
              <i className="bi bi-gear-fill me-2"></i>Step 2: Choose Action
            </h5>
            
            <div className="row g-3">
              <div className="col-md-6">
                <div 
                  className={`p-4 rounded border ${deviceAction === 'assign' ? 'border-primary border-2 bg-primary bg-opacity-10' : 'border-secondary'} cursor-pointer`}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setDeviceAction('assign')}
                >
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-plus-circle-fill fs-3 me-3 text-primary"></i>
                    <h5 className="mb-0">Assign Device</h5>
                  </div>
                  <p className="text-muted mb-0">
                    Assign a new device from available inventory to this employee
                  </p>
                </div>
              </div>
              
              <div className="col-md-6">
                <div 
                  className={`p-4 rounded border ${deviceAction === 'replace' ? 'border-warning border-2 bg-warning bg-opacity-10' : 'border-secondary'} cursor-pointer`}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setDeviceAction('replace')}
                >
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-arrow-repeat fs-3 me-3 text-warning"></i>
                    <h5 className="mb-0">Replace Device</h5>
                  </div>
                  <p className="text-muted mb-0">
                    Replace one of the employee's current devices with a new one
                  </p>
                </div>
              </div>
            </div>
            
            {errors.action && <div className="text-danger small mt-2">{errors.action}</div>}
            
            <div className="d-flex justify-content-between gap-2 mt-4">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleStepBack}
              >
                <i className="bi bi-arrow-left me-1"></i> Back
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleStepNext}
                disabled={!deviceAction}
              >
                Next <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
        )}
        
        {/* STEP 3A: Device Selection (Assign) */}
        {currentStep === 3 && deviceAction === 'assign' && (
          <div className="p-4 rounded" style={{ background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)' }}>
            <h5 className="fw-bold mb-3" style={{ color:'#10b981' }}>
              <i className="bi bi-laptop-fill me-2"></i>Step 3: Select Device to Assign
            </h5>
            
            <div className="mb-3">
              <label className="form-label fw-500">
                Search Available Devices <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, serial number, model, or category..."
                value={deviceSearchQuery}
                onChange={e => setDeviceSearchQuery(e.target.value)}
              />
            </div>
            
            <div style={{ maxHeight: 400, overflowY: 'auto' }} className="border rounded p-3">
              {filteredDevices.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                  No available devices found
                </div>
              ) : (
                <div className="row g-3">
                  {filteredDevices.map(device => {
                    const deviceId = device.id || device.asset_id;
                    const isSelected = primaryDevice && (primaryDevice.id === deviceId || primaryDevice.asset_id === deviceId);
                    
                    return (
                      <div key={deviceId} className="col-md-6">
                        <div 
                          className={`p-3 rounded border ${isSelected ? 'border-success border-2 bg-success bg-opacity-10' : 'border-secondary'} cursor-pointer`}
                          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                          onClick={() => setPrimaryDevice(device)}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-0">{device.asset_name}</h6>
                            {isSelected && <i className="bi bi-check-circle-fill text-success"></i>}
                          </div>
                          <div className="small text-muted">
                            <div><strong>Category:</strong> {device.category}</div>
                            <div><strong>Serial:</strong> {device.serial_number || 'N/A'}</div>
                            <div><strong>Model:</strong> {device.model_name || 'N/A'}</div>
                            <span className="badge bg-success mt-1">{device.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {errors.device && <div className="text-danger small mt-2">{errors.device}</div>}
            
            <div className="d-flex justify-content-between gap-2 mt-4">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleStepBack}
              >
                <i className="bi bi-arrow-left me-1"></i> Back
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleStepNext}
                disabled={!primaryDevice}
              >
                Next <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
        )}
        
        {/* STEP 3B: Device Selection (Replace) */}
        {currentStep === 3 && deviceAction === 'replace' && (
          <div className="p-4 rounded" style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)' }}>
            <h5 className="fw-bold mb-3" style={{ color:'#f59e0b' }}>
              <i className="bi bi-arrow-repeat me-2"></i>Step 3: Select Devices for Replacement
            </h5>
            
            {/* Select Old Device */}
            <div className="mb-4">
              <h6 className="fw-bold mb-2">Current Assigned Devices:</h6>
              {employeeDevices.length === 0 ? (
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  This employee has no devices assigned currently
                </div>
              ) : (
                <div className="row g-3">
                  {employeeDevices.map(device => {
                    const deviceId = device.id || device.asset_id;
                    const isSelected = oldDevice && (oldDevice.id === deviceId || oldDevice.asset_id === deviceId);
                    
                    return (
                      <div key={deviceId} className="col-md-6">
                        <div 
                          className={`p-3 rounded border ${isSelected ? 'border-danger border-2 bg-danger bg-opacity-10' : 'border-secondary'} cursor-pointer`}
                          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                          onClick={() => setOldDevice(device)}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-0">{device.asset_name}</h6>
                            {isSelected && <i className="bi bi-check-circle-fill text-danger"></i>}
                          </div>
                          <div className="small text-muted">
                            <div><strong>Category:</strong> {device.category}</div>
                            <div><strong>Serial:</strong> {device.serial_number || 'N/A'}</div>
                            <div><strong>Model:</strong> {device.model_name || 'N/A'}</div>
                            <span className="badge bg-warning text-dark mt-1">{device.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.oldDevice && <div className="text-danger small mt-2">{errors.oldDevice}</div>}
            </div>
            
            {/* Select New Device */}
            {oldDevice && (
              <div>
                <h6 className="fw-bold mb-2">
                  <i className="bi bi-arrow-down-circle me-1"></i>
                  Select Replacement Device:
                </h6>
                
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, serial number, model, or category..."
                    value={deviceSearchQuery}
                    onChange={e => setDeviceSearchQuery(e.target.value)}
                  />
                </div>
                
                <div style={{ maxHeight: 300, overflowY: 'auto' }} className="border rounded p-3">
                  {filteredDevices.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                      No available devices found
                    </div>
                  ) : (
                    <div className="row g-3">
                      {filteredDevices.map(device => {
                        const deviceId = device.id || device.asset_id;
                        const isSelected = primaryDevice && (primaryDevice.id === deviceId || primaryDevice.asset_id === deviceId);
                        
                        return (
                          <div key={deviceId} className="col-md-6">
                            <div 
                              className={`p-3 rounded border ${isSelected ? 'border-success border-2 bg-success bg-opacity-10' : 'border-secondary'} cursor-pointer`}
                              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                              onClick={() => setPrimaryDevice(device)}
                            >
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="mb-0">{device.asset_name}</h6>
                                {isSelected && <i className="bi bi-check-circle-fill text-success"></i>}
                              </div>
                              <div className="small text-muted">
                                <div><strong>Category:</strong> {device.category}</div>
                                <div><strong>Serial:</strong> {device.serial_number || 'N/A'}</div>
                                <div><strong>Model:</strong> {device.model_name || 'N/A'}</div>
                                <span className="badge bg-success mt-1">{device.status}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {errors.device && <div className="text-danger small mt-2">{errors.device}</div>}
              </div>
            )}
            
            <div className="d-flex justify-content-between gap-2 mt-4">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleStepBack}
              >
                <i className="bi bi-arrow-left me-1"></i> Back
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleStepNext}
                disabled={!oldDevice || !primaryDevice}
              >
                Next <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
        )}
        
        {/* STEP 4: Accessories Selection */}
        {currentStep === 4 && (
          <div className="p-4 rounded" style={{ background:'rgba(236,72,153,0.06)', border:'1px solid rgba(236,72,153,0.2)' }}>
            <h5 className="fw-bold mb-3" style={{ color:'#ec4899' }}>
              <i className="bi bi-mouse-fill me-2"></i>Step 4: Select Accessories (Optional)
            </h5>
            
            <p className="text-muted mb-4">
              Select Mouse and/or Headphones to assign along with the primary device. This step is optional.
            </p>
            
            {/* Mouse Selection */}
            <div className="mb-4">
              <h6 className="fw-bold mb-2">
                <i className="bi bi-mouse me-1"></i>Mouse
              </h6>
              
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search mouse..."
                  value={mouseSearchQuery}
                  onChange={e => setMouseSearchQuery(e.target.value)}
                />
              </div>
              
              <div style={{ maxHeight: 200, overflowY: 'auto' }} className="border rounded p-2">
                {filteredMouse.length === 0 ? (
                  <div className="text-center text-muted py-2 small">
                    No available mouse found
                  </div>
                ) : (
                  <div className="row g-2">
                    {filteredMouse.map(mouse => {
                      const mouseId = mouse.id || mouse.asset_id;
                      const isSelected = selectedAccessories.some(acc => (acc.id || acc.asset_id) === mouseId);
                      
                      return (
                        <div key={mouseId} className="col-md-6">
                          <div 
                            className={`p-2 rounded border ${isSelected ? 'border-success border-2 bg-success bg-opacity-10' : 'border-secondary'} cursor-pointer small`}
                            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                            onClick={() => toggleAccessory(mouse)}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="fw-bold">{mouse.asset_name}</div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                  SN: {mouse.serial_number || 'N/A'}
                                </div>
                              </div>
                              {isSelected && <i className="bi bi-check-circle-fill text-success"></i>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Headphones Selection */}
            <div>
              <h6 className="fw-bold mb-2">
                <i className="bi bi-headphones me-1"></i>Headphones
              </h6>
              
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search headphones..."
                  value={headphonesSearchQuery}
                  onChange={e => setHeadphonesSearchQuery(e.target.value)}
                />
              </div>
              
              <div style={{ maxHeight: 200, overflowY: 'auto' }} className="border rounded p-2">
                {filteredHeadphones.length === 0 ? (
                  <div className="text-center text-muted py-2 small">
                    No available headphones found
                  </div>
                ) : (
                  <div className="row g-2">
                    {filteredHeadphones.map(headphone => {
                      const headphoneId = headphone.id || headphone.asset_id;
                      const isSelected = selectedAccessories.some(acc => (acc.id || acc.asset_id) === headphoneId);
                      
                      return (
                        <div key={headphoneId} className="col-md-6">
                          <div 
                            className={`p-2 rounded border ${isSelected ? 'border-success border-2 bg-success bg-opacity-10' : 'border-secondary'} cursor-pointer small`}
                            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                            onClick={() => toggleAccessory(headphone)}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="fw-bold">{headphone.asset_name}</div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                  SN: {headphone.serial_number || 'N/A'}
                                </div>
                              </div>
                              {isSelected && <i className="bi bi-check-circle-fill text-success"></i>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {selectedAccessories.length > 0 && (
              <div className="alert alert-info mt-3 mb-0">
                <i className="bi bi-info-circle me-2"></i>
                <strong>{selectedAccessories.length}</strong> accessory/accessories selected
              </div>
            )}
            
            <div className="d-flex justify-content-between gap-2 mt-4">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleStepBack}
              >
                <i className="bi bi-arrow-left me-1"></i> Back
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleStepNext}
              >
                Next <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
        )}
        
        {/* STEP 5: Review and Confirm */}
        {currentStep === 5 && (
          <div className="p-4 rounded" style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.2)' }}>
            <h5 className="fw-bold mb-3" style={{ color:'#3b82f6' }}>
              <i className="bi bi-check-circle-fill me-2"></i>Step 5: Review & Confirm
            </h5>
            
            <div className="p-3 bg-light rounded mb-3">
              <h6 className="fw-bold mb-2">Employee:</h6>
              <div className="small">
                <div><strong>{selectedEmployee.emp_id}</strong> - {selectedEmployee.employee_name}</div>
                <div className="text-muted">{selectedEmployee.email}</div>
                <div className="text-muted">{selectedEmployee.department} - {selectedEmployee.designation}</div>
              </div>
            </div>
            
            <div className="p-3 bg-light rounded mb-3">
              <h6 className="fw-bold mb-2">Action:</h6>
              <span className={`badge ${deviceAction === 'assign' ? 'bg-success' : 'bg-warning text-dark'} fs-6`}>
                {deviceAction === 'assign' ? 'Assign Device' : 'Replace Device'}
              </span>
            </div>
            
            {deviceAction === 'replace' && oldDevice && (
              <div className="p-3 rounded mb-3" style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)' }}>
                <h6 className="fw-bold mb-2 text-danger">
                  <i className="bi bi-x-circle me-1"></i>Old Device (To be returned):
                </h6>
                <div className="small">
                  <div className="fw-bold">{oldDevice.asset_name}</div>
                  <div className="text-muted">{oldDevice.category} | SN: {oldDevice.serial_number}</div>
                </div>
              </div>
            )}
            
            <div className="p-3 rounded mb-3" style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)' }}>
              <h6 className="fw-bold mb-2 text-success">
                <i className="bi bi-plus-circle me-1"></i>New Device:
              </h6>
              <div className="small">
                <div className="fw-bold">{primaryDevice.asset_name}</div>
                <div className="text-muted">{primaryDevice.category} | SN: {primaryDevice.serial_number}</div>
                {primaryDevice.model_name && <div className="text-muted">Model: {primaryDevice.model_name}</div>}
              </div>
            </div>
            
            {selectedAccessories.length > 0 && (
              <div className="p-3 bg-light rounded mb-3">
                <h6 className="fw-bold mb-2">Accessories:</h6>
                <ul className="mb-0 small">
                  {selectedAccessories.map(acc => (
                    <li key={acc.id || acc.asset_id}>
                      <i className="bi bi-check text-success me-1"></i>
                      <strong>{acc.asset_name}</strong> ({acc.category}) - SN: {acc.serial_number || 'N/A'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mb-3">
              <label className="form-label fw-500">Reason:</label>
              <input
                type="text"
                className="form-control"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Enter reason for assignment/replacement"
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label fw-500">Remarks (Optional):</label>
              <textarea
                className="form-control"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Additional remarks or notes"
                rows={3}
              />
            </div>
            
            <div className="alert alert-warning mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>Important:</strong> This action will be performed in a single transaction. 
              If any operation fails, all changes will be rolled back.
            </div>
            
            <div className="d-flex justify-content-between gap-2">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleStepBack}
                disabled={saving}
              >
                <i className="bi bi-arrow-left me-1"></i> Back
              </button>
              <button 
                type="submit" 
                className="btn btn-success btn-lg"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Confirm Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OLD EXISTING DEVICE FORM - BACKUP (can be removed after testing)
// ═══════════════════════════════════════════════════════════════════════════════
function OldExistingDeviceForm({ navigate }) {
  const [form,       setForm]       = useState(EMPTY_EXISTING);
  const [saving,     setSaving]     = useState(false);
  const [errors,     setErrors]     = useState({});
  const [apiError,   setApiError]   = useState('');
  const [sendAck,    setSendAck]    = useState(SEND_ACK_DEFAULT);
  const [empSuggestions, setEmpSuggestions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null); // Phase 2
  const [empLookup,  setEmpLookup]  = useState(false);
  
  // Phase 3 Enhancement: Employee's current assets and category validation
  const [employeeCurrentAssets, setEmployeeCurrentAssets] = useState([]);
  const [categoryConflict, setCategoryConflict] = useState(null);
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  
  // Asset search functionality
  const [assetSearch, setAssetSearch] = useState('');
  const [assetSuggestions, setAssetSuggestions] = useState([]);
  const [assetLoaded, setAssetLoaded] = useState(false);
  const [loadedAssetId, setLoadedAssetId] = useState(null);
  const [assets, setAssets] = useState([]);
  
  // Employee search functionality for finding their assets
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeSearchResults, setEmployeeSearchResults] = useState([]);
  const [employeeAssets, setEmployeeAssets] = useState([]);

  // Load all assets on mount for dropdown
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const res = await assetAPI.getAll({});
        // Handle both paginated and non-paginated responses
        const assetList = res.data.assets || res.data || [];
        setAssets(assetList);
      } catch (err) {
        console.error('Failed to load assets:', err);
        setAssets([]);
      }
    };
    loadAssets();
  }, []);

  // Auto-populate asset details when selected
  const handleAssetSelect = async (assetId) => {
    if (!assetId) {
      setAssetLoaded(false);
      setLoadedAssetId(null);
      setForm(EMPTY_EXISTING);
      return;
    }

    try {
      const res = await assetAPI.getById(assetId);
      const asset = res.data;
      
      // Populate all asset fields
      setForm(f => ({
        ...f,
        // Basic asset info
        asset_name: asset.asset_name || '',
        category: asset.category || '',
        brand_name: asset.brand_name || '',
        model_name: asset.model_name || '',
        serial_number: asset.serial_number || '',
        location: asset.location || '',
        status: asset.status || 'Assigned',
        
        // Employee info (if assigned)
        emp_id: asset.emp_id || '',
        employee_name: asset.employee_name || '',
        employee_email: asset.employee_email || '',
        mobile_number: asset.mobile_number || '',
        
        // Specifications
        processor: asset.processor || '',
        ram: asset.ram || '',
        storage_type: asset.storage_type || '',
        storage_capacity: asset.storage_capacity || '',
        graphics_card: asset.graphics_card || '',
        os: asset.os || '',
        os_version: asset.os_version || '',
        screen_size: asset.screen_size || '',
        
        // Category-specific fields
        imei_1: asset.imei_1 || '',
        imei_2: asset.imei_2 || '',
        printer_type: asset.printer_type || '',
        color_or_mono: asset.color_or_mono || '',
        network_enabled: asset.network_enabled || '',
        resolution: asset.resolution || '',
        refresh_rate: asset.refresh_rate || '',
        cpu_count: asset.cpu_count || '',
        raid_config: asset.raid_config || '',
        ip_address: asset.ip_address || '',
        rack_location: asset.rack_location || '',
        interface_type: asset.interface_type || '',
        capacity_va: asset.capacity_va || '',
        battery_type: asset.battery_type || '',
        backup_time: asset.backup_time || '',
        connection_type: asset.connection_type || '',
        noise_cancellation: asset.noise_cancellation || '',
        size_compatibility: asset.size_compatibility || '',
        color: asset.color || '',
        
        // Warranty and purchase (read-only, already in system)
        purchase_vendor: asset.purchase_vendor || '',
        purchase_price: asset.purchase_price || '',
        purchase_date: asset.purchase_date || '',
        warranty_start_date: asset.warranty_start_date || '',
        warranty_end_date: asset.warranty_end_date || '',
        warranty_period: asset.warranty_period || '',
        
        // Accessories (these can be updated)
        charger_serial: asset.charger_serial || '',
        
        // Other fields
        old_user: asset.old_user || '',
        old_device: asset.old_device || '',
        date: asset.date || '',
        remarks: asset.remarks || '',
        comments: asset.comments || '',
        custom_description: asset.custom_description || '',
      }));
      
      setAssetLoaded(true);
      setLoadedAssetId(assetId);
      setAssetSearch('');
      setAssetSuggestions([]);
    } catch (err) {
      setApiError('Failed to load asset details');
      console.error('Asset load error:', err);
    }
  };

  // Search assets as user types
  const handleAssetSearchChange = (val) => {
    setAssetSearch(val);
    if (val.length < 2) {
      setAssetSuggestions([]);
      return;
    }
    
    const filtered = assets.filter(asset => 
      asset.asset_name?.toLowerCase().includes(val.toLowerCase()) ||
      asset.serial_number?.toLowerCase().includes(val.toLowerCase()) ||
      asset.asset_id?.toString().includes(val)
    ).slice(0, 10);
    
    setAssetSuggestions(filtered);
  };

  // Auto-fill employee details when EMP ID is entered
  const handleEmpIdBlur = async () => {
    if (!form.emp_id.trim()) return;
    try {
      const res = await employeeAPI.getById(form.emp_id.trim());
      if (res.data.found) {
        const e = res.data.employee;
        setForm(f => ({
          ...f,
          employee_name:  e.employee_name || f.employee_name,
          employee_email: e.email         || f.employee_email,
          mobile_number:  e.mobile_number || f.mobile_number,
          location:       e.location      || f.location,
        }));
        setEmpLookup(true);
        setTimeout(() => setEmpLookup(false), 3000);
      }
    } catch {}
  };

  // Search employees as user types
  const handleEmpSearch = async (val) => {
    setForm(f => ({ ...f, emp_id: val }));
    if (val.length < 2) { setEmpSuggestions([]); return; }
    try {
      // BUG FIX: Only show Active employees for asset assignment
      const res = await employeeAPI.search({ q: val, active_only: 'true' });
      setEmpSuggestions(res.data || []);
    } catch {}
  };
  
  // Search for employee and their assets
  const handleEmployeeSearchForAssets = async (val) => {
    setEmployeeSearch(val);
    console.log('Employee search:', val);
    if (val.length < 2) { 
      setEmployeeSearchResults([]);
      setEmployeeAssets([]);
      return;
    }
    try {
      console.log('Calling API with query:', val);
      // BUG FIX: Only show Active employees for asset assignment
      const res = await employeeAPI.search({ q: val, active_only: 'true' });
      console.log('Employee search results:', res.data);
      setEmployeeSearchResults(res.data || []);
    } catch (err) {
      console.error('Employee search error:', err);
      setEmployeeSearchResults([]);
    }
  };
  
  // When employee is selected, show their assigned assets
  const handleEmployeeSelect = (employee) => {
    setEmployeeSearch(employee.employee_name);
    setEmployeeSearchResults([]);
    
    // Filter assets assigned to this employee
    const empAssets = assets.filter(asset => 
      asset.emp_id === employee.emp_id || 
      asset.employee_name === employee.employee_name
    );
    setEmployeeAssets(empAssets);
  };

  const selectEmployee = (emp) => {
    setForm(f => ({
      ...f,
      emp_id:         emp.emp_id,
      employee_name:  emp.employee_name,
      employee_email: emp.email,
      mobile_number:  emp.mobile_number,
      location:       emp.location || f.location,
    }));
    setEmpSuggestions([]);
  };

  // Phase 2: Employee Master Integration Handlers
  const handleEmployeeSelectFromMaster = async (employee) => {
    setSelectedEmployee(employee);
    setForm(f => ({
      ...f,
      emp_id:         employee.emp_id,
      employee_name:  employee.employee_name,
      employee_email: employee.email || '',
      mobile_number:  employee.mobile_number || '',
      department:     employee.department || '',
      designation:    employee.designation || '',
      location:       employee.location || f.location,
    }));
    setEmpLookup(true);
    
    // Phase 3 Enhancement: Load employee's current assets
    try {
      const response = await employeeAPI.getAssets(employee.emp_id);
      const currentAssets = response.data.assets || [];
      setEmployeeCurrentAssets(currentAssets);
      
      // Check for category conflict with selected asset
      if (form.category && currentAssets.length > 0) {
        const sameCategory = currentAssets.filter(a => a.category === form.category);
        if (sameCategory.length > 0) {
          setCategoryConflict({
            category: form.category,
            existing: sameCategory,
            newAsset: form.asset_name
          });
        } else {
          setCategoryConflict(null);
        }
      }
    } catch (err) {
      console.error('Failed to load employee assets:', err);
      // Non-blocking error - continue with assignment
    }
  };

  const handleEmployeeClearFromMaster = () => {
    setSelectedEmployee(null);
    setEmployeeCurrentAssets([]); // Phase 3: Clear current assets
    setCategoryConflict(null); // Phase 3: Clear category conflict
    setShowCategoryOptions(false);
    setForm(f => ({
      ...f,
      emp_id:         '',
      employee_name:  '',
      employee_email: '',
      mobile_number:  '',
    }));
    setEmpLookup(false);
  };

  const validate = () => {
    const errs = {};
    
    // If no asset loaded, require asset selection
    if (!assetLoaded) {
      errs.asset_search = 'Please select an existing asset first';
      return errs;
    }
    
    // Category is always required
    if (!form.category) {
      errs.category = 'Required';
      return errs;
    }
    
    // Phase 2: Validate employee exists in Employee Master
    if (!selectedEmployee || !selectedEmployee.emp_id) {
      errs.emp_id = 'Please select an employee from Employee Master';
      return errs;
    }
    
    // Phase 3 Enhancement: Validate category conflict resolution
    if (categoryConflict && !showCategoryOptions) {
      errs.category_conflict = 'Please choose an option: Replace or Keep Both';
      return errs;
    }
    
    if (sendAck && !form.employee_email) {
      errs.employee_email = 'Email required to send acknowledgment';
    }
    
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true); setApiError('');
    
    try {
      // Save or update employee record permanently with Active status
      if (form.emp_id && form.employee_name) {
        console.log('[ExistingDevice] Creating/updating employee:', form.emp_id);
        const empResponse = await employeeAPI.createOrUpdate({
          emp_id:        form.emp_id,
          employee_name: form.employee_name,
          email:         form.employee_email || '',
          mobile_number: form.mobile_number || '',
          location:      form.location || '',
          status:        'Active',      // Ensure employee is Active
          is_active:     true,          // Ensure employee is active
        });
        
        console.log('[ExistingDevice] Employee response:', empResponse.data);
        
        // Verify employee was created/updated successfully
        if (!empResponse.data || !empResponse.data.success) {
          throw new Error('Failed to create/update employee in Employee Master');
        }
      }

      // Update the existing asset
      console.log('[ExistingDevice] Updating asset:', loadedAssetId);
      const assetData = {
        ...form,
        status: 'Assigned'  // CRITICAL: Must set status to 'Assigned' when assigning employee
      };
      console.log('[ExistingDevice] Payload:', assetData);
      const assetResponse = await assetAPI.update(loadedAssetId, assetData);
      console.log('[ExistingDevice] Asset updated:', assetResponse.data);

      // Send acknowledgment email if requested
      if (sendAck && loadedAssetId && form.employee_email) {
        try {
          await ackAPI.sendEmail(loadedAssetId);
        } catch (ackErr) {
          console.warn('Ack email failed:', ackErr);
        }
      }

      navigate('/assets', { state: { success: sendAck
        ? 'Asset assigned and acknowledgment email sent!'
        : 'Asset assigned successfully!' }});
    } catch (err) {
      console.error('[ExistingDevice] Assignment error:', err);
      
      // Phase 3: Enhanced error handling
      const errorData = err.response?.data;
      if (errorData) {
        // Display main error message
        const mainError = errorData.error || 'Failed to update asset';
        setApiError(mainError);
        
        // If there are specific field errors, set them
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const fieldErrors = {};
          errorData.errors.forEach(error => {
            const lowerError = error.toLowerCase();
            if (lowerError.includes('serial number')) {
              fieldErrors.serial_number = error;
            } else if (lowerError.includes('employee') && lowerError.includes('not found')) {
              fieldErrors.emp_id = 'Employee not found in Employee Master. Please try again or contact support.';
            } else if (lowerError.includes('not active')) {
              fieldErrors.emp_id = 'Employee is not active. Please select an active employee.';
            } else if (lowerError.includes('available') || lowerError.includes('assigned')) {
              fieldErrors.asset_search = error;
            }
          });
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          }
        }
        
        // Log warnings if present
        if (errorData.warnings && Array.isArray(errorData.warnings)) {
          errorData.warnings.forEach(warning => {
            console.warn('Validation warning:', warning);
          });
        }
      } else {
        setApiError(err.message || 'Failed to update asset');
      }
    } finally { setSaving(false); }
  };

  return (
    <>
      {apiError && (
        <div className="alert alert-danger mb-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Validation Error:</strong> {apiError}
        </div>
      )}
      
      {/* Asset Search/Selection Section */}
      <div className="p-3 mb-4 rounded" style={{ background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.2)' }}>
        <h6 className="fw-bold mb-3" style={{ color:'#8b5cf6' }}>
          <i className="bi bi-search me-2"></i>Select Existing Asset
        </h6>
        
        {!assetLoaded ? (
          <>
            <div className="row g-3">
              {/* Left Side: Search by Asset */}
              <div className="col-md-6">
                <label className="form-label fw-500">
                  <i className="bi bi-laptop me-1"></i>Search by Asset <span className="text-danger">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className={`form-control ${errors.asset_search ? 'is-invalid' : ''}`}
                    value={assetSearch}
                    onChange={e => handleAssetSearchChange(e.target.value)}
                    placeholder="Type asset name, serial number, or ID..."
                    autoComplete="off"
                  />
                  {assetSuggestions.length > 0 && (
                    <div style={{
                      position:'absolute', top:'100%', left:0, right:0, zIndex:1000,
                      background:'var(--card-bg, #fff)', 
                      border:'1px solid var(--border-color, #e2e8f0)', 
                      borderRadius:8,
                      boxShadow:'0 4px 16px rgba(0,0,0,0.12)', maxHeight:300, overflowY:'auto',
                      marginTop: 4
                    }}>
                      {assetSuggestions.map(asset => (
                        <div key={asset.id || asset.asset_id}
                          style={{ 
                            padding:'12px 16px', 
                            cursor:'pointer', 
                            borderBottom:'1px solid var(--border-color, #f1f5f9)',
                            background: 'var(--card-bg, #fff)'
                          }}
                          onClick={() => handleAssetSelect(asset.id || asset.asset_id)}
                          onMouseEnter={e => e.currentTarget.style.background='var(--hover-bg, #f8fafc)'}
                          onMouseLeave={e => e.currentTarget.style.background='var(--card-bg, #fff)'}
                        >
                          <div style={{ fontWeight:600, fontSize:14, marginBottom: 4 }}>
                            {asset.asset_name || 'Unnamed Asset'}
                          </div>
                          <div style={{ fontSize:12, color:'var(--text-muted, #64748b)' }}>
                            <span className="badge bg-secondary me-2">{asset.category}</span>
                            Serial: {asset.serial_number || 'N/A'}
                            {asset.emp_id && <> · Assigned to: {asset.employee_name}</>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.asset_search && <div className="invalid-feedback d-block">{errors.asset_search}</div>}
                </div>
              </div>
              
              {/* Right Side: Search by Employee */}
              <div className="col-md-6">
                <label className="form-label fw-500">
                  <i className="bi bi-person me-1"></i>Or Search by Employee/User
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-control"
                    value={employeeSearch}
                    onChange={e => handleEmployeeSearchForAssets(e.target.value)}
                    placeholder="Type employee name or ID..."
                    autoComplete="off"
                  />
                  {employeeSearchResults.length > 0 && (
                    <div style={{
                      position:'absolute', top:'100%', left:0, right:0, zIndex:1000,
                      background:'var(--card-bg, #fff)', 
                      border:'1px solid var(--border-color, #e2e8f0)', 
                      borderRadius:8,
                      boxShadow:'0 4px 16px rgba(0,0,0,0.12)', maxHeight:300, overflowY:'auto',
                      marginTop: 4
                    }}>
                      {employeeSearchResults.map(emp => (
                        <div key={emp.emp_id}
                          style={{ 
                            padding:'12px 16px', 
                            cursor:'pointer', 
                            borderBottom:'1px solid var(--border-color, #f1f5f9)',
                            background: 'var(--card-bg, #fff)'
                          }}
                          onClick={() => handleEmployeeSelect(emp)}
                          onMouseEnter={e => e.currentTarget.style.background='var(--hover-bg, #f8fafc)'}
                          onMouseLeave={e => e.currentTarget.style.background='var(--card-bg, #fff)'}
                        >
                          <div style={{ fontWeight:600, fontSize:14, marginBottom: 4 }}>
                            {emp.employee_name}
                          </div>
                          <div style={{ fontSize:12, color:'var(--text-muted, #64748b)' }}>
                            {emp.emp_id} · {emp.email}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Show employee's assigned assets */}
                {employeeAssets.length > 0 && (
                  <div className="mt-3 p-3 rounded" style={{ background:'var(--hover-bg, #f8fafc)', border:'1px solid var(--border-color, #e5e7eb)' }}>
                    <div className="small fw-600 mb-2 text-muted">
                      <i className="bi bi-boxes me-1"></i>
                      {employeeAssets.length} device(s) assigned to {employeeSearch}:
                    </div>
                    <div style={{ maxHeight:200, overflowY:'auto' }}>
                      {employeeAssets.map(asset => (
                        <div key={asset.id || asset.asset_id}
                          className="p-2 mb-1 rounded"
                          style={{ 
                            background:'var(--card-bg, #fff)', 
                            cursor:'pointer',
                            border:'1px solid var(--border-color, #e5e7eb)'
                          }}
                          onClick={() => handleAssetSelect(asset.id || asset.asset_id)}
                          onMouseEnter={e => e.currentTarget.style.borderColor='#3b82f6'}
                          onMouseLeave={e => e.currentTarget.style.borderColor='var(--border-color, #e5e7eb)'}
                        >
                          <div style={{ fontSize:13, fontWeight:600 }}>
                            {asset.asset_name}
                          </div>
                          <div style={{ fontSize:11, color:'var(--text-muted, #64748b)' }}>
                            <span className="badge bg-secondary me-1" style={{ fontSize:10 }}>{asset.category}</span>
                            {asset.serial_number}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="alert alert-info d-flex gap-2 mt-3 mb-0"
              style={{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.25)' }}>
              <i className="bi bi-info-circle-fill text-primary mt-1"></i>
              <div className="small">
                <strong>How it works:</strong> Search by asset name/serial OR search by employee to see all their assigned devices.
                All device details will be auto-loaded, and you can update specific fields like accessories, 
                employee assignment, or location without re-entering everything.
              </div>
            </div>
          </>
        ) : (
          <div className="alert alert-success d-flex align-items-center justify-content-between mb-0">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill"></i>
              <div>
                <strong>Asset Loaded:</strong> {form.asset_name}
                <span className="ms-2 badge bg-success">{form.category}</span>
                <span className="ms-2 small text-muted">Serial: {form.serial_number}</span>
              </div>
            </div>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setAssetLoaded(false);
                setLoadedAssetId(null);
                setForm(EMPTY_EXISTING);
              }}
            >
              <i className="bi bi-x-circle me-1"></i>Change Asset
            </button>
          </div>
        )}
      </div>

      {/* Only show rest of form when asset is loaded */}
      {assetLoaded && (
        <>
          {/* Employee Section */}
          <div className="p-3 mb-4 rounded" style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.2)' }}>
            <h6 className="fw-bold mb-3" style={{ color:'#2563eb' }}>
              <i className="bi bi-person-fill me-2"></i>Employee Assignment (Phase 2: Employee Master)
            </h6>
            {empLookup && selectedEmployee && (
              <div className="alert alert-success py-2 small mb-3">
                ✅ Employee details loaded from Employee Master
              </div>
            )}
            <div className="row g-3">
              <div className="col-md-12">
                <label className="form-label fw-500">
                  Search Employee <span className="text-danger">*</span>
                </label>
                <EmployeeAutocomplete
                  value={selectedEmployee}
                  onChange={handleEmployeeSelectFromMaster}
                  onClear={handleEmployeeClearFromMaster}
                  required={true}
                  placeholder="Search by Employee ID, Name, Email, or Phone..."
                  error={errors.emp_id}
                  showDetails={true}
                />
                <small className="text-muted d-block mt-1">
                  <i className="bi bi-info-circle me-1"></i>
                  Employee must exist in Employee Master. <a href="/employees/add" target="_blank" rel="noopener noreferrer">Add new employee</a> if not found.
                </small>
              </div>
            </div>
            
            {/* Phase 3 Enhancement: Show Employee's Current Assets */}
            {selectedEmployee && employeeCurrentAssets.length > 0 && (
              <div className="mt-3 p-3 rounded" style={{ background: 'rgba(13,110,253,0.08)', border: '1px solid rgba(13,110,253,0.25)' }}>
                <h6 className="fw-bold mb-2" style={{ color: '#0d6efd' }}>
                  <i className="bi bi-box-seam me-2"></i>
                  Current Assets Assigned to {selectedEmployee.employee_name}
                </h6>
                <div className="table-responsive">
                  <table className="table table-sm table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Asset Name</th>
                        <th>Serial Number</th>
                        <th>Assigned Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeCurrentAssets.map((asset, idx) => (
                        <tr key={idx} className={asset.category === form.category ? 'table-warning' : ''}>
                          <td>
                            <span className="badge bg-secondary">{asset.category}</span>
                            {asset.category === form.category && (
                              <i className="bi bi-exclamation-triangle-fill text-warning ms-2" title="Same category"></i>
                            )}
                          </td>
                          <td>{asset.asset_name}</td>
                          <td><code className="small">{asset.serial_number}</code></td>
                          <td>{asset.assigned_date ? new Date(asset.assigned_date).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Phase 3 Enhancement: Category Conflict Warning */}
                {categoryConflict && (
                  <div className="alert alert-warning mt-3 mb-0 d-flex align-items-start" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                    <div className="flex-grow-1">
                      <strong>Category Conflict Detected:</strong>
                      <p className="mb-2 mt-1">
                        Employee already has {categoryConflict.existing.length} {categoryConflict.category}(s): 
                        <strong> {categoryConflict.existing.map(a => a.asset_name).join(', ')}</strong>
                      </p>
                      <p className="mb-2">
                        You are assigning another <strong>{categoryConflict.category}</strong>: <strong>{categoryConflict.newAsset}</strong>
                      </p>
                      <div className="mt-2">
                        <p className="mb-2 small"><strong>What would you like to do?</strong></p>
                        <div className="btn-group btn-group-sm" role="group">
                          <button 
                            type="button" 
                            className={`btn ${showCategoryOptions === 'replace' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setShowCategoryOptions('replace')}
                          >
                            <i className="bi bi-arrow-repeat me-1"></i>
                            Replace Existing {categoryConflict.category}
                          </button>
                          <button 
                            type="button" 
                            className={`btn ${showCategoryOptions === 'keep_both' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => setShowCategoryOptions('keep_both')}
                          >
                            <i className="bi bi-plus-circle me-1"></i>
                            Keep Both {categoryConflict.category}s
                          </button>
                        </div>
                        {showCategoryOptions === 'replace' && (
                          <div className="alert alert-info mt-2 mb-0 small">
                            <i className="bi bi-info-circle me-1"></i>
                            The existing {categoryConflict.category} will be returned to inventory (status: Available) when you submit.
                          </div>
                        )}
                        {showCategoryOptions === 'keep_both' && (
                          <div className="alert alert-info mt-2 mb-0 small">
                            <i className="bi bi-info-circle me-1"></i>
                            Both {categoryConflict.category}s will remain assigned to the employee.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* No conflict - just informational */}
                {!categoryConflict && (
                  <div className="alert alert-info mt-3 mb-0 small d-flex align-items-center">
                    <i className="bi bi-info-circle me-2"></i>
                    <span>
                      Total: <strong>{employeeCurrentAssets.length}</strong> asset(s) currently assigned. 
                      The new <strong>{form.category || 'asset'}</strong> will be added to this employee's inventory.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Asset Form - without purchase section */}
          <DynamicAssetForm
            form={form}
            setForm={setForm}
            errors={errors}
            onSubmit={handleSubmit}
            saving={saving}
            onCancel={() => navigate('/assets')}
            isExistingDevice={true}
            hidePurchaseSection={true}
            renderExtraButtons={() => (
              <>
                {/* Acknowledgment Option */}
                {form.employee_email && (
                  <div className="p-3 mb-4 rounded" style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.3)' }}>
                    <div className="form-check form-switch d-flex align-items-center gap-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="sendAckSwitch"
                        style={{ width:48, height:24 }}
                        checked={sendAck}
                        onChange={e => setSendAck(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="sendAckSwitch">
                        <span className="fw-semibold">📧 Send Acknowledgment Email</span>
                        <span className="text-muted small ms-2">
                          to {form.employee_email}
                        </span>
                      </label>
                    </div>
                    {sendAck && (
                      <div className="mt-2 small text-muted ms-5">
                        ✅ Employee will receive an email with updated device details and an acknowledge button.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            submitButtonText={sendAck ? 'Update & Send Email' : 'Update Asset'}
          />
        </>
      )}
    </>
  );
}
function AssetAdd() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('new');

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-0">Add Asset</h2>
          <p className="text-muted mb-0 small">Choose the type of entry below</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4">
        <button
          className={`btn px-4 ${tab === 'new' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setTab('new')}
        >
          <i className="bi bi-box-seam me-2"></i>
          New Device
          <span className="ms-2 badge bg-success" style={{ fontSize: '10px' }}>Inventory</span>
        </button>
        <button
          className={`btn px-4 ${tab === 'existing' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setTab('existing')}
        >
          <i className="bi bi-recycle me-2"></i>
          Existing / Old Device
          <span className="ms-2 badge bg-warning text-dark" style={{ fontSize: '10px' }}>With User</span>
        </button>
      </div>

      {/* Tab description */}
      {tab === 'new' ? (
        <div className="alert d-flex gap-2 mb-4"
          style={{ background:'rgba(22,163,74,0.08)', border:'1px solid rgba(22,163,74,0.25)', borderRadius:'10px' }}>
          <i className="bi bi-box-seam text-success mt-1"></i>
          <div className="small">
            <strong>New Device</strong> — Use this for newly purchased items.
            Enter asset, purchase, warranty and accessory details.
            No employee assignment needed — device goes to inventory as <strong>Available</strong>.
          </div>
        </div>
      ) : (
        <div className="alert d-flex gap-2 mb-4"
          style={{ background:'rgba(217,119,6,0.08)', border:'1px solid rgba(217,119,6,0.25)', borderRadius:'10px' }}>
          <i className="bi bi-recycle text-warning mt-1"></i>
          <div className="small">
            <strong>Existing / Old Device</strong> — Use this for devices already in use or being transferred.
            Enter asset details along with current employee assignment and history.
          </div>
        </div>
      )}

      {/* Render active tab form */}
      {tab === 'new'
        ? <NewDeviceForm navigate={navigate} />
        : <ExistingDeviceForm navigate={navigate} />
      }
    </div>
  );
}

export default AssetAdd;
