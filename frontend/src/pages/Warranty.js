// Warranty.js – Warranty tracking page with expiry alerts
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assetAPI } from '../services/api';

function Warranty() {
  const [assets,  setAssets]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [days,    setDays]    = useState(90);

  useEffect(() => {
    setLoading(true);
    assetAPI.getExpiring(days)
      .then(res => setAssets(res.data.assets || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const daysLeft = (dateStr) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const urgencyBadge = (d) => {
    if (d < 0)   return <span className="badge bg-danger">Expired {Math.abs(d)}d ago</span>;
    if (d <= 30) return <span className="badge bg-danger">{d} days left</span>;
    if (d <= 60) return <span className="badge bg-warning text-dark">{d} days left</span>;
    return <span className="badge bg-info text-dark">{d} days left</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Warranty Tracking</h2>
          <p className="text-muted mb-0">Assets with warranty expiring soon</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0 text-muted small">Show expiring within:</label>
          <select
            className="form-select form-select-sm"
            style={{ width: 120 }}
            value={days}
            onChange={e => setDays(Number(e.target.value))}
          >
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
            <option value={365}>1 year</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Expiring ≤ 30 days', count: assets.filter(a => { const d = daysLeft(a.warranty_date); return d !== null && d <= 30; }).length, color: '#dc2626', bg: '#fee2e2' },
          { label: 'Expiring ≤ 60 days', count: assets.filter(a => { const d = daysLeft(a.warranty_date); return d !== null && d > 30 && d <= 60; }).length, color: '#d97706', bg: '#fef3c7' },
          { label: 'Expiring ≤ 90 days', count: assets.filter(a => { const d = daysLeft(a.warranty_date); return d !== null && d > 60 && d <= 90; }).length, color: '#2563eb', bg: '#dbeafe' },
          { label: `Total in ${days}d window`, count: assets.length, color: '#16a34a', bg: '#dcfce7' },
        ].map((s, i) => (
          <div className="col-md-3" key={i}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <i className="bi bi-shield-exclamation"></i>
              </div>
              <div className="stat-value">{s.count}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="table-card">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-shield-check fs-1 d-block mb-2 text-success"></i>
            No warranties expiring within {days} days
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Asset Name</th>
                  <th>Serial Number</th>
                  <th>Employee</th>
                  <th>EMP ID</th>
                  <th>Location</th>
                  <th>Warranty Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a, idx) => {
                  const d = daysLeft(a.warranty_date);
                  return (
                    <tr key={a.id} className={d !== null && d <= 30 ? 'warranty-expired' : 'warranty-expiring'}>
                      <td className="text-muted small">{idx + 1}</td>
                      <td className="fw-500">{a.asset_name}</td>
                      <td><code className="small">{a.serial_number}</code></td>
                      <td>{a.employee_name || '—'}</td>
                      <td><code className="small">{a.emp_id || '—'}</code></td>
                      <td className="small">{a.location || '—'}</td>
                      <td>
                        <div>{a.warranty_date}</div>
                        {d !== null && urgencyBadge(d)}
                      </td>
                      <td>
                        <span className={`badge bg-${
                          { Available: 'success', Assigned: 'primary', Maintenance: 'warning', Retired: 'secondary' }[a.status] || 'secondary'
                        }`}>{a.status}</span>
                      </td>
                      <td>
                        <Link to={`/assets/view/${a.id}`} className="btn btn-sm btn-outline-primary">
                          <i className="bi bi-eye"></i>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Warranty;
