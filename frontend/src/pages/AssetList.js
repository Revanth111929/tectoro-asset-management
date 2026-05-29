// AssetList.js – Full asset table with search, filter, delete, warranty highlights
import { canPerform } from '../utils/permissions';
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { assetAPI } from '../services/api';

const CATEGORIES = ['Laptop', 'Desktop', 'Monitor', 'Printer', 'Phone', 'Server', 'Furniture', 'Mouse', 'Headphones', 'Hard Disk', 'UPS', 'Laptop Bag', 'Other'];
const STATUSES   = ['Available', 'Assigned', 'Maintenance', 'Retired'];

function AssetList() {
  const routerLocation = useLocation();
  const [assets,   setAssets]   = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [deleting, setDeleting] = useState(null);
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('Available');

  // Filters
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('');
  const [status,   setStatus]   = useState('');

  useEffect(() => {
    const urlP = new URLSearchParams(routerLocation.search);
    const cat = urlP.get('category') || '';
    const st  = urlP.get('status') || '';
    setCategory(cat);
    setStatus(st);
    setPage(1);
  }, [routerLocation.search]);
  const [location, setLocation] = useState('');
  const [page,     setPage]     = useState(1);
  const [sortBy,   setSortBy]   = useState('emp_asc');

  const fetchAssets = useCallback(() => {
    setLoading(true);
    assetAPI.getAll({ search, category, status, location, page, per_page: 10, sort: sortBy })
      .then(res => {
        setAssets(res.data.assets || []);
        setTotal(res.data.total  || 0);
      })
      .catch(() => setError('Failed to load assets'))
      .finally(() => setLoading(false));
  }, [search, category, status, location, page, sortBy]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, category, status, location]);
  
  // Clear selection when page changes
  useEffect(() => { setSelectedIds([]); }, [page]);

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
      if (!window.confirm(`Delete ${selectedIds.length} selected assets? This cannot be undone.`)) return;
      
      setBulkProcessing(true);
      try {
        await Promise.all(selectedIds.map(id => assetAPI.delete(id)));
        setSelectedIds([]);
        fetchAssets();
        alert(`${selectedIds.length} assets deleted successfully`);
      } catch {
        alert('Failed to delete some assets');
      } finally {
        setBulkProcessing(false);
        setBulkAction('');
      }
    } else if (bulkAction === 'export') {
      // Export selected assets as CSV
      const selectedAssets = assets.filter(a => selectedIds.includes(a.id));
      const csv = [
        ['EMP ID', 'Employee Name', 'Asset Name', 'Serial Number', 'Category', 'Status', 'Location'],
        ...selectedAssets.map(a => [
          a.emp_id || '', a.employee_name || '', a.asset_name, a.serial_number,
          a.category || '', a.status, a.location || ''
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `selected_assets_${new Date().toISOString().split('T')[0]}.csv`;
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
          errors.push(`Asset ID ${id}: ${errorMsg}`);
        }
      }
      
      setSelectedIds([]);
      setShowStatusModal(false);
      fetchAssets();
      
      if (failCount === 0) {
        alert(`✓ Successfully updated ${successCount} assets to ${newStatus}`);
      } else {
        alert(`Updated ${successCount} assets successfully.\n${failCount} failed:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`);
      }
    } catch (error) {
      alert('Failed to update assets. Please try again.');
    } finally {
      setBulkProcessing(false);
      setBulkAction('');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete asset "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await assetAPI.delete(id);
      fetchAssets();
    } catch {
      alert('Failed to delete asset');
    } finally {
      setDeleting(null);
    }
  };

  // Warranty row highlight
  const warrantyClass = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const today = new Date();
    const diff  = (d - today) / (1000 * 60 * 60 * 24);
    if (diff < 0)   return 'warranty-expired';
    if (diff <= 90) return 'warranty-expiring';
    return '';
  };

  const statusBadge = (s) => {
    const map = { Available: 'success', Assigned: 'primary', Maintenance: 'warning', Retired: 'secondary' };
    return <span className={`badge bg-${map[s] || 'secondary'}`}>{s}</span>;
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Tectoro Asset Management</h2>
          <p className="text-muted mb-0">{total} total records</p>
        </div>
        {canPerform('create') && (
          <Link to="/assets/add" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>Add Asset
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="table-card mb-3">
        <div className="row g-2">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search name, serial, EMP ID, employee…"
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
          <div className="col-md-2">
            <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="col-md-2">
            <select className="form-select" value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}>
              <option value="id_asc">Sort: ID (oldest first)</option>
              <option value="id_desc">Sort: Last Added</option>
              <option value="emp_asc">Sort: EMP ID (A→Z)</option>
              <option value="emp_desc">Sort: EMP ID (Z→A)</option>
              <option value="name_asc">Sort: Asset Name (A→Z)</option>
            </select>
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => { setSearch(''); setCategory(''); setStatus(''); setLocation(''); setSortBy('id_asc'); }}
            >
              <i className="bi bi-x-circle me-1"></i>Clear
            </button>
          </div>
        </div>
      </div>

      {/* Legend & Bulk Actions */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex gap-3 small text-muted">
          <span><span className="badge bg-warning text-dark me-1">●</span>Warranty expiring ≤ 90 days</span>
          <span><span className="badge bg-danger me-1">●</span>Warranty expired</span>
        </div>
        
        {selectedIds.length > 0 && (
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
        )}
      </div>

      {/* Table */}
      <div className="table-card">
        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : (
          <>
            <div className="table-responsive" style={{ maxHeight: "calc(100vh - 340px)", overflowY: "auto" }}>
              <table className="table table-hover mb-0">
                <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--card-bg, #fff)" }}>
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
                    <th>EMP ID</th>
                    <th>Employee Name</th>
                    <th>Mobile</th>
                    <th>Asset Name</th>
                    <th>Category</th>
                    <th>Serial Number</th>
                    <th>Model</th>
                    <th>OS</th>
                    <th>RAM</th>
                    <th>Location</th>
                    <th>Warranty Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.length === 0 && (
                    <tr>
                      <td colSpan={canPerform('bulkActions') ? 15 : 14} className="text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                        No assets found
                      </td>
                    </tr>
                  )}
                  {assets.map((a, idx) => (
                    <tr key={a.id} className={warrantyClass(a.warranty_date)}>
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
                      <td className="text-muted small">{(page - 1) * 10 + idx + 1}</td>
                      <td><code className="small">{a.emp_id || '—'}</code></td>
                      <td className="fw-500">{a.employee_name || '—'}</td>
                      <td className="small">{a.mobile_number || '—'}</td>
                      <td className="fw-500">{a.asset_name}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{a.category || '—'}</span>
                      </td>
                      <td><code className="small">{a.serial_number}</code></td>
                      <td className="small">{a.model_name || '—'}</td>
                      <td className="small">{a.os || '—'}</td>
                      <td className="small">{a.ram || '—'}</td>
                      <td className="small">{a.location || '—'}</td>
                      <td className="small">
                        {a.warranty_date ? (
                          <span className={warrantyClass(a.warranty_date) ? 'text-danger fw-600' : ''}>
                            {a.warranty_date}
                          </span>
                        ) : '—'}
                      </td>
                      <td>{statusBadge(a.status)}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Link to={`/assets/view/${a.id}`} className="btn btn-outline-primary" title="View">
                            <i className="bi bi-eye"></i>
                          </Link>
                          {canPerform('edit') && <Link to={`/assets/edit/${a.id}`} className="btn btn-outline-secondary" title="Edit">
                            <i className="bi bi-pencil"></i>
                          </Link>}
                          <button
                            className={canPerform('delete') ? "btn btn-outline-danger" : "d-none"}
                            title="Delete"
                            disabled={deleting === a.id}
                            onClick={() => handleDelete(a.id, a.asset_name)}
                          >
                            {deleting === a.id
                              ? <span className="spinner-border spinner-border-sm"></span>
                              : <i className="bi bi-trash"></i>
                            }
                          </button>
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
                  Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total}
                </small>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(p => p - 1)}>‹</button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                      .map(p => (
                        <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                        </li>
                      ))
                    }
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
                <h5 className="modal-title">Change Status for {selectedIds.length} Assets</h5>
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
                  This will update the status of all {selectedIds.length} selected assets.
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

export default AssetList;
