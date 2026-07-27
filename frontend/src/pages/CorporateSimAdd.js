// CorporateSimAdd.js – Add new Corporate SIM
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { corporateSimAPI } from '../services/api';

const CARRIERS = ['Airtel', 'Jio', 'Vi (Vodafone Idea)', 'BSNL', 'Other'];
const PLAN_TYPES = ['Prepaid', 'Postpaid'];
const SIM_TYPES = ['Nano', 'Micro', 'Mini', 'eSIM'];
const STATUSES = ['Available', 'Active', 'Suspended'];

function CorporateSimAdd() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [form, setForm] = useState({
    iccid: '',
    mobile_number: '',
    carrier: 'Airtel',
    plan_type: 'Postpaid',
    monthly_cost: '',
    data_limit_gb: '',
    corporate_account: '',
    account_manager: '',
    status: 'Available',
    purchase_date: '',
    activation_date: '',
    vendor: '',
    sim_type: 'Nano',
    puk_code: '',
    remarks: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    
    // ICCID validation
    if (!form.iccid.trim()) {
      errs.iccid = 'ICCID is required';
    } else if (!/^\d{19,20}$/.test(form.iccid.trim())) {
      errs.iccid = 'ICCID must be 19-20 digits';
    }
    
    // Mobile number validation (optional but must be valid if provided)
    if (form.mobile_number.trim()) {
      if (!/^\d{10}$/.test(form.mobile_number.trim())) {
        errs.mobile_number = 'Mobile number must be exactly 10 digits';
      }
    }
    
    // Carrier required
    if (!form.carrier) {
      errs.carrier = 'Carrier is required';
    }
    
    // PUK code validation (optional but must be 8 digits if provided)
    if (form.puk_code.trim() && !/^\d{8}$/.test(form.puk_code.trim())) {
      errs.puk_code = 'PUK code must be exactly 8 digits';
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setSubmitting(true);
    try {
      await corporateSimAPI.create(form);
      navigate('/corporate-sims');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create SIM');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="d-flex align-items-center mb-4">
            <button className="btn btn-outline-secondary me-3" onClick={() => navigate('/corporate-sims')}>
              <i className="bi bi-arrow-left"></i>
            </button>
            <div>
              <h2 className="mb-0">
                <i className="bi bi-sim me-2"></i>Add Corporate SIM
              </h2>
              <p className="text-muted mb-0">Add a new SIM card to inventory</p>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* SIM Identification */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h5 className="border-bottom pb-2 mb-3">
                      <i className="bi bi-card-text me-2"></i>SIM Identification
                    </h5>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">ICCID *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.iccid ? 'is-invalid' : ''}`}
                      name="iccid"
                      value={form.iccid}
                      onChange={handleChange}
                      placeholder="e.g., 8991012345678901234"
                      maxLength="20"
                    />
                    <div className="form-text">19-20 digit SIM card identification number</div>
                    {errors.iccid && <div className="invalid-feedback">{errors.iccid}</div>}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Mobile Number</label>
                    <input
                      type="text"
                      className={`form-control ${errors.mobile_number ? 'is-invalid' : ''}`}
                      name="mobile_number"
                      value={form.mobile_number}
                      onChange={handleChange}
                      placeholder="e.g., 9876543210"
                      maxLength="10"
                    />
                    <div className="form-text">10 digit mobile number (optional)</div>
                    {errors.mobile_number && <div className="invalid-feedback">{errors.mobile_number}</div>}
                  </div>
                </div>

                {/* Carrier Information */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h5 className="border-bottom pb-2 mb-3">
                      <i className="bi bi-tower me-2"></i>Carrier Information
                    </h5>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold">Carrier / Operator *</label>
                    <select className={`form-select ${errors.carrier ? 'is-invalid' : ''}`} name="carrier" value={form.carrier} onChange={handleChange}>
                      {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.carrier && <div className="invalid-feedback">{errors.carrier}</div>}
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold">Plan Type</label>
                    <select className="form-select" name="plan_type" value={form.plan_type} onChange={handleChange}>
                      {PLAN_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold">SIM Type</label>
                    <select className="form-select" name="sim_type" value={form.sim_type} onChange={handleChange}>
                      {SIM_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold">Monthly Cost (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="monthly_cost"
                      value={form.monthly_cost}
                      onChange={handleChange}
                      placeholder="e.g., 599"
                      step="0.01"
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold">Data Limit (GB)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="data_limit_gb"
                      value={form.data_limit_gb}
                      onChange={handleChange}
                      placeholder="e.g., 50"
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold">Status</label>
                    <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Corporate Account */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h5 className="border-bottom pb-2 mb-3">
                      <i className="bi bi-building me-2"></i>Corporate Account
                    </h5>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Corporate Account</label>
                    <input
                      type="text"
                      className="form-control"
                      name="corporate_account"
                      value={form.corporate_account}
                      onChange={handleChange}
                      placeholder="e.g., CORP-ACC-001"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Account Manager</label>
                    <input
                      type="text"
                      className="form-control"
                      name="account_manager"
                      value={form.account_manager}
                      onChange={handleChange}
                      placeholder="e.g., Ravi Kumar"
                    />
                  </div>
                </div>

                {/* Purchase Details */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h5 className="border-bottom pb-2 mb-3">
                      <i className="bi bi-cart me-2"></i>Purchase & Activation
                    </h5>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold">Vendor</label>
                    <input
                      type="text"
                      className="form-control"
                      name="vendor"
                      value={form.vendor}
                      onChange={handleChange}
                      placeholder="e.g., Airtel Corporate Solutions"
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold">Purchase Date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="purchase_date"
                      value={form.purchase_date}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold">Activation Date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="activation_date"
                      value={form.activation_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Additional Details */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h5 className="border-bottom pb-2 mb-3">
                      <i className="bi bi-info-circle me-2"></i>Additional Details
                    </h5>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">PUK Code</label>
                    <input
                      type="text"
                      className={`form-control ${errors.puk_code ? 'is-invalid' : ''}`}
                      name="puk_code"
                      value={form.puk_code}
                      onChange={handleChange}
                      placeholder="8 digits (optional)"
                      maxLength="8"
                    />
                    <div className="form-text">8 digit PIN Unlock Key (keep secure)</div>
                    {errors.puk_code && <div className="invalid-feedback">{errors.puk_code}</div>}
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label fw-semibold">Remarks / Notes</label>
                    <textarea
                      className="form-control"
                      name="remarks"
                      value={form.remarks}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Any additional notes about this SIM..."
                    ></textarea>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/corporate-sims')}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Save SIM
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CorporateSimAdd;
