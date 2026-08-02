import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AssetReplacements.css';

function AssetReplacements() {
  const [replacements, setReplacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [employeeAssets, setEmployeeAssets] = useState([]);
  const [loadingEmployeeAssets, setLoadingEmployeeAssets] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    employee_name: '',
    old_asset_id: '',
    new_asset_id: '',
    reason: '',
    old_asset_condition: 'Good',
    remarks: ''
  });

  const replacementReasons = [
    'Hardware Upgrade',
    'Performance Issues',
    'Hardware Failure',
    'Damaged Beyond Repair',
    'Lost/Stolen',
    'End of Life',
    'Employee Request',
    'Other'
  ];

  const conditionOptions = [
    'Good',
    'Fair',
    'Poor',
    'Damaged',
    'Not Working'
  ];

  useEffect(() => {
    fetchReplacements();
  }, []);

  const fetchReplacements = async () => {
    setLoading(true);
    try {
      const response = await api.get('/asset-replacements');
      setReplacements(response.data.replacements || []);
    } catch (error) {
      console.error('Error fetching replacements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAssets = async () => {
    try {
      const response = await api.get('/assets', { params: { status: 'Available' } });
      setAvailableAssets(response.data.assets || []);
    } catch (error) {
      console.error('Error fetching available assets:', error);
    }
  };

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

  const selectEmployee = async (employee) => {
    setFormData({
      ...formData,
      employee_id: employee.emp_id,
      employee_name: employee.employee_name
    });
    setEmployeeSearch(`${employee.employee_name} (${employee.emp_id})`);
    setShowEmployeeSuggestions(false);
    setEmployeeSuggestions([]);
    
    // Automatically fetch assets assigned to this employee
    await fetchEmployeeAssets(employee.emp_id);
  };

  const fetchEmployeeAssets = async (empId) => {
    if (!empId) return;
    
    setLoadingEmployeeAssets(true);
    try {
      const response = await api.get(`/assets/by-employee/${empId}`);
      if (response.data.assets && response.data.assets.length > 0) {
        setEmployeeAssets(response.data.assets);
      } else {
        setEmployeeAssets([]);
      }
    } catch (error) {
      console.error('Error fetching employee assets:', error);
      setEmployeeAssets([]);
    } finally {
      setLoadingEmployeeAssets(false);
    }
  };

  const openNewReplacementModal = async () => {
    await fetchAvailableAssets();
    setShowModal(true);
    setFormData({
      employee_id: '',
      employee_name: '',
      old_asset_id: '',
      new_asset_id: '',
      reason: '',
      old_asset_condition: 'Good',
      remarks: ''
    });
    setEmployeeSearch('');
    setEmployeeSuggestions([]);
    setShowEmployeeSuggestions(false);
    setEmployeeAssets([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/asset-replacements', formData);
      setShowModal(false);
      fetchReplacements();
      alert('Asset replacement completed successfully!');
    } catch (error) {
      console.error('Error creating replacement:', error);
      alert('Error: ' + (error.response?.data?.error || 'Failed to create replacement'));
    }
  };

  const handleDelete = (replacement) => {
    if (window.confirm(`Delete asset replacement for ${replacement.employee_name}?\n\nOld: ${replacement.old_asset_name}\nNew: ${replacement.new_asset_name}\n\nThis action cannot be undone.\n\nWarning: This will permanently delete the replacement record but will NOT automatically update asset statuses.`)) {
      api.delete(`/asset-replacements/${replacement.id}`)
        .then(() => {
          fetchReplacements();
          alert('Replacement deleted successfully!');
        })
        .catch(error => {
          console.error('Error deleting replacement:', error);
          alert('Error: ' + (error.response?.data?.error || 'Failed to delete replacement'));
        });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getReasonBadge = (reason) => {
    const colors = {
      'Hardware Upgrade': 'primary',
      'Performance Issues': 'warning',
      'Hardware Failure': 'danger',
      'Damaged Beyond Repair': 'danger',
      'Lost/Stolen': 'danger',
      'End of Life': 'secondary',
      'Employee Request': 'info',
      'Other': 'secondary'
    };
    return <span className={`badge bg-${colors[reason] || 'secondary'}`}>{reason}</span>;
  };

  const getConditionBadge = (condition) => {
    const colors = {
      'Good': 'success',
      'Fair': 'info',
      'Poor': 'warning',
      'Damaged': 'danger',
      'Not Working': 'danger'
    };
    return <span className={`badge bg-${colors[condition] || 'secondary'}`}>{condition}</span>;
  };

  return (
    <div className="asset-replacements">
      <div className="page-header">
        <div>
          <h1><i className="bi bi-arrow-left-right"></i> Asset Replacements</h1>
          <p className="text-muted">Manage permanent asset upgrades and swaps</p>
        </div>
        <button onClick={openNewReplacementModal} className="btn btn-primary">
          <i className="bi bi-plus-circle"></i> New Replacement
        </button>
      </div>

      {/* Summary Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="stat-box">
            <div className="stat-icon bg-primary">
              <i className="bi bi-arrow-repeat"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{replacements.length}</div>
              <div className="stat-label">Total Replacements</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-box">
            <div className="stat-icon bg-success">
              <i className="bi bi-arrow-up-circle"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">
                {replacements.filter(r => r.reason === 'Hardware Upgrade').length}
              </div>
              <div className="stat-label">Hardware Upgrades</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-box">
            <div className="stat-icon bg-danger">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">
                {replacements.filter(r => ['Hardware Failure', 'Damaged Beyond Repair'].includes(r.reason)).length}
              </div>
              <div className="stat-label">Failures/Damages</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-box">
            <div className="stat-icon bg-info">
              <i className="bi bi-calendar-month"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">
                {replacements.filter(r => {
                  const date = new Date(r.replacement_date);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <div className="stat-label">This Month</div>
            </div>
          </div>
        </div>
      </div>

      {/* Replacements Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-responsive" style={{ maxHeight: "calc(100vh - 340px)", overflowY: "auto" }}>
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Old Asset</th>
                  <th>New Asset</th>
                  <th>Reason</th>
                  <th>Old Condition</th>
                  <th>Performed By</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {replacements.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      <i className="bi bi-inbox" style={{fontSize: '3rem', color: '#ccc'}}></i>
                      <p className="text-muted mt-2">No asset replacements found</p>
                      <small>Click "New Replacement" to create one</small>
                    </td>
                  </tr>
                ) : (
                  replacements.map(replacement => (
                    <tr key={replacement.id}>
                      <td>{formatDate(replacement.replacement_date)}</td>
                      <td>
                        <div className="fw-bold">{replacement.employee_name}</div>
                        <small className="text-muted">{replacement.employee_id}</small>
                      </td>
                      <td>
                        <div>{replacement.old_asset_name}</div>
                        <small className="text-muted">{replacement.old_asset_serial}</small>
                      </td>
                      <td>
                        <div>{replacement.new_asset_name}</div>
                        <small className="text-muted">{replacement.new_asset_serial}</small>
                      </td>
                      <td>{getReasonBadge(replacement.reason)}</td>
                      <td>{getConditionBadge(replacement.old_asset_condition)}</td>
                      <td>
                        <span className="badge bg-light text-dark">
                          <i className="bi bi-person"></i> {replacement.performed_by}
                        </span>
                      </td>
                      <td className="text-truncate" style={{maxWidth: '200px'}}>
                        {replacement.remarks || '-'}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDelete(replacement)}
                          className="btn btn-sm btn-danger"
                          title="Delete Replacement"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Replacement Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-arrow-left-right me-2"></i>
                  New Asset Replacement
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Asset Swap:</strong> Permanently replace an employee's current asset with a new one. The old asset will be marked as replaced/retired.
                  </div>

                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Search Employee <span className="text-danger">*</span></label>
                      <div className="position-relative">
                        <input
                          type="text"
                          className="form-control"
                          value={employeeSearch}
                          onChange={handleEmployeeSearchChange}
                          placeholder="Type employee ID or name (min 2 characters)..."
                          required={!formData.employee_id}
                        />
                        {showEmployeeSuggestions && employeeSuggestions.length > 0 && (
                          <div className="list-group position-absolute w-100" style={{
                            zIndex: 1000,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}>
                            {employeeSuggestions.map((employee) => (
                              <button
                                key={employee.emp_id}
                                type="button"
                                className="list-group-item list-group-item-action"
                                onClick={() => selectEmployee(employee)}
                              >
                                <div className="d-flex justify-content-between">
                                  <div>
                                    <strong>{employee.employee_name}</strong>
                                    <br />
                                    <small className="text-muted">
                                      ID: {employee.emp_id} | {employee.department || 'N/A'} | {employee.location || 'N/A'}
                                    </small>
                                  </div>
                                  <span className="badge bg-primary align-self-center">Select</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {formData.employee_id && (
                        <div className="alert alert-success mt-2 mb-0">
                          <i className="bi bi-check-circle me-2"></i>
                          Selected: <strong>{formData.employee_name}</strong> ({formData.employee_id})
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Old Asset (Being Replaced) <span className="text-danger">*</span></label>
                      {loadingEmployeeAssets ? (
                        <div className="form-control d-flex align-items-center">
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Loading employee assets...
                        </div>
                      ) : (
                        <>
                          <select
                            className="form-select"
                            value={formData.old_asset_id}
                            onChange={(e) => setFormData({...formData, old_asset_id: e.target.value})}
                            required
                            disabled={!formData.employee_id}
                          >
                            <option value="">
                              {!formData.employee_id 
                                ? '-- Select Employee First --' 
                                : employeeAssets.length === 0 
                                  ? '-- No Assets Assigned to Employee --'
                                  : '-- Select Asset to Replace --'}
                            </option>
                            {employeeAssets.map(asset => (
                              <option key={asset.id} value={asset.id}>
                                {asset.asset_name} - {asset.serial_number} ({asset.category})
                              </option>
                            ))}
                          </select>
                          <small className="text-muted">
                            {formData.employee_id 
                              ? employeeAssets.length === 0 
                                ? 'No assets currently assigned to this employee'
                                : `${employeeAssets.length} asset(s) assigned to this employee`
                              : 'Select an employee to view their assets'}
                          </small>
                        </>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">New Asset (Replacement) <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={formData.new_asset_id}
                        onChange={(e) => setFormData({...formData, new_asset_id: e.target.value})}
                        required
                      >
                        <option value="">-- Select Available Asset --</option>
                        {availableAssets.map(asset => (
                          <option key={asset.id} value={asset.id}>
                            {asset.asset_name} - {asset.serial_number} ({asset.category})
                          </option>
                        ))}
                      </select>
                      <small className="text-muted">{availableAssets.length} available assets</small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Replacement Reason <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={formData.reason}
                        onChange={(e) => setFormData({...formData, reason: e.target.value})}
                        required
                      >
                        <option value="">-- Select Reason --</option>
                        {replacementReasons.map(reason => (
                          <option key={reason} value={reason}>{reason}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Old Asset Condition <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={formData.old_asset_condition}
                        onChange={(e) => setFormData({...formData, old_asset_condition: e.target.value})}
                        required
                      >
                        {conditionOptions.map(condition => (
                          <option key={condition} value={condition}>{condition}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Remarks / Additional Details</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.remarks}
                        onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                        placeholder="Any additional notes about the replacement..."
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-circle me-2"></i>Complete Replacement
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetReplacements;
