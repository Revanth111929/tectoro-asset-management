// AssetView.js – Full detail view of a single asset (all 20 columns)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assetAPI } from '../services/api';

function AssetView() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [asset,   setAsset]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    assetAPI.getById(id)
      .then(res => setAsset(res.data))
      .catch(() => setError('Asset not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  );

  if (error || !asset) return (
    <div className="alert alert-danger">{error || 'Asset not found'}</div>
  );

  const statusColor = { Available: 'success', Assigned: 'primary', Maintenance: 'warning', Retired: 'secondary' };

  const warrantyStatus = () => {
    if (!asset.warranty_date) return null;
    const d    = new Date(asset.warranty_date);
    const today = new Date();
    const diff  = (d - today) / (1000 * 60 * 60 * 24);
    if (diff < 0)   return <span className="badge bg-danger ms-2">Expired</span>;
    if (diff <= 90) return <span className="badge bg-warning text-dark ms-2">Expiring in {Math.ceil(diff)} days</span>;
    return <span className="badge bg-success ms-2">Valid</span>;
  };

  const Row = ({ label, value, mono }) => (
    <div className="col-md-4 mb-3">
      <div className="text-muted small fw-600 mb-1">{label}</div>
      <div className={mono ? 'font-monospace' : ''}>{value || <span className="text-muted">—</span>}</div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold mb-1">{asset.asset_name}</h2>
          <div className="d-flex align-items-center gap-2">
            <code className="text-muted">{asset.serial_number}</code>
            <span className={`badge bg-${statusColor[asset.status] || 'secondary'}`}>{asset.status}</span>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link to={`/assets/edit/${asset.id}`} className="btn btn-primary">
            <i className="bi bi-pencil me-2"></i>Edit
          </Link>
          <button className="btn btn-outline-secondary" onClick={() => navigate('/assets')}>
            <i className="bi bi-arrow-left me-2"></i>Back
          </button>
        </div>
      </div>

      {/* Employee Info */}
      <div className="table-card mb-3">
        <h6 className="fw-bold mb-3 text-primary">
          <i className="bi bi-person me-2"></i>Employee Information
        </h6>
        <div className="row">
          <Row label="EMP ID"         value={asset.emp_id}         mono />
          <Row label="Employee Name"  value={asset.employee_name}  />
          <Row label="Employee Email" value={asset.employee_email} />
          <Row label="Mobile Number"  value={asset.mobile_number}  />
        </div>
      </div>

      {/* Asset Details */}
      <div className="table-card mb-3">
        <h6 className="fw-bold mb-3 text-primary">
          <i className="bi bi-laptop me-2"></i>Asset Details
        </h6>
        <div className="row">
          <Row label="Asset Name"    value={asset.asset_name} />
          <Row label="Category"      value={asset.category} />
          <Row label="Serial Number" value={asset.serial_number} mono />
          <Row label="Model Name"    value={asset.model_name} />
          <Row label="OS"            value={asset.os} />
          <Row label="Version"       value={asset.version} />
          <Row label="RAM"           value={asset.ram} />
          <Row label="Location"      value={asset.location} />
          <Row label="Charger Serial Number" value={asset.charger_serial} mono />
        </div>
      </div>

      {/* Invoice & Warranty */}
      <div className="table-card mb-3">
        <h6 className="fw-bold mb-3 text-primary">
          <i className="bi bi-receipt me-2"></i>Invoice & Warranty
        </h6>
        <div className="row">
          <Row label="Invoice Number" value={asset.invoice_number} mono />
          <Row label="Invoice Date"   value={asset.invoice_date} />
          <div className="col-md-4 mb-3">
            <div className="text-muted small fw-600 mb-1">Warranty Date</div>
            <div>
              {asset.warranty_date || <span className="text-muted">—</span>}
              {warrantyStatus()}
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="table-card mb-3">
        <h6 className="fw-bold mb-3 text-primary">
          <i className="bi bi-clock-history me-2"></i>History
        </h6>
        <div className="row">
          <Row label="Old User"   value={asset.old_user} />
          <Row label="Old Device" value={asset.old_device} />
          <Row label="Date"       value={asset.date} />
          <div className="col-12 mb-3">
            <div className="text-muted small fw-600 mb-1">Comments</div>
            <div>{asset.comments || <span className="text-muted">—</span>}</div>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="table-card">
        <h6 className="fw-bold mb-3 text-primary">
          <i className="bi bi-info-circle me-2"></i>Record Info
        </h6>
        <div className="row">
          <Row label="Record ID"  value={`#${asset.id}`} />
          <Row label="Created At" value={asset.created_at ? new Date(asset.created_at).toLocaleString() : ''} />
          <Row label="Status"     value={asset.status} />
        </div>
      </div>
    </div>
  );
}

export default AssetView;
