import React from 'react';
import './AssetDetailsCard.css';
import { assetAPI } from '../services/api';

function AssetDetailsCard({ asset, title = "Asset Details", collapsible = false }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [error, setError] = React.useState('');

  if (!asset) return null;

  const getStatusColor = (status) => {
    const colors = {
      'Available': '#10b981',
      'Assigned': '#3b82f6',
      'Under Repair': '#f59e0b',
      'Maintenance': '#f59e0b',
      'Returned': '#6b7280',
      'Retired': '#dc2626',
      'Temporary Assignment': '#8b5cf6'
    };
    return colors[status] || '#6b7280';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  const getWarrantyStatus = (warrantyDate) => {
    if (!warrantyDate) return { text: 'No warranty info', color: '#6b7280', icon: '⚠️' };
    
    const today = new Date();
    const warranty = new Date(warrantyDate);
    const diffTime = warranty - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Expired', color: '#dc2626', icon: '❌' };
    } else if (diffDays <= 90) {
      return { text: `Expires in ${diffDays} days`, color: '#f59e0b', icon: '⚠️' };
    } else {
      return { text: `Valid until ${formatDate(warrantyDate)}`, color: '#10b981', icon: '✅' };
    }
  };

  const warranty = getWarrantyStatus(asset.warranty_date);

  const handleViewInvoice = async () => {
    try {
      setError('');
      const filename = asset.invoice_attachment.split('/').pop();
      const response = await assetAPI.viewInvoiceFile(filename);
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      // Cleanup after a delay
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
    } catch (err) {
      console.error('Failed to view invoice:', err);
      setError('Failed to view invoice: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setError('');
      const filename = asset.invoice_attachment.split('/').pop();
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
      console.error('Failed to download invoice:', err);
      setError('Failed to download invoice: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="asset-details-card">
      <div className="asset-details-header">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <i className="bi bi-info-circle me-2"></i>{title}
          </h6>
          {collapsible && (
            <button
              type="button"
              className="btn btn-sm btn-link"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <i className={`bi bi-chevron-${isCollapsed ? 'down' : 'up'}`}></i>
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="asset-details-body">
          {/* Error message */}
          {error && (
            <div className="alert alert-danger alert-sm mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}
          {/* Primary Info */}
          <div className="detail-section">
            <div className="asset-name">{asset.asset_name || 'N/A'}</div>
            <div className="asset-serial">
              <i className="bi bi-upc-scan me-1"></i>
              Serial: {asset.serial_number || 'N/A'}
            </div>
            <div className="asset-status mt-2">
              <span 
                className="status-badge" 
                style={{ backgroundColor: getStatusColor(asset.status) }}
              >
                {asset.status || 'Unknown'}
              </span>
              <span className="category-badge ms-2">
                {asset.category || 'N/A'}
              </span>
            </div>
          </div>

          {/* Specifications */}
          {(asset.brand_name || asset.model_name || asset.processor || asset.ram || asset.storage_capacity || asset.os) && (
            <div className="detail-section">
              <div className="section-title">
                <i className="bi bi-cpu me-1"></i>Specifications
              </div>
              <div className="detail-grid">
                {asset.brand_name && (
                  <div className="detail-item">
                    <span className="detail-label">Brand:</span>
                    <span className="detail-value">{asset.brand_name}</span>
                  </div>
                )}
                {asset.model_name && (
                  <div className="detail-item">
                    <span className="detail-label">Model:</span>
                    <span className="detail-value">{asset.model_name}</span>
                  </div>
                )}
                {asset.processor && (
                  <div className="detail-item">
                    <span className="detail-label">CPU:</span>
                    <span className="detail-value">{asset.processor}</span>
                  </div>
                )}
                {asset.ram && (
                  <div className="detail-item">
                    <span className="detail-label">RAM:</span>
                    <span className="detail-value">{asset.ram}</span>
                  </div>
                )}
                {asset.storage_capacity && (
                  <div className="detail-item">
                    <span className="detail-label">Storage:</span>
                    <span className="detail-value">
                      {asset.storage_capacity} {asset.storage_type && `(${asset.storage_type})`}
                    </span>
                  </div>
                )}
                {asset.os && (
                  <div className="detail-item">
                    <span className="detail-label">OS:</span>
                    <span className="detail-value">{asset.os} {asset.os_version}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assignment Info */}
          {(asset.employee_name || asset.emp_id || asset.location) && (
            <div className="detail-section">
              <div className="section-title">
                <i className="bi bi-person me-1"></i>Assignment
              </div>
              <div className="detail-grid">
                {asset.employee_name && (
                  <div className="detail-item">
                    <span className="detail-label">Employee:</span>
                    <span className="detail-value">{asset.employee_name}</span>
                  </div>
                )}
                {asset.emp_id && (
                  <div className="detail-item">
                    <span className="detail-label">Emp ID:</span>
                    <span className="detail-value">{asset.emp_id}</span>
                  </div>
                )}
                {asset.employee_email && (
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{asset.employee_email}</span>
                  </div>
                )}
                {asset.location && (
                  <div className="detail-item">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{asset.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warranty & Purchase */}
          {(asset.purchase_date || asset.warranty_date || asset.invoice_number || asset.invoice_attachment) && (
            <div className="detail-section">
              <div className="section-title">
                <i className="bi bi-shield-check me-1"></i>Warranty & Purchase
              </div>
              <div className="detail-grid">
                {asset.purchase_date && (
                  <div className="detail-item">
                    <span className="detail-label">Purchase:</span>
                    <span className="detail-value">{formatDate(asset.purchase_date)}</span>
                  </div>
                )}
                {asset.warranty_date && (
                  <div className="detail-item warranty-item">
                    <span className="detail-label">Warranty:</span>
                    <span 
                      className="detail-value" 
                      style={{ color: warranty.color, fontWeight: 'bold' }}
                    >
                      {warranty.icon} {warranty.text}
                    </span>
                  </div>
                )}
                {asset.invoice_number && (
                  <div className="detail-item">
                    <span className="detail-label">Invoice:</span>
                    <span className="detail-value">{asset.invoice_number}</span>
                  </div>
                )}
                {asset.invoice_date && (
                  <div className="detail-item">
                    <span className="detail-label">Invoice Date:</span>
                    <span className="detail-value">{formatDate(asset.invoice_date)}</span>
                  </div>
                )}
                {asset.purchase_vendor && (
                  <div className="detail-item">
                    <span className="detail-label">Vendor:</span>
                    <span className="detail-value">{asset.purchase_vendor}</span>
                  </div>
                )}
                {asset.invoice_attachment && (
                  <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="detail-label">Invoice Attachment:</span>
                    <div className="mt-2 p-2 border rounded d-flex align-items-center gap-2" style={{background: '#f8f9fa', display: 'inline-flex'}}>
                      <i className="bi bi-file-earmark-pdf text-danger"></i>
                      <span className="small">{asset.invoice_attachment.split('/').pop()}</span>
                      <button 
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={handleViewInvoice}
                        title="View invoice"
                      >
                        <i className="bi bi-eye"></i> View
                      </button>
                      <button 
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        onClick={handleDownloadInvoice}
                        title="Download invoice"
                      >
                        <i className="bi bi-download"></i> Download
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Info */}
          {asset.comments && (
            <div className="detail-section">
              <div className="section-title">
                <i className="bi bi-chat-text me-1"></i>Comments
              </div>
              <div className="comments-text">{asset.comments}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AssetDetailsCard;
