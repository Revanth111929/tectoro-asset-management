import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AssetTransfer.css';

function AssetTransfer() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetSuggestions, setAssetSuggestions] = useState([]);
  const [showAssetSuggestions, setShowAssetSuggestions] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  
  const [formData, setFormData] = useState({
    asset_id: '',
    asset_name: '',
    asset_serial: '',
    category: '',
    current_employee_id: '',
    current_employee_name: '',
    current_employee_email: '',
    current_employee_mobile: '',
    to_employee_id: '',
    to_employee_name: '',
    to_employee_email: '',
    to_employee_mobile: '',
    to_department: '',
    to_designation: '',
    transfer_date: new Date().toISOString().split('T')[0],
    transfer_reason: '',
    remarks: ''
  });

  const [errors, setErrors] = useState({});

  const transferReasons = [
    'Department Change',
    'Employee Transfer',
    'Promotion',
    'Device Swap',
    'Resignation',
    'Replacement',
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
      const response = await api.get('/assets', { 
        params: { 
          q: searchTerm,
          status: 'Assigned' // Only show assigned assets
        } 
      });
      const assets = Array.isArray(response.data.assets) ? response.data.assets : [];
      // Filter for assets that are assigned
      const assignedAssets = assets.filter(a => a.status === 'Assigned' && a.employee_name);
      setAssetSuggestions(assignedAssets);
      setShowAssetSuggestions(assignedAssets.length > 0);
    } catch (error) {
      console.error('Error searching assets:', error);
      setAssetSuggestions([]);
      setShowAssetSuggestions(false);
    }
  };

  const handleAssetSearchChange = (e) => {
    const value = e.target.value;
    setAssetSearch(value);
    searchAssets(value);
  };

  const selectAsset = (asset) => {
    setFormData({
      ...formData,
      asset_id: asset.id,
      asset_name: asset.asset_name,
      asset_serial: asset.serial_number,
      category: asset.category,
      current_employee_id: asset.emp_id || '',
      current_employee_name: asset.employee_name || '',
      current_employee_email: asset.employee_email || '',
      current_employee_mobile: asset.mobile_number || ''
    });
    setAssetSearch(`${asset.asset_name} [${asset.serial_number}]`);
    setShowAssetSuggestions(false);
    setErrors({ ...errors, asset_id: '' });
  };

  // Search for employees
  const searchEmployees = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setEmployeeSuggestions([]);
      setShowEmployeeSuggestions(false);
      return;
    }

    try {
      const response = await api.get('/employees', { params: { q: searchTerm } });
      const employees = Array.isArray(response.data) ? response.data : [];
      setEmployeeSuggestions(employees);
      setShowEmployeeSuggestions(employees.length > 0);
    } catch (error) {
      console.error('Error searching employees:', error);
      setEmployeeSuggestions([]);
      setShowEmployeeSuggestions(false);
    }
  };

  const handleEmployeeSearchChange = (e) => {
    const value = e.target.value;
    setEmployeeSearch(value);
    searchEmployees(value);
  };

  const selectEmployee = (employee) => {
    setFormData({
      ...formData,
      to_employee_id: employee.emp_id,
      to_employee_name: employee.employee_name,
      to_employee_email: employee.employee_email || '',
      to_employee_mobile: employee.mobile_number || '',
      to_department: employee.department || '',
      to_designation: employee.designation || ''
    });
    setEmployeeSearch(`${employee.employee_name} (${employee.emp_id})`);
    setShowEmployeeSuggestions(false);
    setErrors({ ...errors, to_employee_id: '' });
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.asset_id) {
        newErrors.asset_id = 'Please select an asset';
      }
    }

    if (step === 3) {
      if (!formData.to_employee_id) {
        newErrors.to_employee_id = 'Please select an employee';
      }
      // Check if transferring to same employee
      if (formData.to_employee_id === formData.current_employee_id) {
        newErrors.to_employee_id = 'Cannot transfer to the same employee';
      }
    }

    if (step === 4) {
      if (!formData.transfer_date) {
        newErrors.transfer_date = 'Transfer date is required';
      }
      if (!formData.transfer_reason) {
        newErrors.transfer_reason = 'Transfer reason is required';
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
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        asset_id: formData.asset_id,
        to_employee_id: formData.to_employee_id,
        to_employee_name: formData.to_employee_name,
        to_employee_email: formData.to_employee_email,
        to_employee_mobile: formData.to_employee_mobile,
        to_department: formData.to_department,
        to_designation: formData.to_designation,
        transfer_date: formData.transfer_date,
        transfer_reason: formData.transfer_reason,
        remarks: formData.remarks
      };

      const response = await api.post('/assets/transfer', payload);
      
      if (response.data.success) {
        alert(`Asset successfully transferred to ${formData.to_employee_name}`);
        navigate('/assets');
      } else {
        alert(`Transfer failed: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error transferring asset:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to transfer asset';
      alert(`Transfer failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      navigate('/assets');
    }
  };

  return (
    <div className="asset-transfer-container">
      <div className="transfer-header">
        <h2>Asset Transfer</h2>
        <p className="subtitle">Transfer asset ownership from one employee to another</p>
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
          <div className="step-label">Current Owner</div>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Transfer To</div>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-label">Transfer Details</div>
        </div>
      </div>

      {/* Step Content */}
      <div className="transfer-form">
        
        {/* Step 1: Select Asset */}
        {currentStep === 1 && (
          <div className="step-content">
            <h3>Step 1: Select Existing Asset</h3>
            <p className="step-description">Search and select the asset you want to transfer</p>
            
            <div className="form-group">
              <label>Search Asset *</label>
              <div className="autocomplete-container">
                <input
                  type="text"
                  value={assetSearch}
                  onChange={handleAssetSearchChange}
                  onFocus={() => assetSuggestions.length > 0 && setShowAssetSuggestions(true)}
                  placeholder="Search by asset name, serial number, or category..."
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
                            {asset.serial_number} | {asset.category}
                          </div>
                          <div className="asset-owner">
                            Current Owner: {asset.employee_name || 'Unassigned'}
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
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Current Owner (Read Only) */}
        {currentStep === 2 && (
          <div className="step-content">
            <h3>Step 2: Current Owner Details</h3>
            <p className="step-description">Review the current asset assignment</p>
            
            <div className="current-owner-info">
              <div className="asset-section">
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
                </div>
              </div>

              <div className="owner-section">
                <h4>Current Owner</h4>
                {formData.current_employee_name ? (
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Employee ID:</label>
                      <span>{formData.current_employee_id}</span>
                    </div>
                    <div className="info-item">
                      <label>Employee Name:</label>
                      <span>{formData.current_employee_name}</span>
                    </div>
                    <div className="info-item">
                      <label>Email:</label>
                      <span>{formData.current_employee_email || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Mobile:</label>
                      <span>{formData.current_employee_mobile || 'N/A'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="no-owner">This asset is currently unassigned</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Transfer To Employee */}
        {currentStep === 3 && (
          <div className="step-content">
            <h3>Step 3: Transfer To</h3>
            <p className="step-description">Search and select the employee to transfer this asset to</p>
            
            <div className="form-group">
              <label>Search Employee *</label>
              <div className="autocomplete-container">
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={handleEmployeeSearchChange}
                  onFocus={() => employeeSuggestions.length > 0 && setShowEmployeeSuggestions(true)}
                  placeholder="Search by employee name, ID, or email..."
                  className={errors.to_employee_id ? 'error' : ''}
                />
                {showEmployeeSuggestions && (
                  <div className="autocomplete-suggestions">
                    {employeeSuggestions.map(employee => (
                      <div
                        key={employee.emp_id}
                        className="suggestion-item"
                        onClick={() => selectEmployee(employee)}
                      >
                        <div className="employee-info">
                          <div className="employee-name">{employee.employee_name}</div>
                          <div className="employee-details">
                            {employee.emp_id} | {employee.department || 'N/A'} | {employee.designation || 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.to_employee_id && <span className="error-message">{errors.to_employee_id}</span>}
            </div>

            {formData.to_employee_id && (
              <div className="selected-employee-info">
                <h4>New Owner Details</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Employee ID:</label>
                    <span>{formData.to_employee_id}</span>
                  </div>
                  <div className="info-item">
                    <label>Employee Name:</label>
                    <span>{formData.to_employee_name}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{formData.to_employee_email || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Mobile:</label>
                    <span>{formData.to_employee_mobile || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Department:</label>
                    <span>{formData.to_department || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Designation:</label>
                    <span>{formData.to_designation || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Transfer Details */}
        {currentStep === 4 && (
          <div className="step-content">
            <h3>Step 4: Transfer Details</h3>
            <p className="step-description">Provide transfer information and confirm the transfer</p>
            
            <div className="form-group">
              <label>Transfer Date *</label>
              <input
                type="date"
                name="transfer_date"
                value={formData.transfer_date}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                className={errors.transfer_date ? 'error' : ''}
              />
              {errors.transfer_date && <span className="error-message">{errors.transfer_date}</span>}
            </div>

            <div className="form-group">
              <label>Transfer Reason *</label>
              <select
                name="transfer_reason"
                value={formData.transfer_reason}
                onChange={handleInputChange}
                className={errors.transfer_reason ? 'error' : ''}
              >
                <option value="">-- Select Reason --</option>
                {transferReasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
              {errors.transfer_reason && <span className="error-message">{errors.transfer_reason}</span>}
            </div>

            <div className="form-group">
              <label>Remarks (Optional)</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Additional notes about this transfer..."
                rows="4"
              />
            </div>

            {/* Transfer Summary */}
            <div className="transfer-summary">
              <h4>Transfer Summary</h4>
              <div className="summary-content">
                <div className="summary-row">
                  <strong>Asset:</strong> {formData.asset_name} [{formData.asset_serial}]
                </div>
                <div className="summary-row">
                  <strong>From:</strong> {formData.current_employee_name || 'Unassigned'}
                </div>
                <div className="summary-row">
                  <strong>To:</strong> {formData.to_employee_name} ({formData.to_employee_id})
                </div>
                <div className="summary-row">
                  <strong>Date:</strong> {formData.transfer_date}
                </div>
                <div className="summary-row">
                  <strong>Reason:</strong> {formData.transfer_reason}
                </div>
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
              {loading ? 'Transferring...' : 'Transfer Asset'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssetTransfer;
