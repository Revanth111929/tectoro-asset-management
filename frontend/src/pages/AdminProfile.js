// AdminProfile.js — Admin enters details once, stored permanently
import React, { useState, useEffect } from 'react';
import { adminProfileAPI } from '../services/api';

export default function AdminProfile() {
  const [form,    setForm]    = useState({ name:'', email:'', phone:'', department:'', designation:'' });
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    adminProfileAPI.get().then(res => {
      if (res.data.configured) {
        setForm(res.data.profile);
        setConfigured(true);
      }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      await adminProfileAPI.save(form);
      setMsg('✅ Profile saved successfully!');
      setConfigured(true);
    } catch (e) {
      setMsg('❌ ' + (e.response?.data?.error || 'Save failed'));
    } finally { setSaving(false); }
  };

  const inp = (field, placeholder, type='text') => (
    <input type={type} className="form-control"
      value={form[field] || ''}
      onChange={e => setForm(f => ({...f, [field]: e.target.value}))}
      placeholder={placeholder} />
  );

  return (
    <div className="container-fluid py-4" style={{ maxWidth: 680 }}>
      <div className="mb-4">
        <h4 className="fw-bold mb-1">👤 Admin Profile</h4>
        <p className="text-muted mb-0">Enter your details once — used automatically in all assignment emails</p>
      </div>

      {configured && (
        <div className="alert alert-success py-2 small mb-3">
          ✅ Profile configured — your details are saved and will be used in all acknowledgment emails
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Full Name</label>
              {inp('name', 'e.g. Revanth Maddela')}
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Email Address</label>
              {inp('email', 'admin@company.com', 'email')}
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Phone Number</label>
              {inp('phone', '+91 9999999999', 'tel')}
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Designation</label>
              {inp('designation', 'e.g. IT Manager')}
            </div>
            <div className="col-md-12">
              <label className="form-label fw-semibold">Department</label>
              {inp('department', 'e.g. Information Technology')}
            </div>
          </div>

          {msg && (
            <div className={`alert mt-3 py-2 small ${msg.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>
              {msg}
            </div>
          )}

          <button className="btn btn-primary mt-4 px-4" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Saving…' : '💾 Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
