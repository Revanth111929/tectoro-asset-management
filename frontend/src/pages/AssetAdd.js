// AssetAdd.js – Two tabs: New Device (inventory) | Existing Device (full form)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetAPI } from '../services/api';

const CATEGORIES = ['Laptop', 'Desktop', 'Monitor', 'Printer', 'Phone', 'Server', 'Furniture', 'Mouse', 'Headphones', 'Hard Disk', 'UPS', 'Laptop Bag', 'Other'];
const OS_LIST    = ['Windows 11', 'Windows 10', 'Ubuntu', 'macOS', 'Chrome OS', 'Other', 'N/A'];
const RAM_LIST   = ['4GB', '8GB', '16GB', '32GB', '64GB', 'N/A', 'Other'];
const STATUSES   = ['Available', 'Assigned', 'Maintenance', 'Retired'];

// ── NEW DEVICE FORM (inventory entry, no employee) ────────────────────────────
const EMPTY_NEW = {
  asset_name: '', category: '', serial_number: '', model_name: '',
  os: '', version: '', ram: '', location: '',
  invoice_number: '', invoice_date: '', warranty_date: '',
  purchase_price: '', quantity: '1', configuration: '',
  charger_serial: '', laptop_bag_serial: '', hard_disk_serial: '',
  hard_disk_capacity: '', ups_serial: '', ups_capacity: '',
  printer_type: '', printer_model: '',
  mobile_imei: '', mobile_number_sim: '',
  comments: '', status: 'Available',
};

// ── EXISTING DEVICE FORM (full form with employee) ────────────────────────────
const EMPTY_EXISTING = {
  emp_id: '', employee_name: '', mobile_number: '', employee_email: '',
  asset_name: '', category: '', serial_number: '', model_name: '',
  os: '', version: '', ram: '', location: '',
  invoice_number: '', invoice_date: '', warranty_date: '',
  charger_serial: '', old_user: '', date: '', old_device: '',
  comments: '', status: 'Assigned',
  purchase_price: '', configuration: '',
};

