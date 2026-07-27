// CorporateSimView.js – View Corporate SIM details
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { corporateSimAPI } from '../services/api';
import { canPerform } from '../utils/permissions';

function CorporateSimView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sim, setSim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    corporateSimAPI.getById(id)
      .then(res => {
        setSim(res.data.sim);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load SIM details');
        setLoading(false);
      });
  }, [id]);

  const getStatusBadge = (st) => {
    const colors = {
      'Available': 'success',
      'Assigned': 'primary',
      'Active': 'info',
      'Suspended': 'warning',
      'Returned': 'secondary',
      'Lost': 'danger',
      'Damaged': 'danger',
      'Terminated': 'dark'
    };
    return <span className={`badge bg-${colors[st] || 'secondary'} fs-6`}>{st}</span>;
  };

  if (loading) {
    return (
      <div className="container-fluid py-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !sim) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">{error || 'SIM not found'}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/corporate-sims')}>
          <i className="bi bi-arrow-left me-2"></i>Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div className="d-flex align-items-center">
              <button className="btn btn-outline-secondary me-3" onClick={() => navigate('/corporate-sims')}>
                <i className="bi bi-arrow-left"></i>
              </button>
              <div>
                <h2 className="mb-1">
                  <i className="bi bi-sim me-2"></i>Corporate SIM Details
                </h2>
                <p className="text-muted mb-0">Complete information about this SIM card</p>
              </div>
            </div>
            {canPerform('edit') && (
              <Link to={`/corporate-sims/edit/${sim.id}`} className="btn btn-primary">
                <i className="bi bi-pencil me-2"></i>Edit SIM
              </Link>
            )}
          </div>

          {/* SIM Details Card */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-card-text me-2"></i>SIM Identification
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="text-muted small">ICCID</div>
                  <div className="fw-bold"><code>{sim.iccid}</code></div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="text-muted small">Mobile Number</div>
                  <div className="fw-bold">{sim.mobile_number || '—'}</div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="text-muted small">Status</div>
                  <div>{getStatusBadge(sim.status)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Carrier Info Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-tower me-2"></i>Carrier Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <div className="text-muted small">Carrier</div>
                  <div className="fw-bold">{sim.carrier}</div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="text-muted small">Plan Type</div>
                  <div className="fw-bold">{sim.plan_type || '—'}</div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="text-muted small">Monthly Cost</div>
                  <div className="fw-bold">{sim.monthly_cost ? `₹${sim.monthly_cost}` : '—'}</div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="text-muted small">Data Limit</div>
                  <div className="fw-bold">{sim.data_limit_gb ? `${sim.data_limit_gb} GB` : '—'}</div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="text-muted small">Corporate Account</div>
                  <div className="fw-bold">{sim.corporate_account || '—'}</div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="text-muted small">Account Manager</div>
                  <div className="fw-bold">{sim.account_manager || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Card */}
          {sim.assigned_employee_name && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-person me-2"></i>Assignment Details
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <div className="text-muted small">Employee Name</div>
                    <div className="fw-bold">{sim.assigned_employee_name}</div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="text-muted small">Employee ID</div>
                    <div className="fw-bold">{sim.assigned_employee_id}</div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="text-muted small">Employee Email</div>
                    <div className="fw-bold">{sim.assigned_employee_email || '—'}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="text-muted small">Assignment Date</div>
                    <div className="fw-bold">
                      {sim.assignment_date ? new Date(sim.assignment_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="text-muted small">Return Date</div>
                    <div className="fw-bold">
                      {sim.return_date ? new Date(sim.return_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Purchase Details Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-cart me-2"></i>Purchase & Activation
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="text-muted small">Vendor</div>
                  <div className="fw-bold">{sim.vendor || '—'}</div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="text-muted small">Purchase Date</div>
                  <div className="fw-bold">
                    {sim.purchase_date ? new Date(sim.purchase_date).toLocaleDateString() : '—'}
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="text-muted small">Activation Date</div>
                  <div className="fw-bold">
                    {sim.activation_date ? new Date(sim.activation_date).toLocaleDateString() : '—'}
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="text-muted small">SIM Type</div>
                  <div className="fw-bold">{sim.sim_type || '—'}</div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="text-muted small">PUK Code</div>
                  <div className="fw-bold">{sim.puk_code ? <code>{sim.puk_code}</code> : '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Remarks Card */}
          {sim.remarks && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-chat-left-text me-2"></i>Remarks / Notes
                </h5>
              </div>
              <div className="card-body">
                <div style={{ whiteSpace: 'pre-wrap' }}>{sim.remarks}</div>
              </div>
            </div>
          )}

          {/* Audit Info */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>Audit Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="text-muted small">Created By</div>
                  <div className="fw-bold">{sim.created_by || '—'}</div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="text-muted small">Created At</div>
                  <div className="fw-bold">
                    {sim.created_at ? new Date(sim.created_at).toLocaleString() : '—'}
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="text-muted small">Updated By</div>
                  <div className="fw-bold">{sim.updated_by || '—'}</div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="text-muted small">Updated At</div>
                  <div className="fw-bold">
                    {sim.updated_at ? new Date(sim.updated_at).toLocaleString() : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CorporateSimView;
