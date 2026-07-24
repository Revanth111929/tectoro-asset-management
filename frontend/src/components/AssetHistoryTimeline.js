import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AssetHistoryTimeline.css';

function AssetHistoryTimeline({ assetId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [asset, setAsset] = useState(null);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all'); // all, assignments, repairs, temp

  useEffect(() => {
    if (assetId) {
      fetchHistory();
    }
  }, [assetId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/assets/${assetId}/history`);
      setAsset(response.data.asset);
      setHistory(response.data.history);
      setStats({
        total: response.data.total_events,
        lifecycle: response.data.lifecycle_events_count,
        audits: response.data.audit_logs_count,
        temp_assignments: response.data.temp_assignments_count,
      });
    } catch (error) {
      console.error('Error fetching asset history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (event) => {
    if (event.type === 'lifecycle') {
      const icons = {
        'PROCURED': '📦',
        'ASSIGNED': '👤',
        'RETURNED': '🔄',
        'REASSIGNED': '🔁',
        'TEMP_ASSIGNED': '⏰',
        'MAINTENANCE_STARTED': '🔧',
        'MAINTENANCE_COMPLETED': '✅',
        'REPLACED': '🔄',
        'RETIRED': '📴',
        'STATUS_CHANGED': '📊',
      };
      return icons[event.event_type] || '📋';
    }
    
    if (event.type === 'audit') {
      const icons = {
        'ASSET_CREATED': '🆕',
        'ASSET_ASSIGNED': '👤',
        'ASSET_RETURNED': '🔄',
        'ASSET_REASSIGNED': '🔁',
        'STATUS_CHANGED': '📊',
        'TEMP_ASSIGNMENT_CREATED': '⏰',
        'TEMP_ASSIGNMENT_COMPLETED': '✅',
        'ASSET_REPLACED': '🔄',
      };
      return icons[event.action_type] || '📝';
    }
    
    if (event.type === 'temp_assignment') {
      return event.sub_type === 'original' ? '🔧' : '⏰';
    }
    
    return '📋';
  };

  const getEventColor = (event) => {
    if (event.type === 'lifecycle') {
      const colors = {
        'PROCURED': '#10b981',
        'ASSIGNED': '#3b82f6',
        'RETURNED': '#8b5cf6',
        'REASSIGNED': '#f59e0b',
        'TEMP_ASSIGNED': '#06b6d4',
        'MAINTENANCE_STARTED': '#ef4444',
        'MAINTENANCE_COMPLETED': '#10b981',
        'REPLACED': '#f59e0b',
        'RETIRED': '#94a3b8',
        'STATUS_CHANGED': '#8b5cf6',
      };
      return colors[event.event_type] || '#94a3b8';
    }
    
    if (event.type === 'audit') {
      const colors = {
        'ASSET_CREATED': '#10b981',
        'ASSET_ASSIGNED': '#3b82f6',
        'ASSET_RETURNED': '#8b5cf6',
        'ASSET_REASSIGNED': '#f59e0b',
        'STATUS_CHANGED': '#8b5cf6',
        'TEMP_ASSIGNMENT_CREATED': '#06b6d4',
        'TEMP_ASSIGNMENT_COMPLETED': '#10b981',
        'ASSET_REPLACED': '#f59e0b',
      };
      return colors[event.action_type] || '#94a3b8';
    }
    
    return '#06b6d4';
  };

  const getEventTitle = (event) => {
    if (event.type === 'lifecycle') {
      const titles = {
        'PROCURED': 'Added to Inventory',
        'ASSIGNED': 'Assigned to Employee',
        'RETURNED': 'Returned to Inventory',
        'REASSIGNED': 'Reassigned to New Employee',
        'TEMP_ASSIGNED': 'Temporary Assignment',
        'MAINTENANCE_STARTED': 'Sent for Repair',
        'MAINTENANCE_COMPLETED': 'Repair Completed',
        'REPLACED': 'Asset Replaced',
        'RETIRED': 'Retired',
        'STATUS_CHANGED': 'Status Changed',
      };
      return titles[event.event_type] || event.event_type;
    }
    
    if (event.type === 'audit') {
      return event.action_type.replace(/_/g, ' ');
    }
    
    if (event.type === 'temp_assignment') {
      return event.sub_type === 'original' 
        ? 'Sent for Repair (Temp Device Assigned)'
        : 'Used as Temporary Replacement';
    }
    
    return 'Event';
  };

  const getEventDetails = (event) => {
    if (event.type === 'lifecycle') {
      const details = [];
      
      if (event.to_employee) {
        details.push(`👤 ${event.to_employee}`);
      }
      
      if (event.from_employee && event.to_employee && event.from_employee !== event.to_employee) {
        details.push(`From: ${event.from_employee}`);
      }
      
      if (event.from_status && event.to_status) {
        details.push(`${event.from_status} → ${event.to_status}`);
      }
      
      if (event.reason) {
        details.push(`💬 ${event.reason}`);
      }
      
      return details;
    }
    
    if (event.type === 'audit') {
      const details = [];
      
      if (event.employee_name) {
        details.push(`👤 ${event.employee_name}`);
      }
      
      if (event.old_value && event.new_value) {
        details.push(`${event.old_value} → ${event.new_value}`);
      }
      
      if (event.remarks) {
        details.push(`💬 ${event.remarks}`);
      }
      
      return details;
    }
    
    if (event.type === 'temp_assignment') {
      const details = [];
      
      details.push(`👤 ${event.employee_name}`);
      
      if (event.sub_type === 'original') {
        details.push(`Loaner: ${event.temp_asset_name}`);
      } else {
        details.push(`Replacing: ${event.original_asset_name}`);
      }
      
      details.push(`💬 ${event.reason}`);
      
      if (event.status === 'Active') {
        details.push(`⏰ Expected: ${formatDate(event.expected_return)}`);
      } else if (event.actual_return) {
        details.push(`✅ Returned: ${formatDate(event.actual_return)}`);
      }
      
      return details;
    }
    
    return [];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredHistory = () => {
    if (filter === 'all') return history;
    
    if (filter === 'assignments') {
      return history.filter(e => 
        (e.type === 'lifecycle' && ['ASSIGNED', 'RETURNED', 'REASSIGNED'].includes(e.event_type)) ||
        (e.type === 'audit' && ['ASSET_ASSIGNED', 'ASSET_RETURNED', 'ASSET_REASSIGNED'].includes(e.action_type))
      );
    }
    
    if (filter === 'repairs') {
      return history.filter(e => 
        (e.type === 'lifecycle' && ['MAINTENANCE_STARTED', 'MAINTENANCE_COMPLETED'].includes(e.event_type)) ||
        (e.type === 'temp_assignment')
      );
    }
    
    if (filter === 'temp') {
      return history.filter(e => e.type === 'temp_assignment');
    }
    
    return history;
  };

  const filteredHistory = getFilteredHistory();

  if (loading) {
    return (
      <div className="asset-history-timeline">
        <div className="history-header">
          <h3>Asset History</h3>
          {onClose && (
            <button onClick={onClose} className="btn-close-history">
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="asset-history-timeline">
      {/* Header */}
      <div className="history-header">
        <div>
          <h3>
            <i className="bi bi-clock-history me-2"></i>
            Asset History Timeline
          </h3>
          {asset && (
            <div className="asset-info">
              <span className="asset-name">{asset.asset_name}</span>
              <span className="asset-serial">SN: {asset.serial_number}</span>
              <span className={`badge bg-${asset.status === 'Assigned' ? 'success' : asset.status === 'Available' ? 'primary' : 'warning'}`}>
                {asset.status}
              </span>
            </div>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="btn-close-history" title="Close">
            <i className="bi bi-x-lg"></i>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="history-stats">
        <div className="stat-item">
          <div className="stat-value">{stats.total || 0}</div>
          <div className="stat-label">Total Events</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.lifecycle || 0}</div>
          <div className="stat-label">Lifecycle Events</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.temp_assignments || 0}</div>
          <div className="stat-label">Temp Assignments</div>
        </div>
      </div>

      {/* Filters */}
      <div className="history-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Events ({history.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'assignments' ? 'active' : ''}`}
          onClick={() => setFilter('assignments')}
        >
          Assignments
        </button>
        <button 
          className={`filter-btn ${filter === 'repairs' ? 'active' : ''}`}
          onClick={() => setFilter('repairs')}
        >
          Repairs
        </button>
        <button 
          className={`filter-btn ${filter === 'temp' ? 'active' : ''}`}
          onClick={() => setFilter('temp')}
        >
          Temporary
        </button>
      </div>

      {/* Timeline */}
      <div className="timeline-container">
        {filteredHistory.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-inbox" style={{fontSize: '3rem', color: '#ccc'}}></i>
            <p className="text-muted mt-2">No history found</p>
            <small>Try selecting a different filter</small>
          </div>
        ) : (
          <div className="timeline">
            {filteredHistory.map((event, index) => (
              <div key={index} className="timeline-item">
                <div 
                  className="timeline-marker" 
                  style={{backgroundColor: getEventColor(event)}}
                >
                  <span className="timeline-icon">{getEventIcon(event)}</span>
                </div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <h4 className="timeline-title">{getEventTitle(event)}</h4>
                    <span className="timeline-date">{formatDate(event.date)}</span>
                  </div>
                  <div className="timeline-details">
                    {getEventDetails(event).map((detail, i) => (
                      <div key={i} className="detail-item">{detail}</div>
                    ))}
                  </div>
                  {event.performed_by && (
                    <div className="timeline-footer">
                      <small className="text-muted">
                        <i className="bi bi-person-circle"></i> {event.performed_by}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AssetHistoryTimeline;
