// EmployeeAssetHistory.js - Complete Employee Asset History & Timeline (Read-Only)
// Shows every device an employee has ever used from day one until today
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './EmployeeAssetHistory.css';

function EmployeeAssetHistory() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [currentAssets, setCurrentAssets] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [statistics, setStatistics] = useState({});
  
  // Filters and search
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // desc = newest first
  
  useEffect(() => {
    fetchEmployeeHistory();
  }, [employeeId]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [events, filterType, searchTerm, sortOrder]);

  const fetchEmployeeHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch complete employee asset history
      const response = await employeeAPI.getAssetHistory(employeeId);
      const data = response.data;
      
      setEmployee(data.employee);
      setCurrentAssets(data.current_assets || []);
      setStatistics(data.statistics || {});
      setEvents(data.events || []);
      
    } catch (error) {
      console.error('Error fetching employee history:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...events];
    
    // Apply filter
    if (filterType !== 'all') {
      filtered = filtered.filter(event => {
        switch (filterType) {
          case 'assignments':
            return (event.event_type === 'ASSIGNED' || event.action_type === 'ASSET_ASSIGNED');
          case 'returns':
            return (event.event_type === 'RETURNED' || event.action_type === 'ASSET_RETURNED');
          case 'replacements':
            return event.type === 'replacement';
          case 'temp_assignments':
            return event.type === 'temp_assignment';
          case 'repairs':
            return (event.event_type === 'MAINTENANCE_STARTED' || 
                    event.event_type === 'MAINTENANCE_COMPLETED' ||
                    event.type === 'temp_assignment');
          case 'current':
            return currentAssets.some(a => a.id === event.asset_id);
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
          event.asset_name,
          event.asset_serial,
          event.category,
          event.brand_name,
          event.model_name,
          event.event_type,
          event.action_type,
          event.reason,
          event.remarks
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
    if (event.type === 'lifecycle') {
      const icons = {
        'ASSIGNED': 'person-check',
        'RETURNED': 'arrow-return-left',
        'REASSIGNED': 'arrow-left-right',
        'MAINTENANCE_STARTED': 'tools',
        'MAINTENANCE_COMPLETED': 'check-circle',
        'REPLACED': 'arrow-repeat',
      };
      return icons[event.event_type] || 'circle';
    }
    
    if (event.type === 'audit') {
      const icons = {
        'ASSET_ASSIGNED': 'person-check',
        'ASSET_RETURNED': 'arrow-return-left',
        'ASSET_REASSIGNED': 'arrow-left-right',
        'ASSET_REPLACED': 'arrow-repeat',
      };
      return icons[event.action_type] || 'circle';
    }
    
    if (event.type === 'temp_assignment') {
      return 'clock-history';
    }
    
    if (event.type === 'replacement') {
      return 'arrow-repeat';
    }
    
    return 'circle';
  };

  const getEventColor = (event) => {
    if (event.type === 'lifecycle') {
      const colors = {
        'ASSIGNED': 'primary',
        'RETURNED': 'info',
        'REASSIGNED': 'warning',
        'MAINTENANCE_STARTED': 'danger',
        'MAINTENANCE_COMPLETED': 'success',
        'REPLACED': 'warning',
      };
      return colors[event.event_type] || 'secondary';
    }
    
    if (event.type === 'audit') {
      const colors = {
        'ASSET_ASSIGNED': 'primary',
        'ASSET_RETURNED': 'info',
        'ASSET_REASSIGNED': 'warning',
        'ASSET_REPLACED': 'warning',
      };
      return colors[event.action_type] || 'secondary';
    }
    
    if (event.type === 'temp_assignment') {
      return 'info';
    }
    
    if (event.type === 'replacement') {
      return 'warning';
    }
    
    return 'secondary';
  };

  const getEventTitle = (event) => {
    if (event.type === 'lifecycle') {
      const titles = {
        'ASSIGNED': 'Assigned',
        'RETURNED': 'Returned',
        'REASSIGNED': 'Reassigned',
        'MAINTENANCE_STARTED': 'Sent for Repair',
        'MAINTENANCE_COMPLETED': 'Repair Completed',
        'REPLACED': 'Replaced',
      };
      return titles[event.event_type] || event.event_type;
    }
    
    if (event.type === 'audit') {
      const titles = {
        'ASSET_ASSIGNED': 'Asset Assigned',
        'ASSET_RETURNED': 'Asset Returned',
        'ASSET_REASSIGNED': 'Asset Reassigned',
        'ASSET_REPLACED': 'Asset Replaced',
      };
      return titles[event.action_type] || event.action_type?.replace(/_/g, ' ');
    }
    
    if (event.type === 'temp_assignment') {
      return event.sub_type === 'original' 
        ? 'Device Sent for Repair (Loaner Assigned)'
        : 'Temporary Replacement Device';
    }
    
    if (event.type === 'replacement') {
      return 'Permanent Device Replacement';
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

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Employee Asset History', 14, 20);
    
    // Employee Info
    doc.setFontSize(12);
    doc.text(`Employee: ${employee.employee_name}`, 14, 30);
    doc.text(`ID: ${employee.emp_id}`, 14, 37);
    doc.text(`Department: ${employee.department || '—'}`, 14, 44);
    
    // Timeline data
    const tableData = filteredEvents.map(event => [
      formatDateTime(event.date || event.timestamp),
      event.asset_name || '—',
      event.asset_serial || '—',
      event.category || '—',
      getEventTitle(event),
      event.reason || event.remarks || '—'
    ]);
    
    doc.autoTable({
      startY: 50,
      head: [['Date & Time', 'Asset Name', 'Serial', 'Category', 'Event', 'Details']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 8 }
    });
    
    doc.save(`${employee.employee_name}_asset_history_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    const headers = ['Date & Time', 'Asset Name', 'Serial Number', 'Category', 'Brand', 'Model', 'Event Type', 'Details'];
    const rows = filteredEvents.map(event => [
      formatDateTime(event.date || event.timestamp),
      event.asset_name || '',
      event.asset_serial || '',
      event.category || '',
      event.brand_name || '',
      event.model_name || '',
      getEventTitle(event),
      event.reason || event.remarks || ''
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${employee.employee_name}_asset_history_${new Date().toISOString().split('T')[0]}.csv`;
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

  if (!employee) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Employee not found
      </div>
    );
  }

  return (
    <div className="employee-asset-history">
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
              Employee Asset History
            </h2>
          </div>
          <div className="d-flex align-items-center gap-3">
            <h5 className="mb-0 text-muted">{employee.employee_name}</h5>
            <code className="text-muted">{employee.emp_id}</code>
            {employee.department && (
              <span className="badge bg-secondary">{employee.department}</span>
            )}
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
            <div className="text-primary fw-bold fs-3">{statistics.current_assigned_devices || 0}</div>
            <div className="text-muted small">Current Assigned Devices</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="table-card text-center">
            <div className="text-success fw-bold fs-3">{statistics.total_devices_used || 0}</div>
            <div className="text-muted small">Total Devices Used</div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="table-card text-center">
            <div className="text-info fw-bold fs-4">{statistics.total_assignments || 0}</div>
            <div className="text-muted small">Assignments</div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="table-card text-center">
            <div className="text-warning fw-bold fs-4">{statistics.total_replacements || 0}</div>
            <div className="text-muted small">Replacements</div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="table-card text-center">
            <div className="text-secondary fw-bold fs-4">{statistics.total_returns || 0}</div>
            <div className="text-muted small">Returns</div>
          </div>
        </div>
      </div>

      {/* Current Assigned Assets */}
      {currentAssets.length > 0 && (
        <div className="mb-4">
          <h5 className="fw-bold mb-3">
            <i className="bi bi-laptop me-2 text-primary"></i>
            Currently Assigned Devices
          </h5>
          <div className="row g-3">
            {currentAssets.map(asset => (
              <div key={asset.id} className="col-md-4">
                <Link 
                  to={`/inventory/detail/${asset.id}`}
                  className="text-decoration-none"
                >
                  <div className="table-card asset-card h-100">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="fw-bold text-primary">
                        <i className={`bi bi-${asset.category === 'Laptop' ? 'laptop' : asset.category === 'Monitor' ? 'display' : 'device-hdd'} me-1`}></i>
                        {asset.asset_name}
                      </div>
                      <span className={`badge bg-${asset.status === 'Assigned' ? 'primary' : 'secondary'}`}>
                        {asset.status}
                      </span>
                    </div>
                    <div className="small text-muted">
                      <div><strong>Category:</strong> {asset.category}</div>
                      <div><strong>Brand:</strong> {asset.brand_name || '—'}</div>
                      <div><strong>Model:</strong> {asset.model_name || '—'}</div>
                      <div><strong>Serial:</strong> <code>{asset.serial_number}</code></div>
                      <div><strong>Assigned:</strong> {formatDate(asset.date)}</div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

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
                placeholder="Search by asset name, serial, category, brand, or event..."
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
              <option value="current">Current Assets</option>
              <option value="assignments">Assignments</option>
              <option value="returns">Returns</option>
              <option value="replacements">Replacements</option>
              <option value="temp_assignments">Temporary Assignments</option>
              <option value="repairs">Repairs</option>
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

      {/* Employee Details Card */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="table-card">
            <h6 className="fw-bold mb-3 text-primary">
              <i className="bi bi-person me-2"></i>Employee Details
            </h6>
            <div className="small">
              <div className="mb-2"><strong>Name:</strong> {employee.employee_name}</div>
              <div className="mb-2"><strong>ID:</strong> <code>{employee.emp_id}</code></div>
              {employee.email && <div className="mb-2"><strong>Email:</strong> {employee.email}</div>}
              {employee.mobile_number && <div className="mb-2"><strong>Mobile:</strong> {employee.mobile_number}</div>}
              {employee.department && <div className="mb-2"><strong>Department:</strong> {employee.department}</div>}
              {employee.designation && <div className="mb-2"><strong>Designation:</strong> {employee.designation}</div>}
              {employee.location && <div className="mb-2"><strong>Location:</strong> {employee.location}</div>}
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="table-card">
            <h6 className="fw-bold mb-3 text-primary">
              <i className="bi bi-bar-chart me-2"></i>Asset Usage Statistics
            </h6>
            <div className="row g-3 small">
              <div className="col-6">
                <div className="text-muted mb-1">Total Devices Used</div>
                <div className="fs-5 fw-bold text-success">{statistics.total_devices_used || 0}</div>
              </div>
              <div className="col-6">
                <div className="text-muted mb-1">Currently Assigned</div>
                <div className="fs-5 fw-bold text-primary">{statistics.current_assigned_devices || 0}</div>
              </div>
              <div className="col-4">
                <div className="text-muted mb-1">Total Assignments</div>
                <div className="fs-6 fw-bold">{statistics.total_assignments || 0}</div>
              </div>
              <div className="col-4">
                <div className="text-muted mb-1">Total Returns</div>
                <div className="fs-6 fw-bold">{statistics.total_returns || 0}</div>
              </div>
              <div className="col-4">
                <div className="text-muted mb-1">Total Events</div>
                <div className="fs-6 fw-bold">{statistics.total_events || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Timeline */}
      <div className="table-card">
        <h5 className="fw-bold mb-4">
          <i className="bi bi-clock-history me-2 text-primary"></i>
          Complete Asset Timeline
        </h5>
        
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
                    <div className="flex-grow-1">
                      <h6 className="fw-bold mb-1">{getEventTitle(event)}</h6>
                      <div className="text-muted small mb-2">
                        <i className="bi bi-calendar me-1"></i>
                        {formatDateTime(event.date || event.timestamp)}
                      </div>
                    </div>
                    <span className={`badge bg-${getEventColor(event)}`}>
                      {event.category || 'Event'}
                    </span>
                  </div>
                  
                  {/* Asset Information */}
                  <div className="event-details">
                    <div className="detail-row">
                      <i className="bi bi-laptop text-primary me-2"></i>
                      <strong>Asset:</strong> 
                      <Link to={`/inventory/detail/${event.asset_id}`} className="ms-2 text-decoration-none">
                        {event.asset_name || '—'}
                      </Link>
                    </div>
                    
                    {event.asset_serial && (
                      <div className="detail-row">
                        <i className="bi bi-upc text-secondary me-2"></i>
                        <strong>Serial:</strong> <code className="ms-2">{event.asset_serial}</code>
                      </div>
                    )}
                    
                    {event.brand_name && (
                      <div className="detail-row">
                        <i className="bi bi-tag text-info me-2"></i>
                        <strong>Brand:</strong> {event.brand_name}
                        {event.model_name && <span className="ms-2">({event.model_name})</span>}
                      </div>
                    )}
                    
                    {/* Replacement specific details */}
                    {event.type === 'replacement' && event.old_asset_name && (
                      <div className="detail-row">
                        <i className="bi bi-arrow-repeat text-warning me-2"></i>
                        <strong>Old Device:</strong> {event.old_asset_name}
                        {event.old_asset_condition && (
                          <span className="badge bg-secondary ms-2">{event.old_asset_condition}</span>
                        )}
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
        <button 
          onClick={() => navigate('/employees')}
          className="btn btn-outline-secondary"
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Employees
        </button>
      </div>
    </div>
  );
}

export default EmployeeAssetHistory;
