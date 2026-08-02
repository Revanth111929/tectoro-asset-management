import React, { useState, useEffect } from 'react';
import api, { employeeAPI } from '../services/api';
import { Link } from 'react-router-dom';
import AssetDetailsCard from '../components/AssetDetailsCard';
import './TemporaryAssignments.css';

function TemporaryAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  
  // Auto-fetch states
  const [originalAssetDetails, setOriginalAssetDetails] = useState(null);
  const [tempAssetDetails, setTempAssetDetails] = useState(null);
  const [loadingOriginalAsset, setLoadingOriginalAsset] = useState(false);
  const [loadingTempAsset, setLoadingTempAsset] = useState(false);
  const [employeeAssets, setEmployeeAssets] = useState([]);
  const [searchingEmployee, setSearchingEmployee] = useState(false);
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingEmployees, setSearchingEmployees] = useState(false);
  
  const [formData, setFormData] = useState({
    employee_id: '',
    employee_name: '',
    original_asset_id: '',
    temp_asset_id: '',
    reason: '',
    expected_return_date: ''
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/temporary-assignments');
      setAssignments(response.data.assignments || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAssets = async () => {
    try {
      const response = await api.get('/assets?status=Available');
      setAvailableAssets(response.data.assets || []);
    } catch (error) {
      console.error('Error fetching available assets:', error);
    }
  };

  const fetchAllAssets = async () => {
    try {
      const response = await api.get('/assets');
      setAllAssets(response.data.assets || []);
    } catch (error) {
      console.error('Error fetching all assets:', error);
    }
  };

  const openNewAssignmentModal = async () => {
    await fetchAvailableAssets();
    await fetchAllAssets();
    setShowModal(true);
    setSelectedAssignment(null);
    setOriginalAssetDetails(null);
    setTempAssetDetails(null);
    setEmployeeAssets([]);
    setEmployeeSuggestions([]);
    setShowSuggestions(false);
    setFormData({
      employee_id: '',
      employee_name: '',
      original_asset_id: '',
      temp_asset_id: '',
      reason: '',
      expected_return_date: ''
    });
  };

  // Auto-fetch original asset details when selected
  useEffect(() => {
    if (formData.original_asset_id && showModal) {
      fetchOriginalAssetDetails(formData.original_asset_id);
    } else {
      setOriginalAssetDetails(null);
    }
  }, [formData.original_asset_id, showModal]);

  // Auto-fetch temp asset details when selected
  useEffect(() => {
    if (formData.temp_asset_id && showModal) {
      fetchTempAssetDetails(formData.temp_asset_id);
    } else {
      setTempAssetDetails(null);
    }
  }, [formData.temp_asset_id, showModal]);

  // Auto-fill employee details when original asset is loaded
  useEffect(() => {
    if (originalAssetDetails && originalAssetDetails.emp_id) {
      setFormData(prev => ({
        ...prev,
        employee_id: originalAssetDetails.emp_id,
        employee_name: originalAssetDetails.employee_name || '',
        employee_email: originalAssetDetails.employee_email || ''
      }));
    }
  }, [originalAssetDetails]);

  const fetchOriginalAssetDetails = async (assetId) => {
    setLoadingOriginalAsset(true);
    try {
      const response = await api.get(`/assets/${assetId}/details`);
      setOriginalAssetDetails(response.data.asset);
    } catch (error) {
      console.error('Error fetching original asset details:', error);
    } finally {
      setLoadingOriginalAsset(false);
    }
  };

  const fetchTempAssetDetails = async (assetId) => {
    setLoadingTempAsset(true);
    try {
      const response = await api.get(`/assets/${assetId}/details`);
      setTempAssetDetails(response.data.asset);
    } catch (error) {
      console.error('Error fetching temp asset details:', error);
    } finally {
      setLoadingTempAsset(false);
    }
  };

  const searchEmployeeAssets = async () => {
    if (!formData.employee_id) {
      alert('Please enter an Employee ID');
      return;
    }

    setSearchingEmployee(true);
    try {
      const response = await api.get(`/assets/by-employee/${formData.employee_id}`);
      if (response.data.assets && response.data.assets.length > 0) {
        setEmployeeAssets(response.data.assets);
        setFormData(prev => ({
          ...prev,
          employee_name: response.data.employee_name || prev.employee_name
        }));
      } else {
        setEmployeeAssets([]);
        alert('No assets found for this employee');
      }
    } catch (error) {
      console.error('Error searching employee assets:', error);
      alert('Error: ' + (error.response?.data?.error || 'Failed to search employee assets'));
    } finally {
      setSearchingEmployee(false);
    }
  };

  const searchEmployees = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setEmployeeSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingEmployees(true);
    try {
      const response = await employeeAPI.search(searchTerm);
      setEmployeeSuggestions(response.data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching employees:', error);
      setEmployeeSuggestions([]);
    } finally {
      setSearchingEmployees(false);
    }
  };

  const selectEmployee = (employee) => {
    setFormData(prev => ({
      ...prev,
      employee_id: employee.emp_id,
      employee_name: employee.employee_name,
      employee_email: employee.email || ''
    }));
    setShowSuggestions(false);
    setEmployeeSuggestions([]);
    // Automatically search for their assets
    setTimeout(() => {
      searchEmployeeAssetsByEmployeeId(employee.emp_id);
    }, 100);
  };

  const searchEmployeeAssetsByEmployeeId = async (empId) => {
    setSearchingEmployee(true);
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
      setSearchingEmployee(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedAssignment) {
        // Complete assignment
        await api.post(`/temporary-assignments/${selectedAssignment.id}/complete`);
      } else {
        // Create new assignment
        await api.post('/temporary-assignments', formData);
      }
      setShowModal(false);
      fetchAssignments();
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Error: ' + (error.response?.data?.error || 'Failed to save assignment'));
    }
  };

  const handleComplete = (assignment) => {
    if (window.confirm(`Complete temporary assignment for ${assignment.employee_name}?\n\nThis will:\n- Return temporary asset to inventory\n- Update original asset status\n- Mark assignment as completed`)) {
      api.post(`/temporary-assignments/${assignment.id}/complete`)
        .then(() => {
          fetchAssignments();
          alert('Assignment completed successfully!');
        })
        .catch(error => {
          console.error('Error completing assignment:', error);
          alert('Error: ' + (error.response?.data?.error || 'Failed to complete assignment'));
        });
    }
  };

  const handleDelete = (assignment) => {
    if (window.confirm(`Delete temporary assignment for ${assignment.employee_name}?\n\nThis action cannot be undone.\n\nWarning: This will permanently delete the assignment record but will NOT automatically update asset statuses.`)) {
      api.delete(`/temporary-assignments/${assignment.id}`)
        .then(() => {
          fetchAssignments();
          alert('Assignment deleted successfully!');
        })
        .catch(error => {
          console.error('Error deleting assignment:', error);
          alert('Error: ' + (error.response?.data?.error || 'Failed to delete assignment'));
        });
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Active': 'success',
      'Completed': 'secondary',
      'Overdue': 'danger'
    };
    return <span className={`badge bg-${colors[status] || 'info'}`}>{status}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateDaysRemaining = (expectedDate) => {
    if (!expectedDate) return null;
    const today = new Date();
    const expected = new Date(expectedDate);
    const diff = Math.ceil((expected - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="temporary-assignments">
      <div className="page-header">
        <div>
          <h1><i className="bi bi-arrow-repeat"></i> Temporary Asset Assignments</h1>
          <p className="text-muted">Manage loaner devices during repairs and maintenance</p>
        </div>
        <button onClick={openNewAssignmentModal} className="btn btn-primary">
          <i className="bi bi-plus-circle"></i> New Temporary Assignment
        </button>
      </div>

      {/* Active Assignments Summary */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="stat-box">
            <div className="stat-icon bg-success">
              <i className="bi bi-check-circle"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{assignments.filter(a => a.status === 'Active').length}</div>
              <div className="stat-label">Active Assignments</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-box">
            <div className="stat-icon bg-warning">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{assignments.filter(a => a.status === 'Overdue').length}</div>
              <div className="stat-label">Overdue Returns</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-box">
            <div className="stat-icon bg-secondary">
              <i className="bi bi-archive"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{assignments.filter(a => a.status === 'Completed').length}</div>
              <div className="stat-label">Completed This Month</div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
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
                  <th>Employee</th>
                  <th>Original Asset</th>
                  <th>Temporary Asset</th>
                  <th>Reason</th>
                  <th>Start Date</th>
                  <th>Expected Return</th>
                  <th>Days Remaining</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      <i className="bi bi-inbox" style={{fontSize: '3rem', color: '#ccc'}}></i>
                      <p className="text-muted mt-2">No temporary assignments found</p>
                      <small>Click "New Temporary Assignment" to create one</small>
                    </td>
                  </tr>
                ) : (
                  assignments.map(assignment => {
                    const daysRemaining = calculateDaysRemaining(assignment.expected_return_date);
                    return (
                      <tr key={assignment.id}>
                        <td>
                          <div className="fw-bold">{assignment.employee_name}</div>
                          <small className="text-muted">{assignment.employee_id}</small>
                        </td>
                        <td>
                          <div>{assignment.original_asset_name}</div>
                          <small className="text-muted">{assignment.original_asset_serial}</small>
                        </td>
                        <td>
                          <div>{assignment.temp_asset_name}</div>
                          <small className="text-muted">{assignment.temp_asset_serial}</small>
                        </td>
                        <td className="text-truncate" style={{maxWidth: '200px'}}>{assignment.reason}</td>
                        <td>{formatDate(assignment.start_date)}</td>
                        <td>{formatDate(assignment.expected_return_date)}</td>
                        <td>
                          {daysRemaining !== null && assignment.status === 'Active' && (
                            <span className={`badge ${daysRemaining < 0 ? 'bg-danger' : daysRemaining < 7 ? 'bg-warning' : 'bg-info'}`}>
                              {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}
                            </span>
                          )}
                        </td>
                        <td>{getStatusBadge(assignment.status)}</td>
                        <td>
                          {assignment.status === 'Active' && (
                            <div className="btn-group btn-group-sm">
                              <button 
                                onClick={() => handleComplete(assignment)}
                                className="btn btn-success"
                                title="Complete Assignment"
                              >
                                <i className="bi bi-check-circle"></i> Complete
                              </button>
                              <button 
                                onClick={() => handleDelete(assignment)}
                                className="btn btn-danger"
                                title="Delete Assignment"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          )}
                          {assignment.status === 'Completed' && (
                            <div className="btn-group btn-group-sm">
                              <span className="text-muted small me-2">
                                Completed on {formatDate(assignment.actual_return_date)}
                              </span>
                              <button 
                                onClick={() => handleDelete(assignment)}
                                className="btn btn-danger"
                                title="Delete Assignment"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Assignment Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle me-2"></i>
                  New Temporary Assignment
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Loaner Device Workflow:</strong> Assign a temporary asset to an employee while their original device is being repaired or replaced.
                  </div>

                  <div className="row g-3">
                    {/* Employee Search Section */}
                    <div className="col-12">
                      <div className="card" style={{background: '#f8f9fa', border: '1px solid #dee2e6'}}>
                        <div className="card-body">
                          <h6 className="card-title mb-3">
                            <i className="bi bi-search me-2"></i>Find Employee Assets
                          </h6>
                          <div className="row g-2">
                            <div className="col-md-10">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Search by Employee ID or Name..."
                                value={formData.employee_id || formData.employee_name}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFormData({...formData, employee_id: value, employee_name: value});
                                  searchEmployees(value);
                                }}
                                onFocus={() => {
                                  if (employeeSuggestions.length > 0) {
                                    setShowSuggestions(true);
                                  }
                                }}
                              />
                              {/* Employee Suggestions Dropdown */}
                              {showSuggestions && employeeSuggestions.length > 0 && (
                                <div style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: '0',
                                  right: '0',
                                  background: 'white',
                                  border: '1px solid #dee2e6',
                                  borderRadius: '4px',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  zIndex: 1000,
                                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                  marginTop: '4px'
                                }}>
                                  {employeeSuggestions.map((emp, index) => (
                                    <div
                                      key={index}
                                      onClick={() => selectEmployee(emp)}
                                      style={{
                                        padding: '10px 15px',
                                        cursor: 'pointer',
                                        borderBottom: index < employeeSuggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                                        transition: 'background-color 0.2s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                    >
                                      <div style={{ fontWeight: '500', color: '#212529' }}>
                                        {emp.employee_name}
                                      </div>
                                      <small style={{ color: '#6c757d' }}>
                                        ID: {emp.emp_id} {emp.email && `• ${emp.email}`}
                                      </small>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {searchingEmployees && (
                                <small className="text-muted">
                                  <span className="spinner-border spinner-border-sm me-1"></span>
                                  Searching...
                                </small>
                              )}
                            </div>
                            <div className="col-md-2">
                              <button
                                type="button"
                                className="btn btn-primary w-100"
                                onClick={searchEmployeeAssets}
                                disabled={searchingEmployee || !formData.employee_id}
                              >
                                {searchingEmployee ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                  <i className="bi bi-search"></i>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Employee Assets List */}
                          {employeeAssets.length > 0 && (
                            <div className="mt-3">
                              <small className="text-muted">
                                <strong>{employeeAssets.length} asset(s) found:</strong>
                              </small>
                              <div className="list-group mt-2" style={{maxHeight: '200px', overflowY: 'auto'}}>
                                {employeeAssets.map(asset => (
                                  <button
                                    key={asset.id}
                                    type="button"
                                    className={`list-group-item list-group-item-action ${formData.original_asset_id === asset.id.toString() ? 'active' : ''}`}
                                    onClick={() => setFormData({...formData, original_asset_id: asset.id.toString()})}
                                  >
                                    <div className="d-flex justify-content-between align-items-center">
                                      <div>
                                        <strong>{asset.asset_name}</strong>
                                        <br />
                                        <small>SN: {asset.serial_number} • {asset.category}</small>
                                      </div>
                                      <span className={`badge bg-${asset.status === 'Assigned' ? 'success' : 'secondary'}`}>
                                        {asset.status}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Employee ID <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.employee_id}
                        onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                        required
                        placeholder="e.g., EMP001"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Employee Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.employee_name}
                        onChange={(e) => setFormData({...formData, employee_name: e.target.value})}
                        required
                        placeholder="e.g., John Smith"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Original Asset (Under Repair) <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={formData.original_asset_id}
                        onChange={(e) => setFormData({...formData, original_asset_id: e.target.value})}
                        required
                      >
                        <option value="">-- Select Asset to Repair --</option>
                        {allAssets.map(asset => (
                          <option key={asset.id} value={asset.id}>
                            {asset.asset_name} - {asset.serial_number} ({asset.status})
                          </option>
                        ))}
                      </select>
                      <small className="text-muted">The asset that needs repair/maintenance</small>

                      {/* Original Asset Details */}
                      {loadingOriginalAsset && (
                        <div className="text-center mt-3">
                          <div className="spinner-border spinner-border-sm text-primary"></div>
                          <small className="ms-2 text-muted">Loading asset details...</small>
                        </div>
                      )}
                      {originalAssetDetails && !loadingOriginalAsset && (
                        <div className="mt-3">
                          <AssetDetailsCard asset={originalAssetDetails} title="Original Asset Details" collapsible={true} />
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Temporary Asset (Loaner) <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={formData.temp_asset_id}
                        onChange={(e) => setFormData({...formData, temp_asset_id: e.target.value})}
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

                      {/* Temp Asset Details */}
                      {loadingTempAsset && (
                        <div className="text-center mt-3">
                          <div className="spinner-border spinner-border-sm text-primary"></div>
                          <small className="ms-2 text-muted">Loading asset details...</small>
                        </div>
                      )}
                      {tempAssetDetails && !loadingTempAsset && (
                        <div className="mt-3">
                          <AssetDetailsCard asset={tempAssetDetails} title="Temporary Asset Details" collapsible={true} />
                        </div>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label">Reason for Temporary Assignment <span className="text-danger">*</span></label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.reason}
                        onChange={(e) => setFormData({...formData, reason: e.target.value})}
                        required
                        placeholder="e.g., Screen replacement, Battery repair, Keyboard malfunction..."
                      ></textarea>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Expected Return Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.expected_return_date}
                        onChange={(e) => setFormData({...formData, expected_return_date: e.target.value})}
                      />
                      <small className="text-muted">Estimated repair completion date</small>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-circle me-2"></i>Create Assignment
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

export default TemporaryAssignments;
