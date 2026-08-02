// OnboardingView.js – Read-only detail view with Convert-to-Employee action
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { canPerform } from '../utils/permissions';
import { onboardingAPI } from '../services/api';

function OnboardingView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showConvert, setShowConvert] = useState(false);
  const [empId, setEmpId] = useState('');
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState('');

  const load = () => {
    setLoading(true);
    onboardingAPI.getById(id)
      .then(res => setRecord(res.data.onboarding))
      .catch(() => setError('Failed to load onboarding record'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConvert = async () => {
    if (!empId.trim()) { setConvertError('Employee ID is required'); return; }
    setConverting(true);
    setConvertError('');
    try {
      await onboardingAPI.convertToEmployee(id, { emp_id: empId.trim() });
      setShowConvert(false);
      load();
      alert(`${record.name} has been converted to an active employee (${empId.trim()})`);
    } catch (err) {
      setConvertError(err.response?.data?.error || 'Failed to convert to employee');
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (error || !record) {
    return <div className="alert alert-danger">{error || 'Record not found'}</div>;
  }

  const statusBadge = (s) => {
    const map = { Pending: 'secondary', 'In Progress': 'warning', Completed: 'info', Converted: 'success' };
    return <span className={`badge bg-${map[s] || 'secondary'}`}>{s}</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">{record.name}</h2>
          <div className="d-flex align-items-center gap-2">
            {statusBadge(record.status)}
            <span className="text-muted small">Created {new Date(record.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="d-flex gap-2">
          {canPerform('edit') && record.status !== 'Converted' && (
            <Link to={`/onboarding/edit/${record.id}`} className="btn btn-outline-secondary">
              <i className="bi bi-pencil me-2"></i>Edit
            </Link>
          )}
          {record.status !== 'Converted' && canPerform('create') && (
            <button className="btn btn-success" onClick={() => setShowConvert(true)}>
              <i className="bi bi-person-check me-2"></i>Convert to Employee
            </button>
          )}
        </div>
      </div>

      {record.status === 'Converted' && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-check-circle-fill"></i>
          Converted to active employee <strong>{record.converted_emp_id}</strong> on{' '}
          {new Date(record.converted_at).toLocaleDateString()}.
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-6">
          <div className="table-card h-100">
            <h6 className="fw-bold mb-3 text-primary"><i className="bi bi-person me-2"></i>Employee Information</h6>
            <table className="table table-borderless mb-0">
              <tbody>
                <tr><td className="text-muted" style={{ width: '140px' }}>Email</td><td>{record.email}</td></tr>
                <tr><td className="text-muted">Phone</td><td>{record.phone_number}</td></tr>
                <tr><td className="text-muted">Designation</td><td>{record.designation}</td></tr>
                <tr><td className="text-muted">Team</td><td><span className="badge bg-light text-dark border">{record.team}</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-md-6">
          <div className="table-card h-100">
            <h6 className="fw-bold mb-3 text-primary"><i className="bi bi-shield-lock me-2"></i>Application Access</h6>
            {record.application_access && record.application_access.length > 0 ? (
              <div className="d-flex flex-wrap gap-2">
                {record.application_access.map(app => (
                  <span key={app} className="badge bg-light text-dark border">{app}</span>
                ))}
              </div>
            ) : <p className="text-muted mb-0">No application access assigned</p>}
          </div>
        </div>

        <div className="col-12">
          <div className="table-card">
            <h6 className="fw-bold mb-3 text-primary"><i className="bi bi-laptop me-2"></i>Assets Assigned</h6>
            {record.assets_assigned && record.assets_assigned.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr><th>Asset Name</th><th>Serial Number</th><th>Category</th></tr>
                  </thead>
                  <tbody>
                    {record.assets_assigned.map(a => (
                      <tr key={a.id}>
                        <td className="fw-500">{a.asset_name}</td>
                        <td><code className="small">{a.asset_serial}</code></td>
                        <td><span className="badge bg-light text-dark border">{a.asset_category}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-muted mb-0">No assets assigned yet</p>}
          </div>
        </div>
      </div>

      {/* Convert Modal */}
      {showConvert && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Convert {record.name} to Active Employee</h5>
                <button type="button" className="btn-close" onClick={() => setShowConvert(false)}></button>
              </div>
              <div className="modal-body">
                {convertError && <div className="alert alert-danger py-2">{convertError}</div>}
                <label className="form-label">Employee ID<span className="text-danger ms-1">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. TT945"
                  value={empId}
                  onChange={e => setEmpId(e.target.value)}
                  autoFocus
                />
                <div className="mt-3 text-muted small">
                  <i className="bi bi-info-circle me-1"></i>
                  This creates a real Employee record using this onboarding data — no fields will need to be re-entered.
                  Any assigned assets will be transferred to the new employee automatically.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowConvert(false)}>Cancel</button>
                <button type="button" className="btn btn-success" onClick={handleConvert} disabled={converting}>
                  {converting
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Converting…</>
                    : <><i className="bi bi-check-circle me-2"></i>Confirm Conversion</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OnboardingView;
