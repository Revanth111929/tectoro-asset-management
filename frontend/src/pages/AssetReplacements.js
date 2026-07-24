import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AssetReplacements.css';

function AssetReplacements() {
  const [replacements, setReplacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
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
      const response = await axios.get('/api/asset-replacements');
      setReplacements(response.data.replacements || []);
    } catch (error) {
      console.error('Error fetching replacements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAssets = async () => {
    try {
      const response = await axios.get('/api/assets?status=Available');
      setAvailableAssets(response.data.assets || []);
    } catch (error) {
      console.error('Error fetching available assets:', error);
    }
  };

  const fetchAllAssets = async () => {
    try {
      const response = await axios.get('/api/assets');
      setAllAssets(response.data.assets || []);
    } catch (error) {
      console.error('Error fetching all assets:', error);
    }
  };

  const openNewReplacementModal = async () => {
    await fetchAvailableAssets();
    await fetchAllAssets();
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/asset-replacements', formData);
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
      axios.delete(`/api/asset-replacements/${replacement.id}`)
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
          <div className="table-responsive">
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
                      <label className="form-label">Old Asset (Being Replaced) <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={formData.old_asset_id}
                        onChange={(e) => setFormData({...formData, old_asset_id: e.target.value})}
                        required
                      >
                        <option value="">-- Select Asset to Replace --</option>
                        {allAssets.map(asset => (
                          <option key={asset.id} value={asset.id}>
                            {asset.asset_name} - {asset.serial_number} ({asset.status})
                          </option>
                        ))}
                      </select>
                      <small className="text-muted">The asset currently assigned to employee</small>
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
