// InventoryDetail.js - Comprehensive inventory record view (read-only)
// Future-proof: Currently uses asset_id, ready for inventory master table migration
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assetAPI, invoiceAPI } from '../services/api';

function InventoryDetail() {
  const { inventoryId } = useParams(); // Future-proof: currently detail/:inventoryId, will migrate to /:inventoryId
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [historySummary, setHistorySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Currently: inventoryId maps to asset.id
    // Future: will map to inventory master record
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch asset details
        const assetRes = await assetAPI.getById(inventoryId);
        setAsset(assetRes.data);
        
        // Fetch invoice if exists
        try {
          const invoiceRes = await invoiceAPI.getInfo(inventoryId);
          setInvoice(invoiceRes.data.attachment);
        } catch (err) {
          // No invoice - that's okay
        }
        
        // Fetch lifecycle summary
        try {
          const historyRes = await assetAPI.getHistory(inventoryId);
          const events = historyRes.data.events || [];
          
          // Calculate summary
          const assignments = events.filter(e => 
            e.event_type === 'ASSIGNED' || e.action_type === 'ASSET_ASSIGNED'
          );
          
          const firstAssignment = assignments.length > 0 
            ? assignments[assignments.length - 1] 
            : null;
          
          const currentUser = assetRes.data.emp_id 
            ? { emp_id: assetRes.data.emp_id, name: assetRes.data.employee_name }
            : null;
          
          const lastActivity = events.length > 0 ? events[0] : null;
          
          setHistorySummary({
            firstAssignment,
            currentUser,
            lastActivity,
            totalAssignments: assignments.length
          });
        } catch (err) {
          console.warn('Could not fetch history summary:', err);
        }
        
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load inventory details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [inventoryId]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error || 'Inventory record not found'}
      </div>
    );
  }

  // Helper functions
  const statusBadge = (status) => {
    const colorMap = {
      Available: 'success',
      Assigned: 'primary',
      Maintenance: 'warning',
      Retired: 'secondary',
      Reserved: 'info'
    };
    return (
      <span className={`badge bg-${colorMap[status] || 'secondary'}`}>
        {status}
      </span>
    );
  };

  const calculateWarranty = () => {
    if (!asset.warranty_end_date) return null;
    
    const endDate = new Date(asset.warranty_end_date);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'Expired', color: 'danger', days: Math.abs(diffDays), text: `Expired ${Math.abs(diffDays)} days ago` };
    } else if (diffDays <= 90) {
      return { status: 'Expiring Soon', color: 'warning', days: diffDays, text: `${diffDays} days remaining` };
    } else {
      return { status: 'Active', color: 'success', days: diffDays, text: `${diffDays} days remaining` };
    }
  };

  const warranty = calculateWarranty();

  const Row = ({ label, value, colClass = 'col-md-4' }) => (
    <div className={`${colClass} mb-3`}>
      <div className="text-muted small fw-600 mb-1">{label}</div>
      <div>{value || <span className="text-muted">—</span>}</div>
    </div>
  );

  const Section = ({ title, icon, children, badge }) => (
    <div className="table-card mb-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0 text-primary">
          <i className={`bi bi-${icon} me-2`}></i>{title}
        </h6>
        {badge && <div>{badge}</div>}
      </div>
      {children}
    </div>
  );

  // Calculate stock quantities (currently based on single asset, future: aggregate from inventory)
  const stockQuantities = {
    total: asset.quantity || 1,
    available: asset.status === 'Available' ? 1 : 0,
    assigned: asset.status === 'Assigned' ? 1 : 0,
    maintenance: asset.status === 'Maintenance' ? 1 : 0,
    retired: asset.status === 'Retired' ? 1 : 0,
    reserved: 0 // Future: from inventory reservations
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <button 
              onClick={() => navigate(-1)} 
              className="btn btn-sm btn-outline-secondary"
            >
              <i className="bi bi-arrow-left"></i>
            </button>
            <h2 className="fw-bold mb-0">Inventory Record</h2>
          </div>
          <div className="d-flex align-items-center gap-3">
            <h4 className="mb-0 text-muted">{asset.asset_name}</h4>
            {statusBadge(asset.status)}
          </div>
        </div>
        <div className="text-muted text-end">
          <div className="small">Inventory ID</div>
          <div className="font-monospace fw-bold">#{inventoryId}</div>
        </div>
      </div>

      <div className="row">
        {/* Left Column */}
        <div className="col-lg-8">
          {/* Basic Information */}
          <Section title="Basic Information" icon="info-circle">
            <div className="row">
              <Row label="Category" value={asset.category} />
              <Row label="Brand" value={asset.brand_name} />
              <Row label="Model" value={asset.model_name} />
              <Row label="Serial Number" value={<code>{asset.serial_number}</code>} />
              <Row label="Asset Tag" value={asset.id ? `AST-${String(asset.id).padStart(5, '0')}` : '—'} />
              <Row label="Asset Name" value={asset.asset_name} />
            </div>
          </Section>

          {/* Hardware Specifications */}
          <Section title="Hardware Specifications" icon="cpu">
            <div className="row">
              {asset.processor && <Row label="Processor" value={asset.processor} />}
              {asset.ram && <Row label="RAM" value={asset.ram} />}
              {asset.storage_capacity && <Row label="Storage" value={`${asset.storage_capacity} ${asset.storage_type || ''}`} />}
              {asset.os && <Row label="Operating System" value={`${asset.os} ${asset.os_version || ''}`} />}
              {asset.screen_size && <Row label="Screen Size" value={asset.screen_size} />}
              {asset.graphics_card && <Row label="Graphics Card" value={asset.graphics_card} />}
              
              {/* Category-specific fields */}
              {asset.imei_1 && <Row label="IMEI 1" value={asset.imei_1} />}
              {asset.imei_2 && <Row label="IMEI 2" value={asset.imei_2} />}
              {asset.resolution && <Row label="Resolution" value={asset.resolution} />}
              {asset.refresh_rate && <Row label="Refresh Rate" value={asset.refresh_rate} />}
              {asset.printer_type && <Row label="Printer Type" value={asset.printer_type} />}
              {asset.color_or_mono && <Row label="Color/Mono" value={asset.color_or_mono} />}
              {asset.network_enabled && <Row label="Network Enabled" value={asset.network_enabled} />}
              {asset.capacity_va && <Row label="Capacity" value={`${asset.capacity_va} VA`} />}
              {asset.battery_type && <Row label="Battery Type" value={asset.battery_type} />}
              {asset.backup_time && <Row label="Backup Time" value={asset.backup_time} />}
              {asset.connection_type && <Row label="Connection Type" value={asset.connection_type} />}
              {asset.interface_type && <Row label="Interface" value={asset.interface_type} />}
              {asset.ip_address && <Row label="IP Address" value={asset.ip_address} />}
              {asset.rack_location && <Row label="Rack Location" value={asset.rack_location} />}
              
              {asset.configuration && (
                <Row label="Configuration" value={asset.configuration} colClass="col-12" />
              )}
            </div>
          </Section>

          {/* Purchase Information */}
          <Section title="Purchase Information" icon="cart">
            <div className="row">
              <Row label="Vendor" value={asset.purchase_vendor} />
              <Row label="Purchase Date" value={asset.purchase_date} />
              <Row label="Purchase Price" value={asset.purchase_price ? `₹${parseFloat(asset.purchase_price).toLocaleString('en-IN')}` : '—'} />
              <Row label="Invoice Number" value={asset.invoice_number} />
              <Row label="Location" value={asset.location} />
            </div>
          </Section>

          {/* Invoice Attachment */}
          {invoice && (
            <Section title="Invoice Attachment" icon="paperclip">
              <div className="d-flex align-items-center justify-content-between p-3 rounded" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: 'rgba(99,102,241,0.1)', borderRadius: 8 }}>
                    <i className="bi bi-file-earmark-pdf text-primary" style={{ fontSize: 24 }}></i>
                  </div>
                  <div>
                    <div className="fw-600">{invoice.original_filename}</div>
                    <div className="text-muted small">
                      {(invoice.file_size / 1024 / 1024).toFixed(2)} MB
                      {invoice.upload_date && ` • Uploaded ${new Date(invoice.upload_date).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <a 
                    href={invoiceAPI.view(inventoryId)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary"
                  >
                    <i className="bi bi-eye me-1"></i>View
                  </a>
                  <button 
                    onClick={async () => {
                      try {
                        const res = await invoiceAPI.download(inventoryId);
                        const url = window.URL.createObjectURL(res.data);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = invoice.original_filename;
                        a.click();
                        window.URL.revokeObjectURL(url);
                      } catch (err) {
                        alert('Failed to download invoice');
                      }
                    }}
                    className="btn btn-sm btn-success"
                  >
                    <i className="bi bi-download me-1"></i>Download
                  </button>
                </div>
              </div>
            </Section>
          )}

          {/* Warranty Information */}
          <Section 
            title="Warranty Information" 
            icon="shield-check"
            badge={warranty && <span className={`badge bg-${warranty.color}`}>{warranty.status}</span>}
          >
            <div className="row">
              <Row label="Warranty Provider" value={asset.purchase_vendor} />
              <Row label="Warranty Start" value={asset.warranty_start_date} />
              <Row label="Warranty End" value={asset.warranty_end_date} />
              {warranty && (
                <Row 
                  label="Warranty Status" 
                  value={
                    <div>
                      <div className={`text-${warranty.color} fw-600`}>{warranty.text}</div>
                      {warranty.status !== 'Expired' && warranty.days <= 90 && (
                        <div className="text-muted small mt-1">
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          Action required soon
                        </div>
                      )}
                    </div>
                  }
                />
              )}
            </div>
          </Section>
        </div>

        {/* Right Column */}
        <div className="col-lg-4">
          {/* Current Status */}
          <Section title="Current Status" icon="circle-fill">
            <div className="mb-3">
              <div className="text-muted small mb-1">Status</div>
              <div>{statusBadge(asset.status)}</div>
            </div>
            <div className="mb-3">
              <div className="text-muted small mb-1">Location</div>
              <div>{asset.location || <span className="text-muted">—</span>}</div>
            </div>
            {asset.status === 'Assigned' && asset.emp_id && (
              <>
                <div className="mb-3">
                  <div className="text-muted small mb-1">Assigned To</div>
                  <div className="fw-600">{asset.employee_name}</div>
                  <div className="text-muted small">{asset.emp_id}</div>
                </div>
                {asset.employee_email && (
                  <div className="mb-3">
                    <div className="text-muted small mb-1">Email</div>
                    <div className="small">{asset.employee_email}</div>
                  </div>
                )}
                {asset.mobile_number && (
                  <div className="mb-3">
                    <div className="text-muted small mb-1">Mobile</div>
                    <div className="small">{asset.mobile_number}</div>
                  </div>
                )}
              </>
            )}
          </Section>

          {/* Stock Information */}
          <Section title="Stock Information" icon="box-seam">
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Total Quantity</span>
                <span className="fw-bold">{stockQuantities.total}</span>
              </div>
              <div className="progress mb-2" style={{ height: 8 }}>
                <div className="progress-bar bg-success" style={{ width: `${(stockQuantities.available / stockQuantities.total) * 100}%` }}></div>
                <div className="progress-bar bg-primary" style={{ width: `${(stockQuantities.assigned / stockQuantities.total) * 100}%` }}></div>
                <div className="progress-bar bg-warning" style={{ width: `${(stockQuantities.maintenance / stockQuantities.total) * 100}%` }}></div>
                <div className="progress-bar bg-secondary" style={{ width: `${(stockQuantities.retired / stockQuantities.total) * 100}%` }}></div>
              </div>
              <div className="small">
                <div className="d-flex justify-content-between mb-1">
                  <span><i className="bi bi-circle-fill text-success" style={{ fontSize: 8 }}></i> Available</span>
                  <span className="fw-600">{stockQuantities.available}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span><i className="bi bi-circle-fill text-primary" style={{ fontSize: 8 }}></i> Assigned</span>
                  <span className="fw-600">{stockQuantities.assigned}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span><i className="bi bi-circle-fill text-warning" style={{ fontSize: 8 }}></i> Maintenance</span>
                  <span className="fw-600">{stockQuantities.maintenance}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span><i className="bi bi-circle-fill text-secondary" style={{ fontSize: 8 }}></i> Retired</span>
                  <span className="fw-600">{stockQuantities.retired}</span>
                </div>
              </div>
            </div>
          </Section>

          {/* History Summary */}
          <Section title="History Summary" icon="clock-history">
            <div className="mb-3">
              <div className="text-muted small mb-1">Total Assignments</div>
              <div className="fw-bold fs-4">{historySummary?.totalAssignments || 0}</div>
            </div>
            
            {historySummary?.firstAssignment && (
              <div className="mb-3">
                <div className="text-muted small mb-1">First Assigned</div>
                <div className="fw-600">{historySummary.firstAssignment.to_employee || historySummary.firstAssignment.employee_name || '—'}</div>
                <div className="text-muted small">
                  {historySummary.firstAssignment.event_date 
                    ? new Date(historySummary.firstAssignment.event_date || historySummary.firstAssignment.timestamp).toLocaleDateString()
                    : '—'}
                </div>
              </div>
            )}
            
            {historySummary?.currentUser && (
              <div className="mb-3">
                <div className="text-muted small mb-1">Current User</div>
                <div className="fw-600">{historySummary.currentUser.name || '—'}</div>
                <div className="text-muted small">{historySummary.currentUser.emp_id}</div>
              </div>
            )}
            
            {historySummary?.lastActivity && (
              <div className="mb-3">
                <div className="text-muted small mb-1">Last Activity</div>
                <div className="small">
                  {historySummary.lastActivity.event_type || historySummary.lastActivity.action_type}
                </div>
                <div className="text-muted small">
                  {new Date(historySummary.lastActivity.event_date || historySummary.lastActivity.timestamp).toLocaleDateString()}
                </div>
              </div>
            )}
            
            <Link 
              to={`/assets/timeline/${inventoryId}`}
              className="btn btn-outline-primary btn-sm w-100 mt-3"
            >
              <i className="bi bi-clock-history me-2"></i>
              View Complete Lifecycle
            </Link>
          </Section>

          {/* Quick Actions */}
          <div className="table-card">
            <h6 className="fw-bold mb-3 text-primary">
              <i className="bi bi-lightning me-2"></i>Quick Actions
            </h6>
            <div className="d-grid gap-2">
              <Link 
                to={`/assets/view/${inventoryId}`}
                className="btn btn-sm btn-outline-secondary"
              >
                <i className="bi bi-eye me-2"></i>
                View in Operations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InventoryDetail;
