// AssetEdit.js – Edit existing asset, pre-populated with all 20 fields
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assetAPI } from '../services/api';

const CATEGORIES = ['Laptop', 'Desktop', 'Monitor', 'Printer', 'Phone', 'Server', 'Furniture', 'Other'];
const OS_LIST    = ['Windows 11', 'Windows 10', 'Ubuntu', 'macOS', 'Chrome OS', 'Other'];
const RAM_LIST   = ['4GB', '8GB', '16GB', '32GB', '64GB', 'Other'];
const STATUSES   = ['Available', 'Assigned', 'Maintenance', 'Retired'];

function AssetEdit() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [form,     setForm]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');

  useEffect(() => {
    assetAPI.getById(id)
      .then(res => setForm(res.data))
      .catch(() => setApiError('Asset not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'employee_email') setRecipientEmail(value);
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.asset_name?.trim())   errs.asset_name   = 'Asset name is required';
    if (!form.serial_number?.trim()) errs.serial_number = 'Serial number is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setApiError('');
    try {
      await assetAPI.update(id, form);
      navigate('/assets', { state: { success: 'Asset updated successfully!' } });
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to update asset');
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!recipientEmail) { setEmailMsg('error:Please enter recipient email'); return; }
    setSendingEmail(true); setEmailMsg('');
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/assets/${id}/send-assignment-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ recipient_email: recipientEmail, sender_user_id: user.id })
      });
      const data = await res.json();
      if (res.ok) setEmailMsg('success:' + data.message);
      else setEmailMsg('error:' + (data.error || 'Failed to send email'));
    } catch (e) {
      setEmailMsg('error:Cannot connect to server');
    } finally { setSendingEmail(false); }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  );

  if (!form) return <div className="alert alert-danger">{apiError || 'Asset not found'}</div>;

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Edit Asset</h2>
        <p className="text-muted mb-0">
          Editing: <strong>{form.asset_name}</strong> &nbsp;|&nbsp;
          <code>{form.serial_number}</code>
        </p>
      </div>

      {apiError && <div className="alert alert-danger mb-3">{apiError}</div>}

      <form onSubmit={handleSubmit}>
        {/* ── Employee Info ─────────────────────────────────────────────── */}
        <div className="table-card mb-3">
          <h6 className="fw-bold mb-3 text-primary">
            <i className="bi bi-person me-2"></i>Employee Information
          </h6>
          <div className="row g-3">
            {[
              { label: 'EMP ID',         name: 'emp_id' },
              { label: 'Employee Name',  name: 'employee_name' },
              { label: 'Mobile Number',  name: 'mobile_number', type: 'tel' },
              { label: 'Employee Email', name: 'employee_email', type: 'email' },
            ].map(f => (
              <div className="col-md-4" key={f.name}>
                <label className="form-label">{f.label}</label>
                <input
                  type={f.type || 'text'}
                  name={f.name}
                  className="form-control"
                  value={form[f.name] || ''}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Asset Details ─────────────────────────────────────────────── */}
        <div className="table-card mb-3">
          <h6 className="fw-bold mb-3 text-primary">
            <i className="bi bi-laptop me-2"></i>Asset Details
          </h6>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Asset Name <span className="text-danger">*</span></label>
              <input
                type="text"
                name="asset_name"
                className={`form-control ${errors.asset_name ? 'is-invalid' : ''}`}
                value={form.asset_name || ''}
                onChange={handleChange}
              />
              {errors.asset_name && <div className="invalid-feedback">{errors.asset_name}</div>}
            </div>

            <div className="col-md-3">
              <label className="form-label">Category</label>
              <select name="category" className="form-select" value={form.category || ''} onChange={handleChange}>
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select name="status" className="form-select" value={form.status || 'Available'} onChange={handleChange}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Serial Number <span className="text-danger">*</span></label>
              <input
                type="text"
                name="serial_number"
                className={`form-control ${errors.serial_number ? 'is-invalid' : ''}`}
                value={form.serial_number || ''}
                onChange={handleChange}
              />
              {errors.serial_number && <div className="invalid-feedback">{errors.serial_number}</div>}
            </div>

            <div className="col-md-4">
              <label className="form-label">Model Name</label>
              <input type="text" name="model_name" className="form-control" value={form.model_name || ''} onChange={handleChange} />
            </div>

            <div className="col-md-4">
              <label className="form-label">Location</label>
              <input type="text" name="location" className="form-control" value={form.location || ''} onChange={handleChange} />
            </div>

            <div className="col-md-3">
              <label className="form-label">OS</label>
              <select name="os" className="form-select" value={form.os || ''} onChange={handleChange}>
                <option value="">Select…</option>
                {OS_LIST.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">OS Version</label>
              <input type="text" name="version" className="form-control" value={form.version || ''} onChange={handleChange} />
            </div>

            <div className="col-md-3">
              <label className="form-label">RAM</label>
              <select name="ram" className="form-select" value={form.ram || ''} onChange={handleChange}>
                <option value="">Select…</option>
                {RAM_LIST.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Charger Serial Number</label>
              <input type="text" name="charger_serial" className="form-control" value={form.charger_serial || ''} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* ── Invoice & Warranty ────────────────────────────────────────── */}
        <div className="table-card mb-3">
          <h6 className="fw-bold mb-3 text-primary">
            <i className="bi bi-receipt me-2"></i>Invoice & Warranty
          </h6>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Invoice Number</label>
              <input type="text" name="invoice_number" className="form-control" value={form.invoice_number || ''} onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Invoice Date</label>
              <input type="date" name="invoice_date" className="form-control" value={form.invoice_date || ''} onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Warranty Date</label>
              <input type="date" name="warranty_date" className="form-control" value={form.warranty_date || ''} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* ── History ───────────────────────────────────────────────────── */}
        <div className="table-card mb-3">
          <h6 className="fw-bold mb-3 text-primary">
            <i className="bi bi-clock-history me-2"></i>History
          </h6>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Old User</label>
              <input type="text" name="old_user" className="form-control" value={form.old_user || ''} onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Old Device</label>
              <input type="text" name="old_device" className="form-control" value={form.old_device || ''} onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Date</label>
              <input type="date" name="date" className="form-control" value={form.date || ''} onChange={handleChange} />
            </div>
            <div className="col-12">
              <label className="form-label">Comments</label>
              <textarea name="comments" className="form-control" rows={3} value={form.comments || ''} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving
              ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>
              : <><i className="bi bi-check-circle me-2"></i>Update Asset</>
            }
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/assets')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AssetEdit;
