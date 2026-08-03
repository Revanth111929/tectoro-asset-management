// InventoryCategory.js - Filtered inventory view by category
import React, { useState, useEffect, useCallback } from 'react';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { useScrollRestoration, markLastSelected } from '../hooks/useScrollRestoration';
import { Link, useParams } from 'react-router-dom';
import { assetAPI } from '../services/api';
import { canPerform } from '../utils/permissions';

const CATEGORY_CONFIG = {
  laptop: {
    title: 'Laptop Inventory',
    icon: 'bi-laptop',
    category: 'Laptop',
    columns: ['emp_id', 'employee_name', 'brand_name', 'model_name', 'serial_number', 'processor', 'ram', 'os', 'status'],
    labels: ['EMP ID', 'Employee', 'Brand', 'Model', 'Serial Number', 'Processor', 'RAM', 'OS', 'Status']
  },
  cpu: {
    title: 'CPU Inventory',
    icon: 'bi-cpu',
    category: 'CPU',
    columns: ['emp_id', 'employee_name', 'brand_name', 'model_name', 'serial_number', 'processor', 'ram', 'graphics_card', 'status'],
    labels: ['EMP ID', 'Employee', 'Brand', 'Model', 'Serial Number', 'Processor', 'RAM', 'Graphics Card', 'Status']
  },
  monitor: {
    title: 'Monitor Inventory',
    icon: 'bi-display',
    category: 'Monitor',
    columns: ['emp_id', 'employee_name', 'brand_name', 'model_name', 'serial_number', 'screen_size', 'resolution', 'refresh_rate', 'status'],
    labels: ['EMP ID', 'Employee', 'Brand', 'Model', 'Serial Number', 'Screen Size', 'Resolution', 'Refresh Rate', 'Status']
  },
  printer: {
    title: 'Printer Inventory',
    icon: 'bi-printer',
    category: 'Printer',
    columns: ['brand_name', 'model_name', 'serial_number', 'printer_type', 'color_or_mono', 'network_enabled', 'location', 'status'],
    labels: ['Brand', 'Model', 'Serial Number', 'Type', 'Color/Mono', 'Network', 'Location', 'Status']
  },
  phone: {
    title: 'Phone Inventory',
    icon: 'bi-phone',
    category: 'Phone',
    columns: ['emp_id', 'employee_name', 'brand_name', 'model_name', 'serial_number', 'imei_1', 'imei_2', 'mobile_number', 'status'],
    labels: ['EMP ID', 'Employee', 'Brand', 'Model', 'Serial Number', 'IMEI 1', 'IMEI 2', 'Mobile Number', 'Status']
  },
  server: {
    title: 'Server Inventory',
    icon: 'bi-hdd-rack',
    category: 'Server',
    columns: ['brand_name', 'model_name', 'serial_number', 'processor', 'ram', 'storage_capacity', 'ip_address', 'rack_location', 'status'],
    labels: ['Brand', 'Model', 'Serial Number', 'Processor', 'RAM', 'Storage', 'IP Address', 'Rack Location', 'Status']
  },
  mouse: {
    title: 'Mouse Inventory',
    icon: 'bi-mouse',
    category: 'Mouse',
    columns: ['emp_id', 'employee_name', 'brand_name', 'model_name', 'serial_number', 'connection_type', 'status'],
    labels: ['EMP ID', 'Employee', 'Brand', 'Model', 'Serial Number', 'Connection Type', 'Status']
  },
  headphones: {
    title: 'Headphones Inventory',
    icon: 'bi-headphones',
    category: 'Headphones',
    columns: ['emp_id', 'employee_name', 'brand_name', 'model_name', 'serial_number', 'connection_type', 'noise_cancellation', 'status'],
    labels: ['EMP ID', 'Employee', 'Brand', 'Model', 'Serial Number', 'Connection', 'Noise Cancellation', 'Status']
  },
  'hard-disk': {
    title: 'Hard Disk Inventory',
    icon: 'bi-device-hdd',
    category: 'Hard Disk',
    columns: ['emp_id', 'employee_name', 'brand_name', 'model_name', 'serial_number', 'storage_capacity', 'storage_type', 'interface_type', 'status'],
    labels: ['EMP ID', 'Employee', 'Brand', 'Model', 'Serial Number', 'Capacity', 'Type', 'Interface', 'Status']
  },
  ups: {
    title: 'UPS Inventory',
    icon: 'bi-lightning-charge',
    category: 'UPS',
    columns: ['brand_name', 'model_name', 'serial_number', 'capacity_va', 'battery_type', 'backup_time', 'location', 'status'],
    labels: ['Brand', 'Model', 'Serial Number', 'Capacity (VA)', 'Battery Type', 'Backup Time', 'Location', 'Status']
  },
  'laptop-bag': {
    title: 'Laptop Bag Inventory',
    icon: 'bi-bag',
    category: 'Laptop Bag',
    columns: ['emp_id', 'employee_name', 'brand_name', 'model_name', 'size_compatibility', 'color', 'status'],
    labels: ['EMP ID', 'Employee', 'Brand', 'Model', 'Size', 'Color', 'Status']
  },
  other: {
    title: 'Other Assets Inventory',
    icon: 'bi-three-dots',
    category: 'Other',
    columns: ['emp_id', 'employee_name', 'asset_name', 'brand_name', 'model_name', 'serial_number', 'custom_description', 'status'],
    labels: ['EMP ID', 'Employee', 'Asset Name', 'Brand', 'Model', 'Serial Number', 'Description', 'Status']
  }
};

