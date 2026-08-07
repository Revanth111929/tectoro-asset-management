// DynamicAssetForm.js - Dynamic form that shows/hides fields based on selected category

import React from 'react';
import { CATEGORY_FIELDS, FIELD_METADATA, CATEGORIES } from '../config/categoryFields';

// Reusable Field Component
const Field = ({ fieldName, value, onChange, error, colClass = 'col-md-4', onFileChange, currentFile, onRemoveFile }) => {
  const metadata = FIELD_METADATA[fieldName];
  if (!metadata) return null;

  const { label, type, placeholder, options, required, rows, min, step, accept, maxSize } = metadata;
  const inputClass = `form-control ${error ? 'is-invalid' : ''}`;

  return (
    <div className={colClass}>
      <label className="form-label fw-500">
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </label>
      
      {type === 'text' && (
        <input
          type="text"
          name={fieldName}
          className={inputClass}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="off"
        />
      )}
      
      {type === 'number' && (
        <input
          type="number"
          name={fieldName}
          className={inputClass}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          step={step}
        />
      )}
      
      {type === 'date' && (
        <input
          type="date"
          name={fieldName}
          className={inputClass}
          value={value || ''}
          onChange={onChange}
        />
      )}
      
      {type === 'select' && (
        <select
          name={fieldName}
          className={inputClass}
          value={value || ''}
          onChange={onChange}
        >
          <option value="">Select…</option>
          {options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}
      
      {type === 'textarea' && (
        <textarea
          name={fieldName}
          className={inputClass}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows || 3}
        />
      )}
      
      {type === 'file' && (
        <div>
          {/* Show current file if exists */}
          {currentFile && (
            <div className="mb-2 p-2 border rounded d-flex align-items-center justify-content-between" style={{background: '#f8f9fa'}}>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-file-earmark-pdf text-danger"></i>
                <span className="small">{currentFile}</span>
              </div>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-danger"
                onClick={onRemoveFile}
                title="Remove invoice"
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          )}
          
          <input
            type="file"
            name={fieldName}
            className={inputClass}
            onChange={onFileChange}
            accept={accept}
          />
          <small className="text-muted d-block mt-1">
            Supported: PDF, JPG, PNG (Max: 10 MB)
          </small>
        </div>
      )}
      
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};

// Section Component
const Section = ({ title, icon, color, children, show = true }) => {
  if (!show) return null;
  
  return (
    <div className="table-card mb-3">
      <h6 className="fw-bold mb-3" style={{ color: color || 'var(--primary)' }}>
        <i className={`bi bi-${icon} me-2`}></i>{title}
      </h6>
      <div className="row g-3">
        {children}
      </div>
    </div>
  );
};

// Main Dynamic Form Component
const DynamicAssetForm = ({ 
  form, 
  setForm, 
  errors = {}, 
  onSubmit, 
  saving, 
  onCancel,
  isExistingDevice = false,
  hidePurchaseSection = false,
  renderExtraButtons = null,
  submitButtonText = null,
  invoiceFile = null,
  setInvoiceFile = null,
  currentInvoiceAttachment = null
}) => {
  const category = form.category;
  const fields = category ? CATEGORY_FIELDS[category] : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert(`File size (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed size (10 MB)`);
      e.target.value = '';
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.');
      e.target.value = '';
      return;
    }

    if (setInvoiceFile) {
      setInvoiceFile(file);
    }
  };

  const handleRemoveInvoice = () => {
    if (setInvoiceFile) {
      setInvoiceFile(null);
    }
    // Mark for removal in form
    setForm(f => ({ ...f, remove_invoice_attachment: true }));
  };

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    
    // When category changes, reset form but keep basic fields
    // For existing device, also preserve employee fields
    const baseFields = {
      asset_name: form.asset_name,
      category: newCategory,
      serial_number: form.serial_number,
      model_name: form.model_name,
      brand_name: form.brand_name,
      location: form.location,
      status: form.status || (isExistingDevice ? 'Assigned' : 'Available'),
      quantity: '1',
    };
    
    // Preserve employee fields for existing device
    if (isExistingDevice) {
      baseFields.emp_id = form.emp_id;
      baseFields.employee_name = form.employee_name;
      baseFields.mobile_number = form.mobile_number;
      baseFields.employee_email = form.employee_email;
      baseFields.old_user = form.old_user;
      baseFields.old_device = form.old_device;
      baseFields.date = form.date;
    }
    
    setForm(f => ({
      ...baseFields,
      // Clear all category-specific fields
      os: '',
      os_version: '',
      ram: '',
      processor: '',
      storage_type: '',
      storage_capacity: '',
      graphics_card: '',
      screen_size: '',
      imei_1: '',
      imei_2: '',
      color_or_mono: '',
      network_enabled: '',
      resolution: '',
      refresh_rate: '',
      cpu_count: '',
      raid_config: '',
      ip_address: '',
      rack_location: '',
      interface_type: '',
      capacity_va: '',
      battery_type: '',
      backup_time: '',
      connection_type: '',
      noise_cancellation: '',
      size_compatibility: '',
      color: '',
      warranty_period: '',
      purchase_vendor: '',
      purchase_date: '',
      warranty_start_date: '',
      warranty_end_date: '',
      assigned_employee: '',
      custom_description: '',
      remarks: '',
      comments: ''
    }));
  };

  return (
    <form onSubmit={onSubmit}>
      {/* Category Selection - Always visible */}
      <Section title="Asset Category" icon="box-seam" color="#2563eb" show={true}>
        <Field
          fieldName="category"
          value={category}
          onChange={handleCategoryChange}
          error={errors.category}
          colClass="col-md-6"
        />
        
        {category && (
          <div className="col-md-6">
            <div className="alert d-flex align-items-center gap-2 mb-0"
              style={{ background:'rgba(37,99,235,0.08)', border:'1px solid rgba(37,99,235,0.25)', padding:'12px 16px' }}>
              <i className="bi bi-info-circle-fill text-primary"></i>
              <span className="small">
                Form updated for <strong>{category}</strong>. Only relevant fields are shown below.
              </span>
            </div>
          </div>
        )}
      </Section>

      {/* Dynamic sections based on category */}
      {fields && (
        <>
          {/* Basic Details */}
          <Section title="Basic Details" icon="laptop" color="#16a34a" show={fields.basic?.length > 0}>
            {fields.basic?.map(fieldName => (
              fieldName !== 'category' && ( // Skip category as it's already shown above
                <Field
                  key={fieldName}
                  fieldName={fieldName}
                  value={form[fieldName]}
                  onChange={handleChange}
                  error={errors[fieldName]}
                />
              )
            ))}
          </Section>

          {/* Specifications */}
          <Section title="Specifications" icon="cpu" color="#7c3aed" show={fields.specifications?.length > 0}>
            {fields.specifications?.map(fieldName => (
              <Field
                key={fieldName}
                fieldName={fieldName}
                value={form[fieldName]}
                onChange={handleChange}
                error={errors[fieldName]}
                colClass={fieldName === 'configuration' ? 'col-12' : 'col-md-4'}
              />
            ))}
          </Section>

          {/* Purchase & Warranty */}
          <Section title="Purchase & Warranty" icon="receipt" color="#ea580c" show={!hidePurchaseSection && fields.purchase?.length > 0}>
            {fields.purchase?.map(fieldName => (
              <Field
                key={fieldName}
                fieldName={fieldName}
                value={form[fieldName]}
                onChange={handleChange}
                error={errors[fieldName]}
                onFileChange={fieldName === 'invoice_attachment' ? handleFileChange : undefined}
                currentFile={fieldName === 'invoice_attachment' && currentInvoiceAttachment ? currentInvoiceAttachment : (fieldName === 'invoice_attachment' && invoiceFile ? invoiceFile.name : null)}
                onRemoveFile={fieldName === 'invoice_attachment' ? handleRemoveInvoice : undefined}
              />
            ))}
          </Section>

          {/* Info box for new device inventory */}
          {!isExistingDevice && (
            <div className="alert d-flex gap-2 mb-4"
              style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:'10px' }}>
              <i className="bi bi-box-seam text-success mt-1"></i>
              <div className="small">
                This {category?.toLowerCase() || 'asset'} will be added to <strong>inventory as Available</strong>.
                You can assign it to an employee later by editing the asset from the Assets list.
              </div>
            </div>
          )}
          
          {/* Info box for existing device assignment */}
          {isExistingDevice && (
            <div className="alert d-flex gap-2 mb-4"
              style={{ background:'rgba(217,119,6,0.08)', border:'1px solid rgba(217,119,6,0.25)', borderRadius:'10px' }}>
              <i className="bi bi-recycle text-warning mt-1"></i>
              <div className="small">
                This {category?.toLowerCase() || 'asset'} will be assigned to the employee specified above.
                Status will be set to <strong>Assigned</strong> automatically.
              </div>
            </div>
          )}

          {/* Extra buttons/content (for acknowledgment email checkbox, etc.) */}
          {renderExtraButtons && renderExtraButtons()}

          {/* Action Buttons */}
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary px-4" disabled={saving}>
              {saving
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>
                : <><i className="bi bi-plus-circle me-2"></i>
                    {submitButtonText || (isExistingDevice ? 'Create Asset' : 'Add to Inventory')}</>}
            </button>
            <button type="button" className="btn btn-outline-secondary px-4" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </>
      )}

      {/* No category selected */}
      {!category && (
        <div className="alert d-flex gap-2 mb-4"
          style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'10px' }}>
          <i className="bi bi-arrow-up-circle-fill text-warning mt-1"></i>
          <div className="small">
            <strong>Please select a category</strong> to display the appropriate fields for that asset type.
          </div>
        </div>
      )}
    </form>
  );
};

export default DynamicAssetForm;
export { CATEGORIES };
