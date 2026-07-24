import React from 'react';
import './AssetDetailsCard.css';

function AssetDetailsCard({ asset, title = "Asset Details", collapsible = false }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

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
          {(asset.purchase_date || asset.warranty_date || asset.invoice_number) && (
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
                {asset.purchase_vendor && (
                  <div className="detail-item">
                    <span className="detail-label">Vendor:</span>
                    <span className="detail-value">{asset.purchase_vendor}</span>
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
