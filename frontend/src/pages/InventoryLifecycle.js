// InventoryLifecycle.js - Complete Asset Lifecycle Timeline (Read-Only)
// Future-proof: Currently uses assetId, ready for inventory master table migration
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assetAPI } from '../services/api';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './InventoryLifecycle.css';

function InventoryLifecycle() {
  const { assetId } = useParams(); // Future: will map to inventoryId
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState(null);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [stats, setStats] = useState({});
  
  // Filters and search
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // desc = newest first, asc = oldest first
  
  useEffect(() => {
    fetchLifecycleData();
  }, [assetId]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [events, filterType, searchTerm, sortOrder]);

  const fetchLifecycleData = async () => {
    try {
      setLoading(true);
      
      // Fetch asset details
      const assetRes = await assetAPI.getById(assetId);
      setAsset(assetRes.data);
      
      // Fetch complete history
      const historyRes = await axios.get(`/api/assets/${assetId}/history`);
      const historyData = historyRes.data;
      
      // Combine and normalize all events
      const allEvents = historyData.events || [];
      
      // Calculate statistics
      const assignments = allEvents.filter(e => 
        e.event_type === 'ASSIGNED' || e.action_type === 'ASSET_ASSIGNED'
      );
      
      const repairs = allEvents.filter(e => 
        e.event_type === 'MAINTENANCE_STARTED' || 
        e.event_type === 'MAINTENANCE_COMPLETED' ||
        e.type === 'temp_assignment'
      );
      
      const replacements = allEvents.filter(e => 
        e.event_type === 'REPLACED' || e.action_type === 'ASSET_REPLACED'
      );
      
      const returns = allEvents.filter(e => 
        e.event_type === 'RETURNED' || e.action_type === 'ASSET_RETURNED'
      );
      
      setStats({
        totalEvents: allEvents.length,
        assignments: assignments.length,
        repairs: repairs.length,
        replacements: replacements.length,
        returns: returns.length,
        currentStatus: assetRes.data.status,
        currentEmployee: assetRes.data.emp_id ? {
          id: assetRes.data.emp_id,
          name: assetRes.data.employee_name
        } : null,
        purchaseDate: assetRes.data.purchase_date,
        warrantyStatus: calculateWarrantyStatus(assetRes.data),
        lastActivity: allEvents.length > 0 ? allEvents[0] : null
      });
      
      setEvents(allEvents);
      
    } catch (error) {
      console.error('Error fetching lifecycle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWarrantyStatus = (asset) => {
    if (!asset.warranty_end_date) return { status: 'N/A', color: 'secondary' };
    
    const endDate = new Date(asset.warranty_end_date);
    const today = new Date();
    const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'Expired', color: 'danger', days: diffDays };
    } else if (diffDays <= 90) {
      return { status: 'Expiring Soon', color: 'warning', days: diffDays };
    } else {
      return { status: 'Active', color: 'success', days: diffDays };
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...events];
    
    // Apply filter
    if (filterType !== 'all') {
      filtered = filtered.filter(event => {
        switch (filterType) {
          case 'assignments':
            return event.event_type === 'ASSIGNED' || event.event_type === 'REASSIGNED' || 
                   event.action_type === 'ASSET_ASSIGNED' || event.action_type === 'ASSET_REASSIGNED';
          case 'repairs':
            return event.event_type === 'MAINTENANCE_STARTED' || event.event_type === 'MAINTENANCE_COMPLETED' ||
                   event.type === 'temp_assignment';
          case 'returns':
            return event.event_type === 'RETURNED' || event.action_type === 'ASSET_RETURNED';
          case 'transfers':
            return event.event_type === 'REASSIGNED' || event.action_type === 'ASSET_REASSIGNED';
          case 'warranty':
            return event.event_type === 'WARRANTY_CLAIM' || event.action_type === 'WARRANTY_CLAIM';
          case 'replacements':
            return event.event_type === 'REPLACED' || event.action_type === 'ASSET_REPLACED';
          default:
            return true;
        }
      });
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event => {
        const searchableText = [
          event.event_type,
          event.action_type,
          event.to_employee,
          event.from_employee,
          event.employee_name,
          event.reason,
          event.remarks,
          event.performed_by
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(term);
      });
    }
    
    // Apply sort
    if (sortOrder === 'asc') {
      filtered.reverse();
    }
    
    setFilteredEvents(filtered);
  };

  const getEventIcon = (event) => {
    const typeKey = event.event_type || event.action_type;
    const icons = {
      'PROCURED': 'cart-check',
      'ASSIGNED': 'person-check',
      'RETURNED': 'arrow-return-left',
      'REASSIGNED': 'arrow-left-right',
      'TEMP_ASSIGNED': 'clock-history',
      'MAINTENANCE_STARTED': 'tools',
      'MAINTENANCE_COMPLETED': 'check-circle',
      'REPLACED': 'arrow-repeat',
      'RETIRED': 'archive',
      'STATUS_CHANGED': 'toggle-on',
      'ASSET_CREATED': 'plus-circle',
      'ASSET_ASSIGNED': 'person-check',
      'ASSET_RETURNED': 'arrow-return-left',
      'ASSET_REASSIGNED': 'arrow-left-right',
      'ASSET_REPLACED': 'arrow-repeat',
      'WARRANTY_CLAIM': 'shield-check',
      'TEMP_ASSIGNMENT_CREATED': 'clock-history',
      'TEMP_ASSIGNMENT_COMPLETED': 'check-circle'
    };
    return icons[typeKey] || 'circle';
  };

  const getEventColor = (event) => {
    const typeKey = event.event_type || event.action_type;
    const colors = {
      'PROCURED': 'success',
      'ASSIGNED': 'primary',
      'RETURNED': 'info',
      'REASSIGNED': 'warning',
      'TEMP_ASSIGNED': 'info',
      'MAINTENANCE_STARTED': 'danger',
      'MAINTENANCE_COMPLETED': 'success',
      'REPLACED': 'warning',
      'RETIRED': 'secondary',
      'STATUS_CHANGED': 'info',
      'ASSET_CREATED': 'success',
      'ASSET_ASSIGNED': 'primary',
      'ASSET_RETURNED': 'info',
      'ASSET_REASSIGNED': 'warning',
      'ASSET_REPLACED': 'warning',
      'WARRANTY_CLAIM': 'danger',
      'TEMP_ASSIGNMENT_CREATED': 'info',
      'TEMP_ASSIGNMENT_COMPLETED': 'success'
    };
    return colors[typeKey] || 'secondary';
  };

  const getEventTitle = (event) => {
    if (event.type === 'lifecycle') {
      const titles = {
        'PROCURED': 'Purchased',
        'ASSIGNED': 'Assigned to Employee',
        'RETURNED': 'Returned to Inventory',
        'REASSIGNED': 'Reassigned',
        'TEMP_ASSIGNED': 'Temporary Assignment',
        'MAINTENANCE_STARTED': 'Repair Started',
        'MAINTENANCE_COMPLETED': 'Repair Completed',
        'REPLACED': 'Asset Replaced',
        'RETIRED': 'Retired',
        'STATUS_CHANGED': 'Status Changed'
      };
      return titles[event.event_type] || event.event_type;
    }
    
    if (event.type === 'audit') {
      const titles = {
        'ASSET_CREATED': 'Added to Inventory',
        'ASSET_ASSIGNED': 'Assigned to Employee',
        'ASSET_RETURNED': 'Returned to Inventory',
        'ASSET_REASSIGNED': 'Reassigned',
        'ASSET_REPLACED': 'Replaced',
        'STATUS_CHANGED': 'Status Changed',
        'WARRANTY_CLAIM': 'Warranty Claim',
        'TEMP_ASSIGNMENT_CREATED': 'Temporary Assignment',
        'TEMP_ASSIGNMENT_COMPLETED': 'Temp Assignment Completed'
      };
      return titles[event.action_type] || event.action_type?.replace(/_/g, ' ');
    }
    
    if (event.type === 'temp_assignment') {
      return event.sub_type === 'original' 
        ? 'Sent for Repair (Loaner Assigned)'
        : 'Used as Temporary Replacement';
    }
    
    return 'Event';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Asset Lifecycle Timeline', 14, 20);
    
    // Asset Info
    doc.setFontSize(12);
    doc.text(`Asset: ${asset.asset_name}`, 14, 30);
    doc.text(`Serial: ${asset.serial_number}`, 14, 37);
    doc.text(`Status: ${asset.status}`, 14, 44);
    
    // Timeline data
    const tableData = filteredEvents.map(event => [
      formatDateTime(event.date || event.event_date || event.timestamp),
      getEventTitle(event),
      event.to_employee || event.employee_name || '—',
      event.reason || event.remarks || '—',
      event.performed_by || '—'
    ]);
    
    doc.autoTable({
      startY: 50,
      head: [['Date & Time', 'Event', 'Employee', 'Details', 'Performed By']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 9 }
    });
    
    doc.save(`${asset.asset_name}_lifecycle_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    const headers = ['Date & Time', 'Event Type', 'Employee', 'Details', 'Performed By', 'Status'];
    const rows = filteredEvents.map(event => [
      formatDateTime(event.date || event.event_date || event.timestamp),
      getEventTitle(event),
      event.to_employee || event.employee_name || '',
      event.reason || event.remarks || '',
      event.performed_by || '',
      event.to_status || event.status || ''
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${asset.asset_name}_lifecycle_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const printTimeline = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Asset not found
      </div>
    );
  }

  return (
    <div className="inventory-lifecycle">
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
            <h2 className="fw-bold mb-0">
              <i className="bi bi-clock-history me-2"></i>
              Complete Lifecycle Timeline
            </h2>
          </div>
          <div className="d-flex align-items-center gap-3">
            <h5 className="mb-0 text-muted">{asset.asset_name}</h5>
            <code className="text-muted">{asset.serial_number}</code>
            <span className={`badge bg-${getEventColor({ event_type: asset.status })}`}>
              {asset.status}
            </span>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={exportToPDF} className="btn btn-sm btn-outline-danger" title="Export to PDF">
            <i className="bi bi-file-pdf"></i>
          </button>
          <button onClick={exportToExcel} className="btn btn-sm btn-outline-success" title="Export to Excel">
            <i className="bi bi-file-excel"></i>
          </button>
          <button onClick={printTimeline} className="btn btn-sm btn-outline-secondary" title="Print">
            <i className="bi bi-printer"></i>
          </button>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="table-card text-center">
            <div className="text-muted small mb-1">Current Status</div>
            <div className="fw-bold fs-5">
              <span className={`badge bg-${getEventColor({ event_type: stats.currentStatus })}`}>
                {stats.currentStatus}
              </span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="table-card text-center">
            <div className="text-muted small mb-1">Current Employee</div>
            <div className="fw-bold">{stats.currentEmployee ? stats.currentEmployee.name : 'Unassigned'}</div>
            <div className="text-muted small">{stats.currentEmployee ? stats.currentEmployee.id : '—'}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="table-card text-center">
            <div className="text-muted small mb-1">Purchase Date</div>
            <div className="fw-bold">{stats.purchaseDate || '—'}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="table-card text-center">
            <div className="text-muted small mb-1">Warranty Status</div>
            <div>
              <span className={`badge bg-${stats.warrantyStatus?.color}`}>
                {stats.warrantyStatus?.status}
              </span>
            </div>
            {stats.warrantyStatus?.days > 0 && (
              <div className="text-muted small">{stats.warrantyStatus.days} days left</div>
            )}
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-2">
          <div className="table-card text-center">
            <div className="text-primary fw-bold fs-4">{stats.assignments}</div>
            <div className="text-muted small">Assignments</div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="table-card text-center">
            <div className="text-danger fw-bold fs-4">{stats.repairs}</div>
            <div className="text-muted small">Repairs</div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="table-card text-center">
            <div className="text-warning fw-bold fs-4">{stats.replacements}</div>
            <div className="text-muted small">Replacements</div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="table-card text-center">
            <div className="text-info fw-bold fs-4">{stats.returns}</div>
            <div className="text-muted small">Returns</div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="table-card text-center">
            <div className="text-secondary fw-bold fs-4">{stats.totalEvents}</div>
            <div className="text-muted small">Total Events</div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="table-card text-center">
            <div className="text-muted small mb-1">Last Activity</div>
            <div className="small fw-600">
              {stats.lastActivity ? formatDateTime(stats.lastActivity.date || stats.lastActivity.event_date || stats.lastActivity.timestamp).split(',')[0] : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="table-card mb-3">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label small fw-600">Search Timeline</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by event type, employee, date, or remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
          <div className="col-md-4">
            <label className="form-label small fw-600">Filter by Event Type</label>
            <select 
              className="form-select" 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Events ({events.length})</option>
              <option value="assignments">Assignments</option>
              <option value="repairs">Repairs</option>
              <option value="returns">Returns</option>
              <option value="transfers">Transfers</option>
              <option value="warranty">Warranty</option>
              <option value="replacements">Replacements</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-600">Sort Order</label>
            <select 
              className="form-select" 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="table-card">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
            <p className="text-muted">No events found</p>
            <small className="text-muted">Try adjusting your filters or search</small>
          </div>
        ) : (
          <div className="timeline-vertical">
            {filteredEvents.map((event, index) => (
              <div key={index} className="timeline-item-vertical">
                <div className="timeline-marker-vertical">
                  <div className={`timeline-icon-badge bg-${getEventColor(event)}`}>
                    <i className={`bi bi-${getEventIcon(event)}`}></i>
                  </div>
                </div>
                <div className="timeline-content-vertical">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="fw-bold mb-1">{getEventTitle(event)}</h6>
                      <div className="text-muted small">
                        <i className="bi bi-calendar me-1"></i>
                        {formatDateTime(event.date || event.event_date || event.timestamp)}
                      </div>
                    </div>
                    <span className={`badge bg-${getEventColor(event)}`}>
                      {event.event_type || event.action_type}
                    </span>
                  </div>
                  
                  <div className="event-details">
                    {(event.to_employee || event.employee_name) && (
                      <div className="detail-row">
                        <i className="bi bi-person text-primary me-2"></i>
                        <strong>Employee:</strong> {event.to_employee || event.employee_name}
                        {(event.to_employee_id || event.employee_id) && (
                          <span className="text-muted ms-2">({event.to_employee_id || event.employee_id})</span>
                        )}
                      </div>
                    )}
                    
                    {event.from_employee && event.from_employee !== event.to_employee && (
                      <div className="detail-row">
                        <i className="bi bi-arrow-left-right text-warning me-2"></i>
                        <strong>From:</strong> {event.from_employee}
                      </div>
                    )}
                    
                    {event.location && (
                      <div className="detail-row">
                        <i className="bi bi-geo-alt text-info me-2"></i>
                        <strong>Location:</strong> {event.location}
                      </div>
                    )}
                    
                    {(event.from_status && event.to_status) && (
                      <div className="detail-row">
                        <i className="bi bi-toggle-on text-secondary me-2"></i>
                        <strong>Status Change:</strong> {event.from_status} → {event.to_status}
                      </div>
                    )}
                    
                    {(event.reason || event.remarks) && (
                      <div className="detail-row">
                        <i className="bi bi-chat-left-text text-muted me-2"></i>
                        <strong>Details:</strong> {event.reason || event.remarks}
                      </div>
                    )}
                    
                    {event.performed_by && (
                      <div className="detail-row text-muted small">
                        <i className="bi bi-person-circle me-2"></i>
                        Performed by: {event.performed_by}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 d-flex gap-2 justify-content-center">
        <Link 
          to={`/inventory/detail/${assetId}`}
          className="btn btn-outline-primary"
        >
          <i className="bi bi-box-seam me-2"></i>
          Back to Inventory Detail
        </Link>
        <Link 
          to={`/assets/view/${assetId}`}
          className="btn btn-outline-secondary"
        >
          <i className="bi bi-eye me-2"></i>
          View in Operations
        </Link>
      </div>
    </div>
  );
}

export default InventoryLifecycle;
