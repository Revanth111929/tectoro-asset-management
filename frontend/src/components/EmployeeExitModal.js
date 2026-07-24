// EmployeeExitModal.js - Modal for processing employee exit and asset recovery
import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../services/api';
import './EmployeeExitModal.css';

function EmployeeExitModal({ employee, onClose, onSuccess }) {
  const [assets, setAssets] = useState(employee.assets || []);
  const [loading, setLoading] = useState(!employee.assets);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Asset recovery, 2: Confirmation
  
  // Form data
  const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0]);
  const [exitNotes, setExitNotes] = useState('');
  const [assetRecovery, setAssetRecovery] = useState({});

  useEffect(() => {
    // Only load from API if assets not provided
    if (!employee.assets || employee.assets.length === 0) {
      loadEmployeeAssets();
    } else {
      // Initialize recovery status for each asset
      const initialRecovery = {};
      employee.assets.forEach(asset => {
        initialRecovery[asset.id] = {
          asset_id: asset.id,
          recovery_status: 'returned',
          notes: ''
        };
      });
      setAssetRecovery(initialRecovery);
    }
  }, [employee]);

  const loadEmployeeAssets = async () => {
    try {
      setLoading(true);
      console.log('Loading assets for employee:', employee.emp_id);
      const res = await employeeAPI.getAssets(employee.emp_id);
      console.log('Assets loaded:', res.data);
      setAssets(res.data || []);
      
      // Initialize recovery status for each asset
      const initialRecovery = {};
      (res.data || []).forEach(asset => {
        initialRecovery[asset.id] = {
          asset_id: asset.id,
          recovery_status: 'returned',
          notes: ''
        };
      });
      setAssetRecovery(initialRecovery);
    } catch (err) {
      setError('Failed to load employee assets');
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateAssetRecovery = (assetId, field, value) => {
    setAssetRecovery(prev => ({
      ...prev,
      [assetId]: {
        ...prev[assetId],
        [field]: value
      }
    }));
  };

  const handleNext = () => {
    if (!exitDate) {
      setError('Please select an exit date');
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async () => {
    setProcessing(true);
    setError('');

    try {
      const exitData = {
        exit_date: exitDate,
        exit_notes: exitNotes,
        assets: Object.values(assetRecovery)
      };

      console.log('Submitting exit data:', exitData);
      const res = await employeeAPI.processExit(employee.emp_id, exitData);
      console.log('Exit response:', res.data);
      
      if (onSuccess) {
        onSuccess(res.data.summary);
      }
      onClose();
    } catch (err) {
      console.error('Exit error:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to process employee exit';
      setError(errorMsg);
      setProcessing(false);
      setStep(1); // Go back to step 1 to fix the issue
    }
  };

  const getSummary = () => {
    const returned = Object.values(assetRecovery).filter(a => a.recovery_status === 'returned').length;
    const missing = Object.values(assetRecovery).filter(a => a.recovery_status === 'missing').length;
    const damaged = Object.values(assetRecovery).filter(a => a.recovery_status === 'damaged').length;
    return { returned, missing, damaged, total: assets.length };
  };

  const summary = getSummary();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="exit-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="exit-modal-header">
          <div>
            <h3>
              <i className="bi bi-box-arrow-right me-2"></i>
              Employee Exit Process
            </h3>
            <p className="text-muted mb-0">
              {employee.employee_name} ({employee.emp_id})
            </p>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="exit-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Asset Recovery</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Confirmation</span>
          </div>
        </div>

        {/* Body */}
        <div className="exit-modal-body">
          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
              <p className="mt-2 text-muted">Loading assigned assets...</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#cbd5e1' }}></i>
              <p className="mt-2 text-muted">No assets assigned to this employee</p>
              <button className="btn btn-secondary mt-3" onClick={onClose}>Close</button>
            </div>
          ) : (
            <>
              {/* Step 1: Asset Recovery */}
              {step === 1 && (
                <div className="step-content">
                  <div className="alert alert-info mb-4">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    <strong>Mark the recovery status for each asset:</strong>
                    <div className="mt-2 small">
                      • <strong>Returned:</strong> Asset received in good condition<br />
                      • <strong>Missing:</strong> Asset not recovered<br />
                      • <strong>Damaged:</strong> Asset returned but needs repair
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">Assigned Assets ({assets.length})</h6>
                  
                  <div className="assets-list">
                    {assets.map(asset => (
                      <div key={asset.id} className="asset-recovery-item">
                        <div className="asset-info">
                          <div className="asset-name-serial">
                            <strong>{asset.asset_name}</strong>
                            <span className="badge bg-secondary ms-2">{asset.category}</span>
                          </div>
                          <small className="text-muted">Serial: {asset.serial_number}</small>
                        </div>

                        <div className="recovery-options">
                          <label className="recovery-option">
                            <input
                              type="radio"
                              name={`recovery-${asset.id}`}
                              value="returned"
                              checked={assetRecovery[asset.id]?.recovery_status === 'returned'}
                              onChange={e => updateAssetRecovery(asset.id, 'recovery_status', e.target.value)}
                            />
                            <span className="option-label returned">
                              <i className="bi bi-check-circle-fill"></i> Returned
                            </span>
                          </label>

                          <label className="recovery-option">
                            <input
                              type="radio"
                              name={`recovery-${asset.id}`}
                              value="missing"
                              checked={assetRecovery[asset.id]?.recovery_status === 'missing'}
                              onChange={e => updateAssetRecovery(asset.id, 'recovery_status', e.target.value)}
                            />
                            <span className="option-label missing">
                              <i className="bi bi-exclamation-triangle-fill"></i> Missing
                            </span>
                          </label>

                          <label className="recovery-option">
                            <input
                              type="radio"
                              name={`recovery-${asset.id}`}
                              value="damaged"
                              checked={assetRecovery[asset.id]?.recovery_status === 'damaged'}
                              onChange={e => updateAssetRecovery(asset.id, 'recovery_status', e.target.value)}
                            />
                            <span className="option-label damaged">
                              <i className="bi bi-tools"></i> Damaged
                            </span>
                          </label>
                        </div>

                        <input
                          type="text"
                          className="form-control form-control-sm mt-2"
                          placeholder="Add notes (optional)..."
                          value={assetRecovery[asset.id]?.notes || ''}
                          onChange={e => updateAssetRecovery(asset.id, 'notes', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="exit-details mt-4">
                    <h6 className="fw-bold mb-3">Exit Details</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-500">
                          Exit Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          value={exitDate}
                          onChange={e => setExitDate(e.target.value)}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-500">Exit Notes</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          placeholder="Reason for leaving, handover notes, etc..."
                          value={exitNotes}
                          onChange={e => setExitNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Confirmation */}
              {step === 2 && (
                <div className="step-content">
                  <div className="alert alert-warning mb-4">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Please confirm before proceeding:</strong> This action will mark the employee as exited and update all asset statuses.
                  </div>

                  <div className="confirmation-summary">
                    <h6 className="fw-bold mb-3">Exit Summary</h6>
                    
                    <div className="summary-grid">
                      <div className="summary-item">
                        <div className="summary-label">Employee</div>
                        <div className="summary-value">{employee.employee_name}</div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-label">Employee ID</div>
                        <div className="summary-value">{employee.emp_id}</div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-label">Exit Date</div>
                        <div className="summary-value">{new Date(exitDate).toLocaleDateString()}</div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-label">Total Assets</div>
                        <div className="summary-value">{summary.total}</div>
                      </div>
                    </div>

                    <h6 className="fw-bold mt-4 mb-3">Asset Recovery Status</h6>
                    <div className="recovery-summary">
                      <div className="recovery-stat success">
                        <i className="bi bi-check-circle-fill"></i>
                        <div>
                          <div className="stat-number">{summary.returned}</div>
                          <div className="stat-label">Returned</div>
                        </div>
                      </div>
                      <div className="recovery-stat warning">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        <div>
                          <div className="stat-number">{summary.missing}</div>
                          <div className="stat-label">Missing</div>
                        </div>
                      </div>
                      <div className="recovery-stat danger">
                        <i className="bi bi-tools"></i>
                        <div>
                          <div className="stat-number">{summary.damaged}</div>
                          <div className="stat-label">Damaged</div>
                        </div>
                      </div>
                    </div>

                    {exitNotes && (
                      <div className="mt-3">
                        <strong className="text-muted small">Exit Notes:</strong>
                        <p className="mb-0 mt-1">{exitNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && assets.length > 0 && (
          <div className="exit-modal-footer">
            {step === 1 ? (
              <>
                <button className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleNext}>
                  Next: Review <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={handleBack} disabled={processing}>
                  <i className="bi bi-arrow-left me-2"></i> Back
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleSubmit}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Confirm Employee Exit
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeExitModal;