// ── Reusable Field wrapper ────────────────────────────────────────────────────
const F = ({ label, required, col = 'col-md-4', error, children }) => (
  <div className={col}>
    <label className="form-label fw-500">
      {label}{required && <span className="text-danger ms-1">*</span>}
    </label>
    {children}
    {error && <div className="text-danger small mt-1">{error}</div>}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// NEW DEVICE TAB
// ═══════════════════════════════════════════════════════════════════════════════
function NewDeviceForm({ navigate }) {
  const [form,     setForm]     = useState(EMPTY_NEW);
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');

  const set = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.asset_name.trim())    errs.asset_name    = 'Required';
    if (!form.serial_number.trim()) errs.serial_number = 'Required';
    if (!form.category)             errs.category      = 'Required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true); setApiError('');
    try {
      await assetAPI.create({ ...form, emp_id: '', employee_name: '', mobile_number: '' });
      navigate('/assets', { state: { success: 'New device added to inventory!' } });
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to save asset');
    } finally { setSaving(false); }
  };

  const inp = (name, placeholder, type = 'text') => (
    <input type={type} name={name} className={`form-control ${errors[name] ? 'is-invalid' : ''}`}
      value={form[name]} onChange={set} placeholder={placeholder} />
  );

  return (
    <form onSubmit={handleSubmit}>
      {apiError && <div className="alert alert-danger mb-3">{apiError}</div>}

      {/* ── Basic Info ── */}
      <div className="table-card mb-3">
        <h6 className="fw-bold mb-3" style={{ color: 'var(--primary)' }}>
          <i className="bi bi-box-seam me-2"></i>Asset Details
        </h6>
        <div className="row g-3">
          <F label="Asset Name" required col="col-md-6" error={errors.asset_name}>
            <input type="text" name="asset_name"
              className={`form-control ${errors.asset_name ? 'is-invalid' : ''}`}
              value={form.asset_name} onChange={set} placeholder="e.g. Dell Latitude 5540" />
          </F>
          <F label="Category" required col="col-md-3" error={errors.category}>
            <select name="category"
              className={`form-select ${errors.category ? 'is-invalid' : ''}`}
              value={form.category} onChange={set}>
              <option value="">Select…</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </F>
          <F label="Status" col="col-md-3">
            <select name="status" className="form-select" value={form.status} onChange={set}>
              <option value="Available">Available</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Retired">Retired</option>
            </select>
          </F>

          <F label="Serial Number" required col="col-md-4" error={errors.serial_number}>
            <input type="text" name="serial_number"
              className={`form-control ${errors.serial_number ? 'is-invalid' : ''}`}
              value={form.serial_number} onChange={set} placeholder="e.g. SN-DELL-001" />
          </F>
          <F label="Model Name" col="col-md-4">{inp('model_name', 'e.g. Latitude 5540')}</F>
          <F label="Location" col="col-md-4">{inp('location', 'e.g. Hyderabad Office')}</F>

          <F label="Operating System" col="col-md-3">
            <select name="os" className="form-select" value={form.os} onChange={set}>
              <option value="">Select…</option>
              {OS_LIST.map(o => <option key={o}>{o}</option>)}
            </select>
          </F>
          <F label="OS Version" col="col-md-3">{inp('version', 'e.g. 22H2')}</F>
          <F label="RAM" col="col-md-3">
            <select name="ram" className="form-select" value={form.ram} onChange={set}>
              <option value="">Select…</option>
              {RAM_LIST.map(r => <option key={r}>{r}</option>)}
            </select>
          </F>
          <F label="Quantity" col="col-md-3">
            <input type="number" name="quantity" className="form-control"
              value={form.quantity} onChange={set} min="1" />
          </F>
        </div>
      </div>

      {/* ── Purchase & Warranty ── */}
      <div className="table-card mb-3">
        <h6 className="fw-bold mb-3" style={{ color: 'var(--primary)' }}>
          <i className="bi bi-receipt me-2"></i>Purchase & Warranty
        </h6>
        <div className="row g-3">
          <F label="Invoice Number" col="col-md-3">{inp('invoice_number', 'INV-2024-001')}</F>
          <F label="Invoice Date" col="col-md-3">
            <input type="date" name="invoice_date" className="form-control"
              value={form.invoice_date} onChange={set} />
          </F>
          <F label="Warranty Expiry" col="col-md-3">
            <input type="date" name="warranty_date" className="form-control"
              value={form.warranty_date} onChange={set} />
          </F>
          <F label="Purchase Price (₹)" col="col-md-3">
            <input type="number" name="purchase_price" className="form-control"
              value={form.purchase_price} onChange={set} placeholder="0.00" step="0.01" />
          </F>
          <div className="col-12">
            <label className="form-label fw-500">Configuration / Specifications</label>
            <textarea name="configuration" className="form-control" rows={2}
              value={form.configuration} onChange={set}
              placeholder="e.g. Intel i7-12th Gen, 16GB RAM, 512GB SSD, NVIDIA GTX 1650" />
          </div>
        </div>
      </div>

      {/* ── Accessories ── */}
      <div className="table-card mb-3">
        <h6 className="fw-bold mb-3" style={{ color: 'var(--primary)' }}>
          <i className="bi bi-bag me-2"></i>Accessories & Peripherals
        </h6>
        <div className="row g-3">
          <F label="Charger Serial" col="col-md-4">{inp('charger_serial', 'CHG-001')}</F>
          <F label="Laptop Bag Serial" col="col-md-4">{inp('laptop_bag_serial', 'BAG-001')}</F>
          <div className="col-md-4"></div>

          <F label="Hard Disk Serial" col="col-md-4">{inp('hard_disk_serial', 'HDD-001')}</F>
          <F label="Hard Disk Capacity" col="col-md-4">{inp('hard_disk_capacity', 'e.g. 1TB, 2TB')}</F>
          <div className="col-md-4"></div>

          <F label="UPS Serial" col="col-md-4">{inp('ups_serial', 'UPS-001')}</F>
          <F label="UPS Capacity" col="col-md-4">{inp('ups_capacity', 'e.g. 1000VA')}</F>
          <div className="col-md-4"></div>

          <F label="Printer Type" col="col-md-4">
            <select name="printer_type" className="form-select" value={form.printer_type} onChange={set}>
              <option value="">N/A</option>
              <option>Inkjet</option><option>Laser</option>
              <option>Dot Matrix</option><option>Thermal</option>
            </select>
          </F>
          <F label="Printer Model" col="col-md-4">{inp('printer_model', 'e.g. HP LaserJet Pro')}</F>
          <div className="col-md-4"></div>

          <F label="Mobile IMEI" col="col-md-4">{inp('mobile_imei', 'IMEI number')}</F>
          <F label="SIM Number" col="col-md-4">{inp('mobile_number_sim', 'SIM number')}</F>
        </div>
      </div>

      {/* ── Notes ── */}
      <div className="table-card mb-3">
        <h6 className="fw-bold mb-3" style={{ color: 'var(--primary)' }}>
          <i className="bi bi-chat-left-text me-2"></i>Notes
        </h6>
        <textarea name="comments" className="form-control" rows={3}
          value={form.comments} onChange={set}
          placeholder="Any additional notes about this device…" />
      </div>

      <div className="alert d-flex gap-2 mb-4"
        style={{ background:'rgba(37,99,235,0.08)', border:'1px solid rgba(37,99,235,0.25)', borderRadius:'10px' }}>
        <i className="bi bi-info-circle-fill text-primary mt-1"></i>
        <div className="small">
          This device will be added to inventory as <strong>Available</strong>.
          Employee assignment can be done later by editing the asset.
        </div>
      </div>

      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-primary px-4" disabled={saving}>
          {saving
            ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>
            : <><i className="bi bi-plus-circle me-2"></i>Add to Inventory</>}
        </button>
        <button type="button" className="btn btn-outline-secondary px-4"
          onClick={() => navigate('/assets')}>Cancel</button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXISTING DEVICE TAB  (original full form — untouched)
// ═══════════════════════════════════════════════════════════════════════════════
function ExistingDeviceForm({ navigate }) {
  const [form,     setForm]     = useState(EMPTY_EXISTING);
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');

  const set = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.asset_name.trim())    errs.asset_name    = 'Asset name is required';
    if (!form.serial_number.trim()) errs.serial_number = 'Serial number is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true); setApiError('');
    try {
      await assetAPI.create(form);
      navigate('/assets', { state: { success: 'Asset added successfully!' } });
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to save asset');
    } finally { setSaving(false); }
  };

  const inp = (name, placeholder, type = 'text') => (
    <input type={type} name={name}
      className={`form-control ${errors[name] ? 'is-invalid' : ''}`}
      value={form[name]} onChange={set} placeholder={placeholder} />
  );

  return (
    <form onSubmit={handleSubmit}>
      {apiError && <div className="alert alert-danger mb-3">{apiError}</div>}

      {/* ── Employee Info ── */}
      <div className="table-card mb-3">
        <h6 className="fw-bold mb-3" style={{ color: 'var(--primary)' }}>
          <i className="bi bi-person me-2"></i>Employee Information
        </h6>
        <div className="row g-3">
          <F label="EMP ID" col="col-md-3">{inp('emp_id', 'e.g. TT001')}</F>
          <F label="Employee Name" col="col-md-3">{inp('employee_name', 'Full name')}</F>
          <F label="Employee Email" col="col-md-3">{inp('employee_email', 'email@company.com', 'email')}</F>
          <F label="Mobile Number" col="col-md-3">{inp('mobile_number', '+91 XXXXX XXXXX', 'tel')}</F>
        </div>
      </div>

      {/* ── Asset Info ── */}
      <div className="table-card mb-3">
        <h6 className="fw-bold mb-3" style={{ color: 'var(--primary)' }}>
          <i className="bi bi-laptop me-2"></i>Asset Details
        </h6>
        <div className="row g-3">
          <F label="Asset Name" required col="col-md-6" error={errors.asset_name}>
            <input type="text" name="asset_name"
              className={`form-control ${errors.asset_name ? 'is-invalid' : ''}`}
              value={form.asset_name} onChange={set} placeholder="e.g. Dell Laptop XPS 15" />
          </F>
          <F label="Category" col="col-md-3">
            <select name="category" className="form-select" value={form.category} onChange={set}>
              <option value="">Select…</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </F>
          <F label="Status" col="col-md-3">
            <select name="status" className="form-select" value={form.status} onChange={set}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </F>

          <F label="Serial Number" required col="col-md-4" error={errors.serial_number}>
            <input type="text" name="serial_number"
              className={`form-control ${errors.serial_number ? 'is-invalid' : ''}`}
              value={form.serial_number} onChange={set} placeholder="e.g. SN-DELL-001" />
          </F>
          <F label="Model Name" col="col-md-4">{inp('model_name', 'e.g. XPS 15 9520')}</F>
          <F label="Location" col="col-md-4">{inp('location', 'e.g. Hyderabad Office')}</F>

          <F label="OS" col="col-md-3">
            <select name="os" className="form-select" value={form.os} onChange={set}>
              <option value="">Select…</option>
              {OS_LIST.map(o => <option key={o}>{o}</option>)}
            </select>
          </F>
          <F label="OS Version" col="col-md-3">{inp('version', 'e.g. 22H2')}</F>
          <F label="RAM" col="col-md-3">
            <select name="ram" className="form-select" value={form.ram} onChange={set}>
              <option value="">Select…</option>
              {RAM_LIST.map(r => <option key={r}>{r}</option>)}
            </select>
          </F>
          <F label="Charger Serial" col="col-md-3">{inp('charger_serial', 'CHG-001')}</F>
        </div>
      </div>

      {/* ── Invoice & Warranty ── */}
      <div className="table-card mb-3">
        <h6 className="fw-bold mb-3" style={{ color: 'var(--primary)' }}>
          <i className="bi bi-receipt me-2"></i>Purchase & Warranty
        </h6>
        <div className="row g-3">
          <F label="Invoice Number" col="col-md-3">{inp('invoice_number', 'INV-2024-001')}</F>
          <F label="Invoice Date" col="col-md-3">
            <input type="date" name="invoice_date" className="form-control"
              value={form.invoice_date} onChange={set} />
          </F>
          <F label="Warranty Date" col="col-md-3">
            <input type="date" name="warranty_date" className="form-control"
              value={form.warranty_date} onChange={set} />
          </F>
          <F label="Purchase Price (₹)" col="col-md-3">
            <input type="number" name="purchase_price" className="form-control"
              value={form.purchase_price} onChange={set} placeholder="0.00" step="0.01" />
          </F>
          <div className="col-12">
            <label className="form-label fw-500">Configuration / Specifications</label>
            <textarea name="configuration" className="form-control" rows={2}
              value={form.configuration} onChange={set}
              placeholder="e.g. Intel i7, 16GB RAM, 512GB SSD" />
          </div>
        </div>
      </div>

      {/* ── History ── */}
      <div className="table-card mb-3">
        <h6 className="fw-bold mb-3" style={{ color: 'var(--primary)' }}>
          <i className="bi bi-clock-history me-2"></i>History
        </h6>
        <div className="row g-3">
          <F label="Old User" col="col-md-4">{inp('old_user', 'Previous user name')}</F>
          <F label="Old Device" col="col-md-4">{inp('old_device', 'Previous device serial')}</F>
          <F label="Date" col="col-md-4">
            <input type="date" name="date" className="form-control"
              value={form.date} onChange={set} />
          </F>
          <div className="col-12">
            <label className="form-label fw-500">Comments</label>
            <textarea name="comments" className="form-control" rows={3}
              value={form.comments} onChange={set}
              placeholder="Any additional notes…" />
          </div>
        </div>
      </div>

      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-primary px-4" disabled={saving}>
          {saving
            ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>
            : <><i className="bi bi-check-circle me-2"></i>Save Asset</>}
        </button>
        <button type="button" className="btn btn-outline-secondary px-4"
          onClick={() => navigate('/assets')}>Cancel</button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — Two Tabs
// ═══════════════════════════════════════════════════════════════════════════════
function AssetAdd() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('new');

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-outline-secondary btn-sm"
          onClick={() => navigate('/assets')}>
          <i className="bi bi-arrow-left me-1"></i>Back
        </button>
        <div>
          <h2 className="fw-bold mb-0">Add Asset</h2>
          <p className="text-muted mb-0 small">Choose the type of entry below</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4">
        <button
          className={`btn px-4 ${tab === 'new' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setTab('new')}
        >
          <i className="bi bi-box-seam me-2"></i>
          New Device
          <span className="ms-2 badge bg-success" style={{ fontSize: '10px' }}>Inventory</span>
        </button>
        <button
          className={`btn px-4 ${tab === 'existing' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setTab('existing')}
        >
          <i className="bi bi-recycle me-2"></i>
          Existing / Old Device
          <span className="ms-2 badge bg-warning text-dark" style={{ fontSize: '10px' }}>With User</span>
        </button>
      </div>

      {/* Tab description */}
      {tab === 'new' ? (
        <div className="alert d-flex gap-2 mb-4"
          style={{ background:'rgba(22,163,74,0.08)', border:'1px solid rgba(22,163,74,0.25)', borderRadius:'10px' }}>
          <i className="bi bi-box-seam text-success mt-1"></i>
          <div className="small">
            <strong>New Device</strong> — Use this for newly purchased items.
            Enter asset, purchase, warranty and accessory details.
            No employee assignment needed — device goes to inventory as <strong>Available</strong>.
          </div>
        </div>
      ) : (
        <div className="alert d-flex gap-2 mb-4"
          style={{ background:'rgba(217,119,6,0.08)', border:'1px solid rgba(217,119,6,0.25)', borderRadius:'10px' }}>
          <i className="bi bi-recycle text-warning mt-1"></i>
          <div className="small">
            <strong>Existing / Old Device</strong> — Use this for devices already in use or being transferred.
            Enter asset details along with current employee assignment and history.
          </div>
        </div>
      )}

      {/* Render active tab form */}
      {tab === 'new'
        ? <NewDeviceForm navigate={navigate} />
        : <ExistingDeviceForm navigate={navigate} />
      }
    </div>
  );
}

export default AssetAdd;
