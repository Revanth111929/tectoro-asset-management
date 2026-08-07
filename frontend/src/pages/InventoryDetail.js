// InventoryDetail.js - Comprehensive inventory record view (read-only)
// Future-proof: Currently uses asset_id, ready for inventory master table migration
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assetAPI } from '../services/api';

function InventoryDetail() {
  const { inventoryId } = useParams(); // Future-proof: currently detail/:inventoryId, will migrate to /:inventoryId
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [historySummary, setHistorySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoiceError, setInvoiceError] = useState('');

  useEffect(() => {
    // Currently: inventoryId maps to asset.id
    // Future: will map to inventory master record
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch asset details
        const assetRes = await assetAPI.getById(inventoryId);
        setAsset(assetRes.data);
        
        // Fetch lifecycle summary
        try {
          const historyRes = await assetAPI.getHistory(inventoryId);
          const events = historyRes.data.events || [];
          
          // Calculate comprehensive summary statistics
          const assignments = events.filter(e => 
            e.event_type === 'ASSIGNED' || e.event_type === 'REASSIGNED' || 
            e.action_type === 'ASSET_ASSIGNED' || e.action_type === 'ASSET_REASSIGNED'
          );
          
          const repairs = events.filter(e => 
            e.event_type === 'MAINTENANCE_STARTED' || 
            e.event_type === 'MAINTENANCE_COMPLETED' ||
            e.type === 'temp_assignment'
          );
          
          const returns = events.filter(e => 
            e.event_type === 'RETURNED' || e.action_type === 'ASSET_RETURNED'
          );
          
          const replacements = events.filter(e => 
            e.event_type === 'REPLACED' || e.action_type === 'ASSET_REPLACED'
          );
          
          // Extract unique users who used this device
          const usersMap = new Map();
          
          assignments.forEach((event, index) => {
            const empId = event.to_employee_id || event.employee_id;
            const empName = event.to_employee || event.employee_name;
            
            if (empId && empName) {
              if (!usersMap.has(empId)) {
                // Find the return event for this assignment
                const assignmentDate = new Date(event.event_date || event.timestamp || event.date);
                let returnDate = null;
                let daysUsed = null;
                let status = 'Current';
                
                // Look for next return event after this assignment
                for (let i = index + 1; i < events.length; i++) {
                  const nextEvent = events[i];
                  if ((nextEvent.event_type === 'RETURNED' || nextEvent.action_type === 'ASSET_RETURNED') &&
                      (nextEvent.from_employee_id === empId || nextEvent.employee_id === empId)) {
                    returnDate = new Date(nextEvent.event_date || nextEvent.timestamp || nextEvent.date);
                    daysUsed = Math.ceil((returnDate - assignmentDate) / (1000 * 60 * 60 * 24));
                    status = 'Returned';
                    break;
                  }
                }
                
                // If no return found and this is current employee, mark as Current
                if (!returnDate && assetRes.data.emp_id === empId) {
                  const today = new Date();
                  daysUsed = Math.ceil((today - assignmentDate) / (1000 * 60 * 60 * 24));
                  status = 'Current';
                } else if (!returnDate) {
                  status = 'Returned';
                }
                
                usersMap.set(empId, {
                  emp_id: empId,
                  employee_name: empName,
                  assigned_date: assignmentDate,
                  returned_date: returnDate,
                  days_used: daysUsed,
                  status: status
                });
              }
            }
          });
          
          const uniqueUsers = Array.from(usersMap.values()).sort((a, b) => 
            b.assigned_date - a.assigned_date
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
            totalAssignments: assignments.length,
            totalRepairs: repairs.length,
            totalReplacements: replacements.length,
            totalReturns: returns.length,
            uniqueUsers: uniqueUsers,
            allEvents: events
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

  const handleViewInvoice = async () => {
    try {
      setInvoiceError('');
      const filename = asset.invoice_attachment.split('/').pop();
      const response = await assetAPI.viewInvoiceFile(filename);
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
    } catch (err) {
      setInvoiceError('Failed to view invoice: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setInvoiceError('');
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
      setInvoiceError('Failed to download invoice: ' + (err.response?.data?.error || err.message));
    }
  };

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

      {/* Compact Summary Cards */}
      <div className="row g-2 mb-4">
        <div className="col-md-2">
          <div className="table-card text-center py-2">
            <div className="text-primary" style={{ fontSize: '1.5rem' }}>
              <i className="bi bi-people"></i>
            </div>
            <div className="fw-bold fs-5">{historySummary?.uniqueUsers?.length || 0}</div>
            <div className="text-muted small">Total Users</div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="table-card text-center py-2">
            <div className="text-danger" style={{ fontSize: '1.5rem' }}>
              <i className="bi bi-tools"></i>
            </div>
            <div className="fw-bold fs-5">{historySummary?.totalRepairs || 0}</div>
            <div className="text-muted small">Total Repairs</div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="table-card text-center py-2">
            <div className="text-warning" style={{ fontSize: '1.5rem' }}>
              <i className="bi bi-arrow-repeat"></i>
            </div>
            <div className="fw-bold fs-5">{historySummary?.totalReplacements || 0}</div>
            <div className="text-muted small">Replacements</div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="table-card text-center py-2">
            <div className="text-success" style={{ fontSize: '1.5rem' }}>
              <i className="bi bi-file-earmark-check"></i>
            </div>
            <div className="fw-bold fs-5">{asset.invoice_attachment ? 'Yes' : 'No'}</div>
            <div className="text-muted small">Invoice</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="table-card text-center py-2">
            <div className={`text-${warranty?.color || 'secondary'}`} style={{ fontSize: '1.5rem' }}>
              <i className="bi bi-shield-check"></i>
            </div>
            <div className="fw-bold">{warranty ? warranty.status : 'N/A'}</div>
            <div className="text-muted small">{warranty && warranty.days > 0 ? `${warranty.days} days remaining` : warranty && warranty.days < 0 ? `Expired ${Math.abs(warranty.days)} days ago` : 'No Warranty'}</div>
          </div>
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
          {asset.invoice_attachment && (
            <Section title="Invoice Attachment" icon="paperclip">
              {invoiceError && (
                <div className="alert alert-danger alert-sm mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {invoiceError}
                </div>
              )}
              <div className="d-flex align-items-center justify-content-between p-3 rounded" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: 'rgba(99,102,241,0.1)', borderRadius: 8 }}>
                    <i className="bi bi-file-earmark-pdf text-primary" style={{ fontSize: 24 }}></i>
                  </div>
                  <div>
                    <div className="fw-600">{asset.invoice_attachment.split('/').pop()}</div>
                    <div className="text-muted small">Invoice Attachment</div>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button 
                    onClick={handleViewInvoice}
                    className="btn btn-sm btn-outline-primary"
                  >
                    <i className="bi bi-eye me-1"></i>View
                  </button>
                  <button 
                    onClick={handleDownloadInvoice}
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

          {/* Users Who Used This Device */}
          {historySummary?.uniqueUsers && historySummary.uniqueUsers.length > 0 && (
            <Section title="Users Who Used This Device" icon="people">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Employee Name</th>
                      <th>Assigned Date</th>
                      <th>Returned Date</th>
                      <th>Days Used</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historySummary.uniqueUsers.map((user, index) => (
                      <tr key={index}>
                        <td><code>{user.emp_id}</code></td>
                        <td className="fw-600">{user.employee_name}</td>
                        <td>{user.assigned_date ? new Date(user.assigned_date).toLocaleDateString() : '—'}</td>
                        <td>{user.returned_date ? new Date(user.returned_date).toLocaleDateString() : '—'}</td>
                        <td>{user.days_used ? `${user.days_used} days` : '—'}</td>
                        <td>
                          <span className={`badge bg-${user.status === 'Current' ? 'primary' : 'secondary'}`}>
                            {user.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Device Lifecycle Timeline */}
          {historySummary?.allEvents && historySummary.allEvents.length > 0 && (
            <Section title="Device Lifecycle" icon="clock-history">
              <div className="mb-3">
                <div className="timeline-vertical" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {historySummary.allEvents.slice(0, 10).map((event, index) => {
                    const eventType = event.event_type || event.action_type;
                    const eventDate = event.event_date || event.timestamp || event.date;
                    const eventEmployee = event.to_employee || event.employee_name || event.from_employee;
                    
                    return (
                      <div key={index} className="timeline-item-vertical mb-3">
                        <div className="timeline-marker-vertical">
                          <div className="timeline-icon-badge bg-primary" style={{ width: 24, height: 24 }}>
                            <i className="bi bi-circle-fill" style={{ fontSize: 8 }}></i>
                          </div>
                        </div>
                        <div className="timeline-content-vertical">
                          <div className="small">
                            <div className="fw-600">{eventType?.replace(/_/g, ' ')}</div>
                            <div className="text-muted">
                              {eventDate ? new Date(eventDate).toLocaleDateString() : '—'}
                              {eventEmployee && <span> • {eventEmployee}</span>}
                            </div>
                            {(event.reason || event.remarks) && (
                              <div className="text-muted small">{event.reason || event.remarks}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Link 
                  to={`/inventory/lifecycle/${inventoryId}`}
                  className="btn btn-outline-primary btn-sm w-100 mt-3"
                >
                  <i className="bi bi-clock-history me-2"></i>
                  View Complete Lifecycle Timeline
                </Link>
              </div>
            </Section>
          )}
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
