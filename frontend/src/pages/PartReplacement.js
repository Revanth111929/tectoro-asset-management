import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import api from '../services/api';
import './PartReplacement.css';

function PartReplacement() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetSuggestions, setAssetSuggestions] = useState([]);
  const [showAssetSuggestions, setShowAssetSuggestions] = useState(false);
  const [availableComponents, setAvailableComponents] = useState([]);
  
  // Donor asset search
  const [donorAssetSearch, setDonorAssetSearch] = useState('');
  const [donorAssetSuggestions, setDonorAssetSuggestions] = useState([]);
  const [showDonorAssetSuggestions, setShowDonorAssetSuggestions] = useState(false);
  
  const [formData, setFormData] = useState({
    asset_id: '',
    asset_name: '',
    asset_serial: '',
    category: '',
    current_employee: '',
    current_employee_id: '',
    current_employee_email: '',
    current_employee_mobile: '',
    current_employee_department: '',
    current_employee_designation: '',
    status: '',
    location: '',
    model_name: '',
    warranty_date: '',
    component_name: '',
    custom_component_name: '',
    replacement_reason: '',
    custom_reason: '',
    replacement_date: new Date().toISOString().split('T')[0],
    part_source: '',
    source_asset_id: '',
    source_asset_name: '',
    source_asset_serial: '',
    source_asset_model: '',
    source_asset_category: '',
    old_part_serial: '',
    old_part_number: '',
    old_manufacturer: '',
    old_condition: '',
    old_part_remarks: '',
    new_part_serial: '',
    new_part_number: '',
    new_manufacturer: '',
    vendor: '',
    invoice_number: '',
    replacement_cost: '',
    warranty_expiry: '',
    installed_by: '',
    remarks: ''
  });

  const [errors, setErrors] = useState({});

  const replacementReasons = [
    'Damaged',
    'Faulty',
    'Not Working',
    'Broken',
    'Dead',
    'Missing',
    'Upgrade',
    'Wear and Tear',
    'Compatibility Issue',
    'Preventive Replacement',
    'Other'
  ];

  const conditionOptions = [
    'Working',
    'Faulty',
    'Dead',
    'Broken',
    'Damaged',
    'Unknown'
  ];

  const partSourceOptions = [
    'New / Purchased Part',
    'Existing Spare Part',
    'From Available Spare Asset',
    'Other'
  ];

  // Search for assets
  const searchAssets = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setAssetSuggestions([]);
      setShowAssetSuggestions(false);
      return;
    }

    try {
      const response = await api.get('/assets', { params: { search: searchTerm } });
      const assets = Array.isArray(response.data.assets) ? response.data.assets : [];
      setAssetSuggestions(assets);
      setShowAssetSuggestions(assets.length > 0);
    } catch (error) {
      console.error('Error searching assets:', error);
      setAssetSuggestions([]);
      setShowAssetSuggestions(false);
    }
  };

  // Search for donor assets (Available only, preferably same model)
  const searchDonorAssets = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setDonorAssetSuggestions([]);
      setShowDonorAssetSuggestions(false);
      return;
    }

    try {
      const response = await api.get('/assets', { 
        params: { 
          search: searchTerm,
          status: 'Available'
        } 
      });
      let assets = Array.isArray(response.data.assets) ? response.data.assets : [];
      
      // Prioritize same model as target asset
      if (formData.model_name) {
        assets = assets.sort((a, b) => {
          const aMatchesModel = a.model_name === formData.model_name ? 1 : 0;
          const bMatchesModel = b.model_name === formData.model_name ? 1 : 0;
          return bMatchesModel - aMatchesModel;
        });
      }
      
      setDonorAssetSuggestions(assets);
      setShowDonorAssetSuggestions(assets.length > 0);
    } catch (error) {
      console.error('Error searching donor assets:', error);
      setDonorAssetSuggestions([]);
      setShowDonorAssetSuggestions(false);
    }
  };

  const handleAssetSearchChange = (e) => {
    const value = e.target.value;
    setAssetSearch(value);
    searchAssets(value);
  };

  const handleDonorAssetSearchChange = (e) => {
    const value = e.target.value;
    setDonorAssetSearch(value);
    searchDonorAssets(value);
  };

  const selectAsset = async (asset) => {
    // Populate all asset and employee details from the selected asset
    setFormData({
      ...formData,
      asset_id: asset.id,
      asset_name: asset.asset_name,
      asset_serial: asset.serial_number,
      category: asset.category,
      current_employee: asset.employee_name || 'Unassigned',
      current_employee_id: asset.emp_id || '',
      current_employee_email: asset.employee_email || '',
      current_employee_mobile: asset.mobile_number || '',
      current_employee_department: asset.department || '',
      current_employee_designation: asset.designation || '',
      status: asset.status,
      location: asset.location || 'N/A',
      model_name: asset.model_name || '',
      warranty_date: asset.warranty_date || ''
    });
    setAssetSearch(`${asset.asset_name} [${asset.serial_number}]`);
    setShowAssetSuggestions(false);
    setErrors({ ...errors, asset_id: '' });

    // Load components for this category
    if (asset.category) {
      try {
        const response = await api.get(`/part-replacements/components/${asset.category}`);
        if (response.data.success) {
          setAvailableComponents(response.data.components || []);
        }
      } catch (error) {
        console.error('Error loading components:', error);
        setAvailableComponents([]);
      }
    }
  };

  const selectDonorAsset = (asset) => {
    setFormData({
      ...formData,
      source_asset_id: asset.id,
      source_asset_name: asset.asset_name,
      source_asset_serial: asset.serial_number,
      source_asset_model: asset.model_name || '',
      source_asset_category: asset.category || ''
    });
    setDonorAssetSearch(`${asset.asset_name} [${asset.serial_number}]`);
    setShowDonorAssetSuggestions(false);
    setErrors({ ...errors, source_asset_id: '' });
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.asset_id) {
        newErrors.asset_id = 'Please select an asset';
      }
    }

    if (step === 3) {
      if (!formData.component_name) {
        newErrors.component_name = 'Please select a component';
      }
      if (formData.component_name === 'Other' && !formData.custom_component_name) {
        newErrors.custom_component_name = 'Please specify the custom component name';
      }
      if (!formData.replacement_reason) {
        newErrors.replacement_reason = 'Please select a replacement reason';
      }
      if (formData.replacement_reason === 'Other' && !formData.custom_reason) {
        newErrors.custom_reason = 'Please specify the custom reason';
      }
      if (!formData.replacement_date) {
        newErrors.replacement_date = 'Replacement date is required';
      }
      // FIX: Date validation for IST - compare date strings, not Date objects
      if (formData.replacement_date) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        if (formData.replacement_date > today) {
          newErrors.replacement_date = 'Replacement date cannot be in the future';
        }
      }
      if (formData.part_source === 'From Available Spare Asset' && !formData.source_asset_id) {
        newErrors.source_asset_id = 'Please select a donor asset';
      }
    }

    if (step === 4) {
      // New part serial is optional - component identification is sufficient
      // Validate replacement cost if provided
      if (formData.replacement_cost && isNaN(parseFloat(formData.replacement_cost))) {
        newErrors.replacement_cost = 'Must be a valid number';
      }
      if (formData.replacement_cost && parseFloat(formData.replacement_cost) < 0) {
        newErrors.replacement_cost = 'Cannot be negative';
      }
      // Validate warranty date if provided
      if (formData.warranty_expiry && formData.replacement_date) {
        if (formData.warranty_expiry < formData.replacement_date) {
          newErrors.warranty_expiry = 'Warranty expiry cannot be before replacement date';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
    
    // Clear dependent fields when changing certain values
    if (name === 'component_name' && value !== 'Other') {
      setFormData(prev => ({ ...prev, custom_component_name: '' }));
    }
    if (name === 'replacement_reason' && value !== 'Other') {
      setFormData(prev => ({ ...prev, custom_reason: '' }));
    }
    if (name === 'part_source' && value !== 'From Available Spare Asset') {
      setFormData(prev => ({ 
        ...prev, 
        source_asset_id: '',
        source_asset_name: '',
        source_asset_serial: '',
        source_asset_model: ''
      }));
      setDonorAssetSearch('');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        asset_id: formData.asset_id,
        component_name: formData.component_name,
        custom_component_name: formData.component_name === 'Other' ? formData.custom_component_name : null,
        replacement_reason: formData.replacement_reason,
        custom_reason: formData.replacement_reason === 'Other' ? formData.custom_reason : null,
        replacement_date: formData.replacement_date,
        part_source: formData.part_source || null,
        source_asset_id: formData.source_asset_id || null,
        old_part_serial: formData.old_part_serial,
        old_part_number: formData.old_part_number,
        old_manufacturer: formData.old_manufacturer,
        old_condition: formData.old_condition,
        old_part_remarks: formData.old_part_remarks,
        new_part_serial: formData.new_part_serial,
        new_part_number: formData.new_part_number,
        new_manufacturer: formData.new_manufacturer,
        vendor: formData.vendor,
        invoice_number: formData.invoice_number,
        replacement_cost: formData.replacement_cost,
        warranty_expiry: formData.warranty_expiry,
        installed_by: formData.installed_by,
        remarks: formData.remarks
      };

      const response = await api.post('/part-replacements', payload);
      
      if (response.data.success) {
        const componentDisplay = formData.component_name === 'Other' ? formData.custom_component_name : formData.component_name;
        alert(`${componentDisplay} successfully replaced for ${formData.asset_name}`);
        navigate('/assets');
      } else {
        alert(`Replacement failed: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error replacing part:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to replace part';
      alert(`Replacement failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      navigate('/assets');
    }
  };

  const getDisplayComponent = () => {
    return formData.component_name === 'Other' ? formData.custom_component_name : formData.component_name;
  };

  const getDisplayReason = () => {
    return formData.replacement_reason === 'Other' ? formData.custom_reason : formData.replacement_reason;
  };

  return (
    <div className="part-replacement-container">
      <div className="replacement-header">
        <div className="d-flex align-items-center gap-2 mb-2"><BackButton /><h2 className="mb-0">Part Replacement</h2></div>
        <p className="subtitle">Replace faulty or damaged components in assets</p>
      </div>

      {/* Progress Indicator */}
      <div className="progress-steps">
        <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Select Asset</div>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Asset Details</div>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Component & Reason</div>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-label">Part Details</div>
        </div>
      </div>

      {/* Step Content */}
      <div className="replacement-form">
        
        {/* Step 1: Select Asset */}
        {currentStep === 1 && (
          <div className="step-content">
            <h3>Step 1: Select Asset</h3>
            <p className="step-description">Search for the asset that needs part replacement</p>
            
            <div className="form-group">
              <label>Search Asset *</label>
              <div className="autocomplete-container">
                <input
                  type="text"
                  value={assetSearch}
                  onChange={handleAssetSearchChange}
                  onFocus={() => assetSuggestions.length > 0 && setShowAssetSuggestions(true)}
                  placeholder="Search by employee ID, employee name, asset name, serial number, or model..."
                  className={errors.asset_id ? 'error' : ''}
                />
                {showAssetSuggestions && (
                  <div className="autocomplete-suggestions">
                    {assetSuggestions.map(asset => (
                      <div
                        key={asset.id}
                        className="suggestion-item"
                        onClick={() => selectAsset(asset)}
                      >
                        <div className="asset-info">
                          <div className="asset-name">{asset.asset_name}</div>
                          <div className="asset-details">
                            SN: {asset.serial_number} | {asset.category} | {asset.status}
                          </div>
                          <div className="asset-owner">
                            {asset.employee_name ? `Owner: ${asset.employee_name} (${asset.emp_id})` : 'Unassigned'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.asset_id && <span className="error-message">{errors.asset_id}</span>}
            </div>

            {formData.asset_id && (
              <div className="selected-asset-info">
                <h4>Selected Asset</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Asset Name:</label>
                    <span>{formData.asset_name}</span>
                  </div>
                  <div className="info-item">
                    <label>Serial Number:</label>
                    <span>{formData.asset_serial}</span>
                  </div>
                  <div className="info-item">
                    <label>Category:</label>
                    <span>{formData.category}</span>
                  </div>
                  <div className="info-item">
                    <label>Model:</label>
                    <span>{formData.model_name || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Status:</label>
                    <span className={`status-badge status-${formData.status?.toLowerCase()}`}>
                      {formData.status}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Current Owner:</label>
                    <span>{formData.current_employee}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Asset Details (Read Only) */}
        {currentStep === 2 && (
          <div className="step-content">
            <h3>Step 2: Asset Details</h3>
            <p className="step-description">Review asset and current owner information</p>
            
            <div className="asset-details-view">
              <div className="details-section">
                <h4>Asset Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Asset Name:</label>
                    <span>{formData.asset_name}</span>
                  </div>
                  <div className="info-item">
                    <label>Serial Number:</label>
                    <span>{formData.asset_serial}</span>
                  </div>
                  <div className="info-item">
                    <label>Category:</label>
                    <span>{formData.category}</span>
                  </div>
                  <div className="info-item">
                    <label>Model:</label>
                    <span>{formData.model_name || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Status:</label>
                    <span className={`status-badge status-${formData.status?.toLowerCase()}`}>
                      {formData.status}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Location:</label>
                    <span>{formData.location}</span>
                  </div>
                  {formData.warranty_date && (
                    <div className="info-item">
                      <label>Warranty:</label>
                      <span>{formData.warranty_date}</span>
                    </div>
                  )}
                </div>
              </div>

              {formData.current_employee && formData.current_employee !== 'Unassigned' && (
                <div className="details-section">
                  <h4>Current Owner Details</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Employee Name:</label>
                      <span>{formData.current_employee}</span>
                    </div>
                    <div className="info-item">
                      <label>Employee ID:</label>
                      <span>{formData.current_employee_id || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Email:</label>
                      <span>{formData.current_employee_email || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Mobile:</label>
                      <span>{formData.current_employee_mobile || 'N/A'}</span>
                    </div>
                    {formData.current_employee_department && (
                      <div className="info-item">
                        <label>Department:</label>
                        <span>{formData.current_employee_department}</span>
                      </div>
                    )}
                    {formData.current_employee_designation && (
                      <div className="info-item">
                        <label>Designation:</label>
                        <span>{formData.current_employee_designation}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {(!formData.current_employee || formData.current_employee === 'Unassigned') && (
                <div className="details-section">
                  <h4>Current Owner</h4>
                  <p className="text-muted">This asset is currently unassigned</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Component & Replacement Details */}
        {currentStep === 3 && (
          <div className="step-content">
            <h3>Step 3: Component & Replacement Details</h3>
            <p className="step-description">Select the component to replace and provide details</p>
            
            <div className="form-group">
              <label>Component / Part *</label>
              <select
                name="component_name"
                value={formData.component_name}
                onChange={handleInputChange}
                className={errors.component_name ? 'error' : ''}
              >
                <option value="">-- Select Component --</option>
                {availableComponents.map(comp => (
                  <option key={comp} value={comp}>{comp}</option>
                ))}
              </select>
              {errors.component_name && <span className="error-message">{errors.component_name}</span>}
            </div>

            {formData.component_name === 'Other' && (
              <div className="form-group">
                <label>Custom Component Name *</label>
                <input
                  type="text"
                  name="custom_component_name"
                  value={formData.custom_component_name}
                  onChange={handleInputChange}
                  placeholder="e.g., USB Type-C Port, Charging Port, Original Dell Charger"
                  className={errors.custom_component_name ? 'error' : ''}
                />
                {errors.custom_component_name && <span className="error-message">{errors.custom_component_name}</span>}
              </div>
            )}

            <div className="form-group">
              <label>Replacement Reason *</label>
              <select
                name="replacement_reason"
                value={formData.replacement_reason}
                onChange={handleInputChange}
                className={errors.replacement_reason ? 'error' : ''}
              >
                <option value="">-- Select Reason --</option>
                {replacementReasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
              {errors.replacement_reason && <span className="error-message">{errors.replacement_reason}</span>}
            </div>

            {formData.replacement_reason === 'Other' && (
              <div className="form-group">
                <label>Custom Reason *</label>
                <input
                  type="text"
                  name="custom_reason"
                  value={formData.custom_reason}
                  onChange={handleInputChange}
                  placeholder="Specify the reason for replacement"
                  className={errors.custom_reason ? 'error' : ''}
                />
                {errors.custom_reason && <span className="error-message">{errors.custom_reason}</span>}
              </div>
            )}

            <div className="form-group">
              <label>Part Source</label>
              <select
                name="part_source"
                value={formData.part_source}
                onChange={handleInputChange}
              >
                <option value="">-- Select Part Source --</option>
                {partSourceOptions.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
              <small className="form-text">Select if the part is from a donor/spare asset</small>
            </div>

            {formData.part_source === 'From Available Spare Asset' && (
              <div className="form-group">
                <label>Source / Donor Asset *</label>
                <div className="autocomplete-container">
                  <input
                    type="text"
                    value={donorAssetSearch}
                    onChange={handleDonorAssetSearchChange}
                    onFocus={() => donorAssetSuggestions.length > 0 && setShowDonorAssetSuggestions(true)}
                    placeholder="Search for available spare asset..."
                    className={errors.source_asset_id ? 'error' : ''}
                  />
                  {showDonorAssetSuggestions && (
                    <div className="autocomplete-suggestions">
                      {donorAssetSuggestions.map(asset => (
                        <div
                          key={asset.id}
                          className="suggestion-item"
                          onClick={() => selectDonorAsset(asset)}
                        >
                          <div className="asset-info">
                            <div className="asset-name">
                              {asset.asset_name}
                              {asset.model_name === formData.model_name && (
                                <span className="badge badge-success ml-2">Same Model</span>
                              )}
                            </div>
                            <div className="asset-details">
                              SN: {asset.serial_number} | {asset.category} | {asset.model_name || 'N/A'}
                            </div>
                            <div className="asset-owner">Status: {asset.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.source_asset_id && <span className="error-message">{errors.source_asset_id}</span>}
                
                {formData.source_asset_id && (
                  <div className="donor-asset-info mt-2">
                    <strong>Selected Donor Asset:</strong>
                    <div className="info-grid mt-1">
                      <div className="info-item">
                        <label>Asset:</label>
                        <span>{formData.source_asset_name}</span>
                      </div>
                      <div className="info-item">
                        <label>Serial:</label>
                        <span>{formData.source_asset_serial}</span>
                      </div>
                      <div className="info-item">
                        <label>Model:</label>
                        <span>{formData.source_asset_model || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label>Replacement Date *</label>
              <input
                type="date"
                name="replacement_date"
                value={formData.replacement_date}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                className={errors.replacement_date ? 'error' : ''}
              />
              {errors.replacement_date && <span className="error-message">{errors.replacement_date}</span>}
            </div>

            <div className="form-group">
              <label>Old Part Condition</label>
              <select
                name="old_condition"
                value={formData.old_condition}
                onChange={handleInputChange}
              >
                <option value="">-- Select Condition --</option>
                {conditionOptions.map(cond => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Remarks (Optional)</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Additional notes about this replacement..."
                rows="3"
              />
            </div>
          </div>
        )}

        {/* Step 4: Old & New Part Details */}
        {currentStep === 4 && (
          <div className="step-content">
            <h3>Step 4: Part Details</h3>
            <p className="step-description">Provide information about old and new parts</p>
            
            {/* Old Part Section */}
            <div className="part-section">
              <h4>Old Part Details</h4>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Old Part Serial Number</label>
                    <input
                      type="text"
                      name="old_part_serial"
                      value={formData.old_part_serial}
                      onChange={handleInputChange}
                      placeholder="Enter serial number"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Old Part Number</label>
                    <input
                      type="text"
                      name="old_part_number"
                      value={formData.old_part_number}
                      onChange={handleInputChange}
                      placeholder="Enter part number"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Manufacturer</label>
                    <input
                      type="text"
                      name="old_manufacturer"
                      value={formData.old_manufacturer}
                      onChange={handleInputChange}
                      placeholder="Enter manufacturer"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Condition</label>
                    <select
                      name="old_condition"
                      value={formData.old_condition}
                      onChange={handleInputChange}
                    >
                      <option value="">-- Select Condition --</option>
                      {conditionOptions.map(cond => (
                        <option key={cond} value={cond}>{cond}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-12">
                  <div className="form-group">
                    <label>Old Part Remarks</label>
                    <textarea
                      name="old_part_remarks"
                      value={formData.old_part_remarks}
                      onChange={handleInputChange}
                      placeholder="Notes about the old part..."
                      rows="2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* New Part Section */}
            <div className="part-section">
              <h4>New Part Details</h4>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="form-group">
                    <label>New Part Serial Number *</label>
                    <input
                      type="text"
                      name="new_part_serial"
                      value={formData.new_part_serial}
                      onChange={handleInputChange}
                      placeholder="Enter serial number"
                      className={errors.new_part_serial ? 'error' : ''}
                    />
                    {errors.new_part_serial && <span className="error-message">{errors.new_part_serial}</span>}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>New Part Number</label>
                    <input
                      type="text"
                      name="new_part_number"
                      value={formData.new_part_number}
                      onChange={handleInputChange}
                      placeholder="Enter part number"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Manufacturer</label>
                    <input
                      type="text"
                      name="new_manufacturer"
                      value={formData.new_manufacturer}
                      onChange={handleInputChange}
                      placeholder="Enter manufacturer"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Vendor</label>
                    <input
                      type="text"
                      name="vendor"
                      value={formData.vendor}
                      onChange={handleInputChange}
                      placeholder="Enter vendor name"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Invoice Number</label>
                    <input
                      type="text"
                      name="invoice_number"
                      value={formData.invoice_number}
                      onChange={handleInputChange}
                      placeholder="Enter invoice number"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Replacement Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="replacement_cost"
                      value={formData.replacement_cost}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className={errors.replacement_cost ? 'error' : ''}
                    />
                    {errors.replacement_cost && <span className="error-message">{errors.replacement_cost}</span>}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Warranty Expiry</label>
                    <input
                      type="date"
                      name="warranty_expiry"
                      value={formData.warranty_expiry}
                      onChange={handleInputChange}
                      className={errors.warranty_expiry ? 'error' : ''}
                    />
                    {errors.warranty_expiry && <span className="error-message">{errors.warranty_expiry}</span>}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Installed By</label>
                    <input
                      type="text"
                      name="installed_by"
                      value={formData.installed_by}
                      onChange={handleInputChange}
                      placeholder="Technician or installer name"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Replacement Summary */}
            <div className="replacement-summary">
              <h4>Replacement Summary</h4>
              <div className="summary-content">
                <div className="summary-row">
                  <strong>Asset:</strong> {formData.asset_name} [{formData.asset_serial}]
                </div>
                <div className="summary-row">
                  <strong>Component:</strong> {getDisplayComponent() || 'N/A'}
                </div>
                <div className="summary-row">
                  <strong>Reason:</strong> {getDisplayReason() || 'N/A'}
                </div>
                <div className="summary-row">
                  <strong>Date:</strong> {formData.replacement_date}
                </div>
                {formData.part_source && (
                  <div className="summary-row">
                    <strong>Part Source:</strong> {formData.part_source}
                  </div>
                )}
                {formData.source_asset_id && (
                  <div className="summary-row">
                    <strong>Donor Asset:</strong> {formData.source_asset_name} [{formData.source_asset_serial}]
                  </div>
                )}
                <div className="summary-row">
                  <strong>Old Part:</strong> {formData.old_part_serial || formData.old_part_number || 'N/A'}
                </div>
                <div className="summary-row">
                  <strong>New Part:</strong> {formData.new_part_serial || formData.new_part_number || 'N/A'}
                </div>
                {formData.replacement_cost && (
                  <div className="summary-row">
                    <strong>Cost:</strong> ₹{formData.replacement_cost}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleCancel}
            className="btn-cancel"
          >
            Cancel
          </button>
          
          {currentStep > 1 && (
            <button 
              type="button" 
              onClick={handlePrevious}
              className="btn-previous"
            >
              Previous
            </button>
          )}
          
          {currentStep < 4 ? (
            <button 
              type="button" 
              onClick={handleNext}
              className="btn-next"
            >
              Next
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleSubmit}
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Replacing Part...' : 'Replace Part'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PartReplacement;
