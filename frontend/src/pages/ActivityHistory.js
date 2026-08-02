import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ActivityHistory.css';

const API_BASE_URL = '/api';

function ActivityHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action_type: '',
    date_from: '',
    date_to: '',
    search: '',
    page: 1,
    per_page: 50
  });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const response = await axios.get(`${API_BASE_URL}/audit-logs?${params}`);
      setLogs(response.data.logs || []);
      setTotal(response.data.total || 0);
      setPages(response.data.pages || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] && key !== 'page' && key !== 'per_page') {
        params.append(key, filters[key]);
      }
    });
    window.open(`${API_BASE_URL}/audit-logs/export?${params}`, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getActionBadge = (actionType) => {
    const colors = {
      'ASSET_CREATED': 'success',
      'ASSET_UPDATED': 'info',
      'ASSET_DELETED': 'danger',
      'ASSET_ASSIGNED': 'primary',
      'ASSET_RETURNED': 'secondary',
      'ASSET_REASSIGNED': 'warning',
      'STATUS_CHANGED': 'warning',
      'TEMP_ASSIGNMENT_CREATED': 'info',
      'TEMP_ASSIGNMENT_COMPLETED': 'success',
      'ASSET_REPLACED': 'primary',
      'EMPLOYEE_EXIT_INITIATED': 'warning',
      'EXIT_ASSET_COLLECTED': 'info',
      'EMPLOYEE_EXIT_COMPLETED': 'success'
    };
    const color = colors[actionType] || 'secondary';
    const displayName = actionType.replace(/_/g, ' ');
    return <span className={`badge bg-${color}`}>{displayName}</span>;
  };

  return (
    <div className="activity-history">
      <div className="page-header">
        <div>
          <h1><i className="bi bi-clock-history"></i> Activity History</h1>
          <p className="text-muted">Complete audit trail of all system activities</p>
        </div>
        <button onClick={exportToCSV} className="btn btn-primary">
          <i className="bi bi-download"></i> Export to CSV
        </button>
      </div>

      {/* Filters */}
      <div className="filters-card card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                placeholder="🔍 Search assets, employees, serial numbers..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                className="form-control"
              />
            </div>
            
            <div className="col-md-3">
              <select
                value={filters.action_type}
                onChange={(e) => setFilters({...filters, action_type: e.target.value, page: 1})}
                className="form-select"
              >
                <option value="">All Actions</option>
                <option value="ASSET_CREATED">Asset Created</option>
                <option value="ASSET_UPDATED">Asset Updated</option>
                <option value="ASSET_DELETED">Asset Deleted</option>
                <option value="ASSET_ASSIGNED">Asset Assigned</option>
                <option value="ASSET_RETURNED">Asset Returned</option>
                <option value="ASSET_REASSIGNED">Asset Reassigned</option>
                <option value="STATUS_CHANGED">Status Changed</option>
                <option value="TEMP_ASSIGNMENT_CREATED">Temp Assignment</option>
                <option value="ASSET_REPLACED">Asset Replaced</option>
                <option value="EMPLOYEE_EXIT_INITIATED">Exit Initiated</option>
              </select>
            </div>

            <div className="col-md-2">
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({...filters, date_from: e.target.value, page: 1})}
                className="form-control"
                placeholder="From Date"
              />
            </div>

            <div className="col-md-2">
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({...filters, date_to: e.target.value, page: 1})}
                className="form-control"
                placeholder="To Date"
              />
            </div>

            <div className="col-md-1">
              <button 
                onClick={() => setFilters({action_type: '', date_from: '', date_to: '', search: '', page: 1, per_page: 50})}
                className="btn btn-outline-secondary w-100"
                title="Clear filters"
              >
                <i className="bi bi-x-circle"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="results-info mb-3">
            <span className="badge bg-light text-dark">
              Showing {logs.length} of {total} results
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Asset</th>
                  <th>Serial Number</th>
                  <th>Employee</th>
                  <th>Field</th>
                  <th>Old Value</th>
                  <th>New Value</th>
                  <th>Performed By</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-4">
                      <i className="bi bi-inbox" style={{fontSize: '3rem', color: '#ccc'}}></i>
                      <p className="text-muted mt-2">No audit logs found</p>
                      <small>Try adjusting your filters or creating some assets</small>
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id}>
                      <td className="text-nowrap small">{formatDate(log.timestamp)}</td>
                      <td>{getActionBadge(log.action_type)}</td>
                      <td>{log.asset_name || '-'}</td>
                      <td className="text-muted small">{log.asset_serial || '-'}</td>
                      <td>{log.employee_name || '-'}</td>
                      <td className="text-muted small">{log.field_name || '-'}</td>
                      <td className="text-danger small">{log.old_value || '-'}</td>
                      <td className="text-success small">{log.new_value || '-'}</td>
                      <td>
                        <span className="badge bg-light text-dark">
                          <i className="bi bi-person"></i> {log.performed_by}
                        </span>
                      </td>
                      <td className="text-muted small">{log.ip_address || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="pagination-container">
              <nav>
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${filters.page === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setFilters({...filters, page: filters.page - 1})}
                      disabled={filters.page === 1}
                    >
                      <i className="bi bi-chevron-left"></i> Previous
                    </button>
                  </li>
                  
                  <li className="page-item active">
                    <span className="page-link">
                      Page {filters.page} of {pages}
                    </span>
                  </li>
                  
                  <li className={`page-item ${filters.page >= pages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setFilters({...filters, page: filters.page + 1})}
                      disabled={filters.page >= pages}
                    >
                      Next <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ActivityHistory;