function InventoryCategory() {
  const { type } = useParams();
  const config = CATEGORY_CONFIG[type];
  
  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { values: filterValues, setValue: setFilterValue, buildUrl } = useUrlFilters({
    search: '', status: '', page: 1
  });
  const search = filterValues.search;
  const status = filterValues.status;
  const page   = filterValues.page;
  const setSearch = function(v) { setFilterValue('search', v, { resetPage: true, replace: true }); };
  const setStatus  = function(v) { setFilterValue('status', v, { resetPage: true }); };
  const setPage    = function(v) {
    const nextPage = typeof v === 'function' ? v(page) : v;
    setFilterValue('page', nextPage);
  };
  const listUrl = buildUrl(`/inventory/${type}`);
  useScrollRestoration(listUrl, !loading);
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('Available');

  const fetchAssets = useCallback(() => {
    if (!config) return; // Don't fetch if config is invalid
    
    setLoading(true);
    const params = { 
      category: config.category, 
      search, 
      status, 
      page, 
      per_page: 20 
    };
    
    assetAPI.getAll(params)
      .then(res => {
        setAssets(res.data.assets || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [config, search, status, page]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);
  
  // Clear selection when page changes
  useEffect(() => { setSelectedIds([]); }, [page]);
  
  // If category not found, show error message
  if (!config) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-exclamation-triangle fs-1 text-warning d-block mb-3"></i>
        <h3>Category Not Found</h3>
        <p className="text-muted">The category "{type}" does not exist.</p>
      </div>
    );
  }

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === assets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(assets.map(a => a.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;

    if (bulkAction === 'delete') {
      if (!window.confirm(`Delete ${selectedIds.length} selected items? This cannot be undone.`)) return;
      
      setBulkProcessing(true);
      try {
        await Promise.all(selectedIds.map(id => assetAPI.delete(id)));
        setSelectedIds([]);
        fetchAssets();
        alert(`${selectedIds.length} items deleted successfully`);
      } catch {
        alert('Failed to delete some items');
      } finally {
        setBulkProcessing(false);
        setBulkAction('');
      }
    } else if (bulkAction === 'export') {
      // Export selected assets as CSV
      const selectedAssets = assets.filter(a => selectedIds.includes(a.id));
      const csv = [
        config.labels,
        ...selectedAssets.map(a => config.columns.map(col => a[col] || ''))
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_inventory_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      setBulkAction('');
    } else if (bulkAction === 'change-status') {
      setShowStatusModal(true);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || selectedIds.length === 0) return;
    
    setBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    
    try {
      // Update assets one by one to catch individual errors
      for (const id of selectedIds) {
        try {
          await assetAPI.update(id, { status: newStatus });
          successCount++;
        } catch (error) {
          failCount++;
          const errorMsg = error.response?.data?.error || error.message;
          errors.push(`Item ID ${id}: ${errorMsg}`);
        }
      }
      
      setSelectedIds([]);
      setShowStatusModal(false);
      fetchAssets();
      
      if (failCount === 0) {
        alert(`✓ Successfully updated ${successCount} items to ${newStatus}`);
      } else {
        alert(`Updated ${successCount} items successfully.\n${failCount} failed:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`);
      }
    } catch (error) {
      alert('Failed to update items. Please try again.');
    } finally {
      setBulkProcessing(false);
      setBulkAction('');
    }
  };

  const statusBadge = (s) => {
    const map = { Available: 'success', Assigned: 'primary', Maintenance: 'warning', Retired: 'secondary' };
    return <span className={`badge bg-${map[s] || 'secondary'}`}>{s}</span>;
  };

  const getValue = (asset, col) => {
    const val = asset[col];
    if (col === 'status') return statusBadge(val);
    if (col === 'testing_status') {
      if (!val) return '—';
      const color = val === 'Passed' ? 'success' : val === 'Failed' ? 'danger' : 'warning';
      return <span className={`badge bg-${color}`}>{val}</span>;
    }
    return val || '—';
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className={`bi ${config.icon} me-2`}></i>{config.title}
          </h2>
          <p className="text-muted mb-0">{total} items in inventory</p>
        </div>
        {canPerform('create') && (
          <Link to="/assets/add" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>Add New
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="table-card mb-3">
        <div className="row g-2">
          <div className="col-md-8">
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
          <div className="col-md-4">
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Assigned">Assigned</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Retired">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="d-flex justify-content-end align-items-center mb-2">
          <div className="d-flex gap-2 align-items-center">
            <span className="badge bg-primary">{selectedIds.length} selected</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={bulkAction}
              onChange={e => setBulkAction(e.target.value)}
            >
              <option value="">Bulk Actions</option>
              <option value="change-status">Change Status</option>
              {canPerform('delete') && <option value="delete">Delete Selected</option>}
              <option value="export">Export Selected</option>
            </select>
            <button
              className="btn btn-sm btn-primary"
              disabled={!bulkAction || bulkProcessing}
              onClick={handleBulkAction}
            >
              {bulkProcessing ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                'Apply'
              )}
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setSelectedIds([])}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-card">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : (
          <>
            <div className="table-responsive" style={{ maxHeight: "calc(100vh - 340px)", overflowY: "auto" }}>
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    {canPerform('bulkActions') && (
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedIds.length === assets.length && assets.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th>#</th>
                    {config.labels.map((label, idx) => <th key={idx}>{label}</th>)}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.length === 0 && (
                    <tr>
                      <td colSpan={config.labels.length + (canPerform('bulkActions') ? 3 : 2)} className="text-center py-5 text-muted">
                        <i className={`bi ${config.icon} fs-2 d-block mb-2`}></i>
                        No items found
                      </td>
                    </tr>
                  )}
                  {assets.map((a, idx) => (
                    <tr key={a.id}>
                      {canPerform('bulkActions') && (
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedIds.includes(a.id)}
                            onChange={() => toggleSelect(a.id)}
                          />
                        </td>
                      )}
                      <td className="text-muted small">{(page - 1) * 20 + idx + 1}</td>
                      {config.columns.map((col, cidx) => (
                        <td key={cidx}>{getValue(a, col)}</td>
                      ))}
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Link to={`/inventory/detail/${a.id}`} state={{ returnTo: listUrl }} onClick={() => markLastSelected(listUrl, a.id)} className="btn btn-outline-primary" title="Inventory Details">
                            <i className="bi bi-box-seam"></i>
                          </Link>
                          <Link to={`/assets/view/${a.id}`} state={{ returnTo: listUrl }} onClick={() => markLastSelected(listUrl, a.id)} className="btn btn-outline-secondary" title="View">
                            <i className="bi bi-eye"></i>
                          </Link>
                          {canPerform('edit') && (
                            <Link to={`/assets/edit/${a.id}`} state={{ returnTo: listUrl }} onClick={() => markLastSelected(listUrl, a.id)} className="btn btn-outline-secondary" title="Edit">
                              <i className="bi bi-pencil"></i>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <small className="text-muted">
                  Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
                </small>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(p => p - 1)}>‹</button>
                    </li>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                      <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                      </li>
                    ))}
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(p => p + 1)}>›</button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </>
        )}
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change Status for {selectedIds.length} Items</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowStatusModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <label className="form-label">Select New Status</label>
                <select 
                  className="form-select" 
                  value={newStatus} 
                  onChange={e => setNewStatus(e.target.value)}
                >
                  <option value="Available">Available</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Retired">Retired</option>
                </select>
                <div className="mt-3 text-muted small">
                  <i className="bi bi-info-circle me-1"></i>
                  This will update the status of all {selectedIds.length} selected items.
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleStatusChange}
                  disabled={bulkProcessing}
                >
                  {bulkProcessing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Update Status
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryCategory;

export { CATEGORY_CONFIG };
