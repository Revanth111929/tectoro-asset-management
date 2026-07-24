// frontend/src/pages/EmailConfig.js
// Admin page to configure SMTP email settings and test the connection.

import React, { useState, useEffect } from 'react';
import { emailConfigAPI } from '../services/api';

const PRESETS = {
  outlook: { smtp_server: 'smtp.office365.com', smtp_port: 587, use_tls: true,  label: 'Outlook / Microsoft 365' },
  gmail:   { smtp_server: 'smtp.gmail.com',      smtp_port: 587, use_tls: true,  label: 'Gmail'                   },
  yahoo:   { smtp_server: 'smtp.mail.yahoo.com', smtp_port: 587, use_tls: true,  label: 'Yahoo Mail'              },
  custom:  { smtp_server: '',                    smtp_port: 587, use_tls: true,  label: 'Custom SMTP'             },
};

const STATUS_BADGE = {
  'Not Sent':     { bg: '#f1f5f9', color: '#64748b', label: 'Not Sent'     },
  'Pending':      { bg: '#fef9c3', color: '#a16207', label: 'Pending'      },
  'Acknowledged': { bg: '#dcfce7', color: '#166534', label: 'Acknowledged' },
};

export default function EmailConfig() {
  const [config, setConfig]           = useState(null);
  const [configured, setConfigured]   = useState(false);
  const [editing, setEditing]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [testing, setTesting]         = useState(false);
  const [saveMsg, setSaveMsg]         = useState('');
  const [testMsg, setTestMsg]         = useState('');
  const [testEmail, setTestEmail]     = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [preset, setPreset]           = useState('outlook');

  const [form, setForm] = useState({
    sender_email:  '',
    sender_name:   'IT Asset Management',
    smtp_server:   'smtp.office365.com',
    smtp_port:     587,
    smtp_username: '',
    smtp_password: '',
    use_tls:       true,
  });

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = () => {
    emailConfigAPI.get()
      .then(res => {
        if (res.data.configured) {
          setConfigured(true);
          setConfig(res.data.config);
          setForm(f => ({ ...f, ...res.data.config, smtp_password: '' }));
        } else {
          setConfigured(false);
          setEditing(true);
        }
      })
      .catch(() => setEditing(true));
  };

  const applyPreset = (key) => {
    setPreset(key);
    const p = PRESETS[key];
    setForm(f => ({ ...f, smtp_server: p.smtp_server, smtp_port: p.smtp_port, use_tls: p.use_tls }));
  };

  const handleSave = async () => {
    setSaving(true); setSaveMsg('');
    try {
      const res = await emailConfigAPI.save(form);
      if (res.data.success) {
        setSaveMsg('✅ Email configuration saved successfully!');
        setEditing(false);
        fetchConfig();
      } else {
        setSaveMsg('❌ ' + res.data.error);
      }
    } catch (e) {
      setSaveMsg('❌ ' + (e.response?.data?.error || 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) { setTestMsg('❌ Enter a recipient email for testing'); return; }
    setTesting(true); setTestMsg('');
    try {
      // Only send recipient — backend uses saved password
      const res = await emailConfigAPI.test({ test_recipient: testEmail });
      if (res.data.success) {
        setTestMsg('✅ ' + res.data.message);
      } else {
        setTestMsg('❌ ' + res.data.error);
      }
    } catch (e) {
      setTestMsg('❌ ' + (e.response?.data?.error || 'Test failed'));
    } finally {
      setTesting(false);
    }
  };

  const inp = (field, type = 'text', extra = {}) => (
    <input
      type={type}
      className="form-control"
      value={form[field] ?? ''}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      {...extra}
    />
  );

  return (
    <div className="container-fluid py-4" style={{ maxWidth: 760 }}>
      {/* Page header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="mb-1 fw-bold">📧 Email Configuration</h4>
          <p className="text-muted mb-0">Configure SMTP settings for asset acknowledgment emails</p>
        </div>
        {configured && !editing && (
          <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>
            ✏️ Edit Configuration
          </button>
        )}
      </div>

      {/* Current config summary (read-only) */}
      {configured && !editing && config && (
        <div className="card mb-4 border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center mb-3">
              <span className="badge bg-success me-2">● Active</span>
              <span className="text-muted small">
                Last tested: {config.last_tested_at
                  ? new Date(config.last_tested_at).toLocaleString()
                  : 'Never'}
                {config.last_test_status === 'success' && ' ✅'}
                {config.last_test_status === 'failed'  && ' ❌'}
              </span>
            </div>
            <div className="row g-3">
              {[
                ['Sender Email',    config.sender_email],
                ['Sender Name',     config.sender_name],
                ['SMTP Server',     config.smtp_server],
                ['SMTP Port',       config.smtp_port],
                ['SMTP Username',   config.smtp_username],
                ['TLS',             config.use_tls ? 'Enabled' : 'Disabled'],
              ].map(([label, val]) => (
                <div className="col-md-6" key={label}>
                  <div className="p-3 rounded" style={{ background: '#f8fafc' }}>
                    <div className="text-muted small mb-1">{label}</div>
                    <div className="fw-semibold">{val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white border-bottom py-3">
            <h6 className="mb-0 fw-semibold">SMTP Configuration</h6>
          </div>
          <div className="card-body p-4">

            {/* Provider presets */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Email Provider</label>
              <div className="d-flex flex-wrap gap-2">
                {Object.entries(PRESETS).map(([key, p]) => (
                  <button
                    key={key}
                    className={`btn btn-sm ${preset === key ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => applyPreset(key)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {preset === 'outlook' && (
                <div className="alert alert-info mt-2 py-2 small mb-0">
                  💡 For Microsoft 365: use your full email as username and an
                  <a href="https://support.microsoft.com/en-us/account-billing/using-app-passwords-with-apps-that-don-t-support-two-step-verification-5896ed9b-4263-e681-128a-a6f2979a7944"
                     target="_blank" rel="noreferrer"> app password</a> if MFA is enabled.
                </div>
              )}
              {preset === 'gmail' && (
                <div className="alert alert-info mt-2 py-2 small mb-0">
                  💡 For Gmail: enable 2FA and use an
                  <a href="https://support.google.com/accounts/answer/185833"
                     target="_blank" rel="noreferrer"> App Password</a> instead of your account password.
                </div>
              )}
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Sender Email <span className="text-danger">*</span></label>
                {inp('sender_email', 'email', { placeholder: 'it@company.com' })}
              </div>
              <div className="col-md-6">
                <label className="form-label">Sender Display Name <span className="text-danger">*</span></label>
                {inp('sender_name', 'text', { placeholder: 'IT Asset Management' })}
              </div>
              <div className="col-md-8">
                <label className="form-label">SMTP Server <span className="text-danger">*</span></label>
                {inp('smtp_server', 'text', { placeholder: 'smtp.office365.com' })}
              </div>
              <div className="col-md-4">
                <label className="form-label">SMTP Port <span className="text-danger">*</span></label>
                {inp('smtp_port', 'number', { placeholder: '587' })}
              </div>
              <div className="col-md-6">
                <label className="form-label">SMTP Username <span className="text-danger">*</span></label>
                {inp('smtp_username', 'email', { placeholder: 'it@company.com' })}
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  SMTP Password <span className="text-danger">*</span>
                  <span className="text-muted small ms-1">
                    {configured ? '(leave blank to keep existing)' : ''}
                  </span>
                </label>
                <div className="input-group">
                  <input
                    type={showPass && form.smtp_password ? 'text' : 'password'}
                    className="form-control"
                    value={form.smtp_password}
                    onChange={e => setForm(f => ({ ...f, smtp_password: e.target.value }))}
                    placeholder=""
                    autoComplete="new-password"
                  />
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => { if (form.smtp_password) setShowPass(!showPass); }}
                    tabIndex={-1}
                    style={{ cursor: form.smtp_password ? 'pointer' : 'default', opacity: form.smtp_password ? 1 : 0.4 }}
                    title={showPass ? "Hide password" : "Show password"}
                  >
                    <i className={`bi ${showPass && form.smtp_password ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>
              <div className="col-12">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="useTls"
                    checked={form.use_tls}
                    onChange={e => setForm(f => ({ ...f, use_tls: e.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="useTls">
                    Use STARTTLS (recommended)
                  </label>
                </div>
              </div>
            </div>

            {saveMsg && (
              <div className={`alert mt-3 py-2 small ${saveMsg.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>
                {saveMsg}
              </div>
            )}

            <div className="d-flex gap-2 mt-4">
              <button className="btn btn-primary px-4" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Saving…' : '💾 Save Configuration'}
              </button>
              {configured && (
                <button className="btn btn-outline-secondary" onClick={() => { setEditing(false); setSaveMsg(''); }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Test connection panel */}
      {(configured || editing) && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-bottom py-3">
            <h6 className="mb-0 fw-semibold">🧪 Test Email Connection</h6>
          </div>
          <div className="card-body p-4">
            <p className="text-muted small mb-3">
              Send a test email to verify your SMTP settings are working correctly.
            </p>
            <div className="d-flex gap-2 align-items-end">
              <div style={{ flex: 1 }}>
                <label className="form-label">Send test email to</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                />
              </div>
              <button className="btn btn-outline-primary px-4" onClick={handleTest} disabled={testing}>
                {testing ? '⏳ Sending…' : '📤 Send Test'}
              </button>
            </div>
            {testMsg && (
              <div className={`alert mt-3 py-2 small ${testMsg.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>
                {testMsg}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
