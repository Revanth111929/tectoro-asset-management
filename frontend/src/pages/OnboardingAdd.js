// OnboardingAdd.js – Create / Edit onboarding record with asset picker + app access
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { onboardingAPI } from '../services/api';

const TEAMS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Support', 'Design', 'Other'];
const APPLICATIONS = ['Email', 'HRMS', 'Asset Management', 'Jira', 'GitHub', 'Slack', 'Microsoft Teams', 'VPN', 'Other Applications'];

const EMPTY = {
  name: '', email: '', phone_number: '', designation: '', team: '',
  application_access: [], status: 'Pending',
};

// Field component - moved outside to prevent recreation
const Field = React.memo(({ label, name, type = 'text', required, col = 'col-md-6', value, onChange, error }) => (
  <div className={col}>
    <label className="form-label">
      {label}{required && <span className="text-danger ms-1">*</span>}
    </label>
    <input
      type={type}
      name={name}
      className={`form-control ${error ? 'is-invalid' : ''}`}
      value={value}
      onChange={onChange}
      autoComplete="off"
    />
    {error && <div className="invalid-feedback">{error}</div>}
  </div>
));

function OnboardingAdd() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(isEdit);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');

  // Asset picker state
  const [assetSearch, setAssetSearch] = useState('');
  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]); // [{id, asset_name, serial_number, category}]
  const [searchingAssets, setSearchingAssets] = useState(false);

  // Load existing record when editing
  useEffect(() => {
    if (!isEdit) return;
    onboardingAPI.getById(id)
      .then(res => {
        const r = res.data.onboarding;
        setForm({
          name: r.name, email: r.email, phone_number: r.phone_number,
          designation: r.designation, team: r.team,
          application_access: r.application_access || [],
          status: r.status,
        });
        setSelectedAssets((r.assets_assigned || []).map(a => ({
          id: a.asset_id, asset_name: a.asset_name, serial_number: a.asset_serial, category: a.asset_category,
        })));
      })
      .catch(() => setApiError('Failed to load onboarding record'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(er => {
      if (er[name]) {
        const { [name]: removed, ...rest } = er;
        return rest;
      }
      return er;
    });
  }, []);

  const toggleAppAccess = useCallback((app) => {
    setForm(f => ({
      ...f,
      application_access: f.application_access.includes(app)
        ? f.application_access.filter(a => a !== app)
        : [...f.application_access, app],
    }));
  }, []);

  // Search available (real) assets for the picker
  const searchAssets = useCallback((q) => {
    setSearchingAssets(true);
    onboardingAPI.getAvailableAssets({ search: q })
      .then(res => setAvailableAssets(res.data.assets || []))
      .catch(() => setAvailableAssets([]))
      .finally(() => setSearchingAssets(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchAssets(assetSearch), 300);
    return () => clearTimeout(t);
  }, [assetSearch, searchAssets]);

  const addAsset = useCallback((asset) => {
    if (selectedAssets.some(a => a.id === asset.id)) return;
    setSelectedAssets(prev => [...prev, asset]);
  }, [selectedAssets]);

  const removeAsset = useCallback((assetId) => {
    setSelectedAssets(prev => prev.filter(a => a.id !== assetId));
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim())         errs.name = 'Name is required';
    if (!form.email.trim())        errs.email = 'Email is required';
    if (!form.phone_number.trim()) errs.phone_number = 'Phone number is required';
    if (!form.designation.trim())  errs.designation = 'Designation is required';
    if (!form.team.trim())         errs.team = 'Team is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setApiError('');
    const payload = { ...form, asset_ids: selectedAssets.map(a => a.id) };

    try {
      if (isEdit) {
        await onboardingAPI.update(id, payload);
      } else {
        await onboardingAPI.create(payload);
      }
      navigate('/onboarding', { state: { success: `Onboarding record ${isEdit ? 'updated' : 'created'} successfully!` } });
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      setApiError(data?.error || 'Failed to save onboarding record');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }



  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">{isEdit ? 'Edit Onboarding Record' : 'New Employee Onboarding'}</h2>
        <p className="text-muted mb-0">Fill in details for the new employee</p>
      </div>

      {apiError && <div className="alert alert-danger mb-3">{apiError}</div>}

      <form onSubmit={handleSubmit}>
        {/* ── Basic Info ─────────────────────────────────────────────────── */}
        <div className="table-card mb-3">
          <h6 className="fw-bold mb-3 text-primary">
            <i className="bi bi-person me-2"></i>Employee Information
          </h6>
          <div className="row g-3">
            <Field label="Full Name" name="name" required value={form.name} onChange={handleChange} error={errors.name} />
            <Field label="Email" name="email" type="email" required value={form.email} onChange={handleChange} error={errors.email} />
            <Field label="Phone Number" name="phone_number" type="tel" required value={form.phone_number} onChange={handleChange} error={errors.phone_number} />
            <Field label="Designation" name="designation" required value={form.designation} onChange={handleChange} error={errors.designation} />
            <div className="col-md-6">
              <label className="form-label">Team<span className="text-danger ms-1">*</span></label>
              <select
                name="team"
                className={`form-select ${errors.team ? 'is-invalid' : ''}`}
                value={form.team}
                onChange={handleChange}
              >
                <option value="">Select…</option>
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.team && <div className="invalid-feedback">{errors.team}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Status</label>
              <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Assets Assigned ────────────────────────────────────────────── */}
        <div className="table-card mb-3">
          <h6 className="fw-bold mb-3 text-primary">
            <i className="bi bi-laptop me-2"></i>Assets Assigned
            <span className="text-muted small fw-normal ms-2">(optional — choose from available inventory)</span>
          </h6>

          <div className="input-group mb-3">
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search available assets by name or serial number…"
              value={assetSearch}
              onChange={e => setAssetSearch(e.target.value)}
            />
          </div>

          {searchingAssets ? (
            <div className="text-center py-3"><span className="spinner-border spinner-border-sm text-primary"></span></div>
          ) : availableAssets.length > 0 && (
            <div className="border rounded mb-3" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {availableAssets.map(a => (
                <div
                  key={a.id}
                  className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom"
                  style={{ cursor: 'pointer' }}
                  onClick={() => addAsset(a)}
                >
                  <div>
                    <span className="fw-500">{a.asset_name}</span>{' '}
                    <code className="small text-muted">{a.serial_number}</code>{' '}
                    <span className="badge bg-light text-dark border">{a.category}</span>
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-primary">
                    <i className="bi bi-plus"></i> Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedAssets.length > 0 && (
            <div>
              <label className="form-label small text-muted">Selected assets:</label>
              <div className="d-flex flex-wrap gap-2">
                {selectedAssets.map(a => (
                  <span key={a.id} className="badge bg-primary d-flex align-items-center gap-2" style={{ fontSize: '13px', padding: '6px 10px' }}>
                    {a.asset_name} ({a.serial_number})
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      style={{ fontSize: '10px' }}
                      onClick={() => removeAsset(a.id)}
                    ></button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Application Access ─────────────────────────────────────────── */}
        <div className="table-card mb-3">
          <h6 className="fw-bold mb-3 text-primary">
            <i className="bi bi-shield-lock me-2"></i>Application Access
            <span className="text-muted small fw-normal ms-2">(optional — select all that apply)</span>
          </h6>
          <div className="row g-2">
            {APPLICATIONS.map(app => (
              <div className="col-md-3" key={app}>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`app-${app}`}
                    checked={form.application_access.includes(app)}
                    onChange={() => toggleAppAccess(app)}
                  />
                  <label className="form-check-label" htmlFor={`app-${app}`}>{app}</label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving
              ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>
              : <><i className="bi bi-check-circle me-2"></i>{isEdit ? 'Update Record' : 'Create Onboarding Record'}</>}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/onboarding')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default OnboardingAdd;
