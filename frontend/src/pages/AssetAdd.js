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
      });
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
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXISTING DEVICE TAB  (Asset lookup and update with employee fields)
// ═══════════════════════════════════════════════════════════════════════════════
function ExistingDeviceForm({ navigate }) {
  const [form,       setForm]       = useState(EMPTY_EXISTING);
  const [saving,     setSaving]     = useState(false);
  const [errors,     setErrors]     = useState({});
  const [apiError,   setApiError]   = useState('');
  const [sendAck,    setSendAck]    = useState(SEND_ACK_DEFAULT);
  const [empSuggestions, setEmpSuggestions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null); // Phase 2
  const [empLookup,  setEmpLookup]  = useState(false);
  
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
      const res = await employeeAPI.search(val);
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
      const res = await employeeAPI.search(val);
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
  const handleEmployeeSelectFromMaster = (employee) => {
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
  };

  const handleEmployeeClearFromMaster = () => {
    setSelectedEmployee(null);
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
      // Save or update employee record permanently
      if (form.emp_id && form.employee_name) {
        await employeeAPI.createOrUpdate({
          emp_id:        form.emp_id,
          employee_name: form.employee_name,
          email:         form.employee_email,
          mobile_number: form.mobile_number,
          location:      form.location,
        });
      }

      // Update the existing asset
      const assetData = { ...form };
      await assetAPI.update(loadedAssetId, assetData);

      // Send acknowledgment email if requested
      if (sendAck && loadedAssetId && form.employee_email) {
        try {
          await ackAPI.sendEmail(loadedAssetId);
        } catch (ackErr) {
          console.warn('Ack email failed:', ackErr);
        }
      }

      navigate('/assets', { state: { success: sendAck
        ? 'Asset updated and acknowledgment email sent!'
        : 'Asset updated successfully!' }});
    } catch (err) {
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
            } else if (lowerError.includes('employee')) {
              fieldErrors.emp_id = error;
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
        setApiError('Failed to update asset');
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
                  Employee must exist in Employee Master. <a href="/employees/add" target="_blank">Add new employee</a> if not found.
                </small>
              </div>
            </div>
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
