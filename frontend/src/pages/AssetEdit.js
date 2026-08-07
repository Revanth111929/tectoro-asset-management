// AssetEdit.js – Edit existing asset, pre-populated with all 20 fields
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { assetAPI } from '../services/api';
import EmployeeAutocomplete from '../components/EmployeeAutocomplete';

const CATEGORIES = ['Laptop', 'CPU', 'Monitor', 'Printer', 'Phone', 'Server', 'Other'];
const OS_LIST    = ['Windows 11', 'Windows 10', 'Ubuntu', 'macOS', 'Chrome OS', 'Other'];
const RAM_LIST   = ['4GB', '8GB', '16GB', '32GB', '64GB', 'Other'];
const STATUSES   = ['Available', 'Assigned', 'Maintenance', 'Retired'];

function AssetEdit() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/assets';

  const [form,     setForm]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [currentInvoice, setCurrentInvoice] = useState(null);

  useEffect(() => {
    assetAPI.getById(id)
      .then(res => {
        setForm(res.data);
        // Store current invoice attachment
        if (res.data.invoice_attachment) {
          setCurrentInvoice(res.data.invoice_attachment);
        }
        // Initialize selectedEmployee if asset has employee assigned
        if (res.data.emp_id && res.data.employee_name) {
          setSelectedEmployee({
            emp_id: res.data.emp_id,
            employee_name: res.data.employee_name,
            email: res.data.employee_email || '',
            mobile_number: res.data.mobile_number || ''
          });
        }
      })
      .catch(() => setApiError('Asset not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'employee_email') setRecipientEmail(value);
    setErrors(er => {
      if (er[name]) {
        const { [name]: removed, ...rest } = er;
        return rest;
      }
      return er;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setApiError(`File size (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed size (10 MB)`);
      e.target.value = '';
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setApiError('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.');
      e.target.value = '';
      return;
    }

    setInvoiceFile(file);
    setApiError('');
  };

  const handleRemoveInvoice = () => {
    setInvoiceFile(null);
    setCurrentInvoice(null);
    setForm(f => ({ ...f, remove_invoice_attachment: true }));
  };

  // BUG-023 FIX: Employee autocomplete handlers
  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setForm(f => ({
      ...f,
      emp_id: employee.emp_id,
      employee_name: employee.employee_name,
      employee_email: employee.email || '',
      mobile_number: employee.mobile_number || '',
      department: employee.department || '',  // BUG-029 FIX: Added missing field
      designation: employee.designation || '', // BUG-029 FIX: Added missing field
      location: employee.location || f.location // BUG-029 FIX: Added missing field (preserve existing if empty)
    }));
    if (employee.email) {
      setRecipientEmail(employee.email);
    }
  };

  const handleEmployeeClear = () => {
    setSelectedEmployee(null);
    setForm(f => ({
      ...f,
      emp_id: '',
      employee_name: '',
      employee_email: '',
      mobile_number: ''
    }));
    setRecipientEmail('');
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
      await assetAPI.update(id, form, invoiceFile);
      navigate(returnTo, { state: { success: 'Asset updated successfully!' } });
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
      const API_BASE_URL = '/api';  // Relative URL - same port as frontend
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

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      // Use full backend URL for PDF download
      const API_BASE_URL = '/api';
      const response = await fetch(`${API_BASE_URL}/assets/${id}/assignment-form`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF generation failed:', errorText);
        setApiError('Failed to generate PDF: ' + (response.status === 404 ? 'Asset not found' : response.statusText));
        return;
      }
      
      const blob = await response.blob();
      console.log('PDF blob received, size:', blob.size, 'type:', blob.type);
      
      if (blob.size === 0) {
        setApiError('Received empty PDF file');
        return;
      }
      
      // Create a safe blob URL
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;
      link.download = `Assignment_Form_${id}_${form.asset_name || 'Asset'}.pdf`.replace(/ /g, '_');
      
      // Append to body, click, and cleanup
      document.body.appendChild(link);
      
      // Use a small timeout to ensure the link is in the DOM
      setTimeout(() => {
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
    } catch (err) {
      console.error('PDF download error:', err);
      setApiError('Failed to download PDF: ' + err.message);
    }
  };

  const handlePrintPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      // Use full backend URL for PDF download
      const API_BASE_URL = '/api';
      const response = await fetch(`${API_BASE_URL}/assets/${id}/assignment-form`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF generation failed:', errorText);
        setApiError('Failed to generate PDF for printing: ' + (response.status === 404 ? 'Asset not found' : response.statusText));
        return;
      }
      
      const blob = await response.blob();
      console.log('PDF blob for print received, size:', blob.size, 'type:', blob.type);
      
      if (blob.size === 0) {
        setApiError('Received empty PDF file for printing');
        return;
      }
      
      const url = window.URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.position = 'fixed';
      iframe.src = url;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow.print();
          } catch (e) {
            console.error('Print error:', e);
            setApiError('Failed to open print dialog');
          }
        }, 500);
      };
      
      // Cleanup after 30 seconds
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
          window.URL.revokeObjectURL(url);
        }
      }, 30000);
      
    } catch (err) {
      console.error('Print PDF error:', err);
      setApiError('Failed to print PDF: ' + err.message);
    }
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
            <div className="col-md-12">
              <label className="form-label">Search Employee</label>
              <EmployeeAutocomplete
                value={selectedEmployee}
                onChange={handleEmployeeSelect}
                onClear={handleEmployeeClear}
                placeholder="Search by Employee ID, Name, Email, or Phone..."
                showDetails={true}
                activeOnly={true}
              />
              <small className="text-muted d-block mt-1">
                <i className="bi bi-info-circle me-1"></i>
                Search and select an employee to auto-fill all fields. Leave empty if asset is unassigned.
              </small>
            </div>
          </div>
          
          {/* Read-only employee details display */}
          {selectedEmployee && (
            <div className="row g-3 mt-2">
              <div className="col-md-3">
                <label className="form-label text-muted">Employee ID</label>
                <input
                  type="text"
                  className="form-control-plaintext"
                  value={form.emp_id || ''}
                  readOnly
                />
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted">Employee Name</label>
                <input
                  type="text"
                  className="form-control-plaintext"
                  value={form.employee_name || ''}
                  readOnly
                />
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted">Mobile Number</label>
                <input
                  type="text"
                  className="form-control-plaintext"
                  value={form.mobile_number || ''}
                  readOnly
                />
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted">Employee Email</label>
                <input
                  type="text"
                  className="form-control-plaintext"
                  value={form.employee_email || ''}
                  readOnly
                />
              </div>
            </div>
          )}
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
                autoComplete="off"
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
                autoComplete="off"
              />
              {errors.serial_number && <div className="invalid-feedback">{errors.serial_number}</div>}
            </div>

            <div className="col-md-4">
              <label className="form-label">Model Name</label>
              <input type="text" name="model_name" className="form-control" value={form.model_name || ''} onChange={handleChange} autoComplete="off" />
            </div>

            <div className="col-md-4">
              <label className="form-label">Location</label>
              <input type="text" name="location" className="form-control" value={form.location || ''} onChange={handleChange} autoComplete="off" />
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
              <input type="text" name="version" className="form-control" value={form.version || ''} onChange={handleChange} autoComplete="off" />
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
              <input type="text" name="charger_serial" className="form-control" value={form.charger_serial || ''} onChange={handleChange} autoComplete="off" />
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
              <input type="text" name="invoice_number" className="form-control" value={form.invoice_number || ''} onChange={handleChange} autoComplete="off" />
            </div>
            <div className="col-md-4">
              <label className="form-label">Invoice Date</label>
              <input type="date" name="invoice_date" className="form-control" value={form.invoice_date || ''} onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Warranty Date</label>
              <input type="date" name="warranty_date" className="form-control" value={form.warranty_date || ''} onChange={handleChange} />
            </div>
            <div className="col-md-12">
              <label className="form-label">Invoice Attachment</label>
              
              {/* Show current invoice if exists */}
              {currentInvoice && !form.remove_invoice_attachment && (
                <div className="mb-2 p-2 border rounded d-flex align-items-center justify-content-between" style={{background: '#f8f9fa'}}>
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-file-earmark-pdf text-danger"></i>
                    <span className="small">{currentInvoice.split('/').pop()}</span>
                    <button 
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={async () => {
                        try {
                          const filename = currentInvoice.split('/').pop();
                          const response = await assetAPI.viewInvoiceFile(filename);
                          const blob = new Blob([response.data], { type: response.headers['content-type'] });
                          const blobUrl = window.URL.createObjectURL(blob);
                          window.open(blobUrl, '_blank');
                          // Cleanup after a delay
                          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
                        } catch (err) {
                          setApiError('Failed to view invoice: ' + (err.response?.data?.error || err.message));
                        }
                      }}
                    >
                      <i className="bi bi-eye"></i> View
                    </button>
                    <button 
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={async () => {
                        try {
                          const filename = currentInvoice.split('/').pop();
                          const response = await assetAPI.downloadInvoiceFile(filename);
                          const blob = new Blob([response.data], { type: response.headers['content-type'] });
                          const blobUrl = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = blobUrl;
                          link.download = filename;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(blobUrl);
                        } catch (err) {
                          setApiError('Failed to download invoice: ' + (err.response?.data?.error || err.message));
                        }
                      }}
                    >
                      <i className="bi bi-download"></i> Download
                    </button>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleRemoveInvoice}
                    title="Remove invoice"
                  >
                    <i className="bi bi-trash"></i> Remove
                  </button>
                </div>
              )}
              
              {/* Show new file selector or replacement message */}
              {(!currentInvoice || form.remove_invoice_attachment) && (
                <>
                  <input
                    type="file"
                    name="invoice_attachment"
                    className="form-control"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <small className="text-muted d-block mt-1">
                    Supported: PDF, JPG, PNG (Max: 10 MB)
                  </small>
                </>
              )}
              
              {/* Show new file name if selected */}
              {invoiceFile && (
                <div className="mt-2 p-2 border rounded" style={{background: '#e7f3ff'}}>
                  <i className="bi bi-file-earmark-arrow-up text-primary me-2"></i>
                  <strong>New file selected:</strong> {invoiceFile.name}
                </div>
              )}
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
              <input type="text" name="old_user" className="form-control" value={form.old_user || ''} onChange={handleChange} autoComplete="off" />
            </div>
            <div className="col-md-4">
              <label className="form-label">Old Device</label>
              <input type="text" name="old_device" className="form-control" value={form.old_device || ''} onChange={handleChange} autoComplete="off" />
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
          <button type="button" className="btn btn-success" onClick={handleDownloadPDF}>
            <i className="bi bi-file-pdf me-2"></i>Download Assignment Form
          </button>
          <button type="button" className="btn btn-info" onClick={handlePrintPDF}>
            <i className="bi bi-printer me-2"></i>Print Assignment Form
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(returnTo)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AssetEdit;
