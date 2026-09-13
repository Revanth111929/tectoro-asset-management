// DeletedAssets.js - View and restore soft-deleted assets
import React, { useState, useEffect } from 'react';
import { NavButton } from '../components/NavButton';
import BackButton from '../components/BackButton';
import { assetAPI } from '../services/api';
import './AssetList.css';

function DeletedAssets() {
  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [restoring, setRestoring] = useState(false);
  const [assetToRestore, setAssetToRestore] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Selection state
  const [selectedAssets, setSelectedAssets] = useState(new Set());

  // Permanent delete state
  const [deleting, setDeleting] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const CATEGORIES = ['Laptop', 'CPU', 'Monitor', 'Printer', 'Phone', 'Server', 'Mouse', 'Headphones', 'Hard Disk', 'UPS', 'Laptop Bag', 'Other'];

  const loadDeletedAssets = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { search, category, page, per_page: 50 };
      const response = await assetAPI.getDeleted(params);
      setAssets(response.data.assets || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      console.error('Failed to load deleted assets:', err);
      setError(err.response?.data?.error || 'Failed to load deleted assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeletedAssets();
  }, [search, category, page]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedAssets(new Set());
  }, [search, category, page]);

  // Selection handlers
  const toggleSelectAsset = (assetId) => {
    setSelectedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedAssets.size === assets.length && assets.length > 0) {
      // Deselect all
      setSelectedAssets(new Set());
    } else {
      // Select all visible
      setSelectedAssets(new Set(assets.map(a => a.id)));
    }
  };

  const clearSelection = () => {
    setSelectedAssets(new Set());
  };

  const handleRestore = (asset) => {
    setAssetToRestore(asset);
    setShowRestoreModal(true);
  };

  const confirmRestore = async () => {
    if (!assetToRestore) return;

    try {
      setRestoring(true);
      await assetAPI.restoreAsset(assetToRestore.id);
      alert(`✅ Asset ${assetToRestore.asset_name} restored successfully`);
      setShowRestoreModal(false);
      setAssetToRestore(null);
      loadDeletedAssets(); // Refresh list
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to restore asset';
      alert(`❌ ${errorMsg}`);
    } finally {
      setRestoring(false);
    }
  };

  // Permanent delete handlers
  const handlePermanentDelete = (asset) => {
    setAssetToDelete(asset);
    setShowDeleteModal(true);
  };

  const confirmPermanentDelete = async () => {
    if (!assetToDelete) return;

    try {
      setDeleting(true);
      await assetAPI.permanentDelete(assetToDelete.id);
      alert(`✅ Asset ${assetToDelete.asset_name} permanently deleted`);
      setShowDeleteModal(false);
      setAssetToDelete(null);
      clearSelection();
      loadDeletedAssets(); // Refresh list
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to permanently delete asset';
      alert(`❌ ${errorMsg}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkPermanentDelete = () => {
    if (selectedAssets.size === 0) return;
    setDeleteConfirmText('');
    setShowBulkDeleteModal(true);
  };

  const confirmBulkPermanentDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    try {
      setDeleting(true);
      const assetIds = Array.from(selectedAssets);
      const response = await assetAPI.bulkPermanentDelete(assetIds);
      alert(`✅ ${response.data.deleted} archived asset(s) permanently deleted`);
      setShowBulkDeleteModal(false);
      setDeleteConfirmText('');
      clearSelection();
      loadDeletedAssets(); // Refresh list
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to permanently delete assets';
      alert(`❌ ${errorMsg}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedAssets.size === 0) return;

    if (!window.confirm(`Restore ${selectedAssets.size} selected asset(s)?`)) {
      return;
    }

    try {
      setRestoring(true);
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const assetId of selectedAssets) {
        try {
          await assetAPI.restoreAsset(assetId);
          successCount++;
        } catch (err) {
          errorCount++;
          const asset = assets.find(a => a.id === assetId);
          errors.push(`${asset?.asset_name || assetId}: ${err.response?.data?.error || 'Failed'}`);
        }
      }

      if (errorCount === 0) {
        alert(`✅ ${successCount} asset(s) restored successfully`);
      } else {
        alert(`⚠️ Restored ${successCount} asset(s). ${errorCount} failed:\n${errors.join('\n')}`);
      }

      clearSelection();
      loadDeletedAssets();
    } catch (err) {
      alert('❌ Bulk restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <BackButton fallbackRoute="/assets" />
            <h2 className="fw-bold mb-0">
              <i className="bi bi-trash me-2"></i>Deleted Assets
            </h2>
          </div>
          <p className="text-muted mb-0">
            View and restore soft-deleted assets. Assets can be restored to active inventory.
          </p>
        </div>
        <div>
          <NavButton to="/assets" className="btn btn-outline-primary">
            <i className="bi bi-arrow-left me-2"></i>Back to All Assets
          </NavButton>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <div className="table-card">
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, serial number, employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
              {search && (
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setSearch('')}
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="table-card">
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="col-md-3">
          <div className="table-card text-center">
            <div className="text-muted small mb-1">Total Deleted</div>
            <div className="fw-bold fs-4">{total}</div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      )}

      {/* Deleted Assets Table */}
      <div className="table-card">
        {/* Bulk Action Toolbar - Only visible when assets selected */}
        {selectedAssets.size > 0 && (
          <div className="alert alert-info mb-3 d-flex align-items-center justify-content-between">
            <div>
              <i className="bi bi-check-square me-2"></i>
              <strong>{selectedAssets.size}</strong> asset{selectedAssets.size !== 1 ? 's' : ''} selected
            </div>
            <div className="btn-group">
              <button
                className="btn btn-success btn-sm"
                onClick={handleBulkRestore}
                disabled={restoring || deleting}
              >
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                Restore Selected
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleBulkPermanentDelete}
                disabled={restoring || deleting}
              >
                <i className="bi bi-trash me-2"></i>
                Delete Permanently
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={clearSelection}
                disabled={restoring || deleting}
              >
                <i className="bi bi-x me-2"></i>
                Clear
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
            <div className="text-muted mt-2">Loading deleted assets...</div>
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
            <table className="table table-hover">
              <thead className="sticky-top bg-white">
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={assets.length > 0 && selectedAssets.size === assets.length}
                      onChange={toggleSelectAll}
                      ref={el => {
                        if (el) {
                          el.indeterminate = selectedAssets.size > 0 && selectedAssets.size < assets.length;
                        }
                      }}
                      title="Select all visible assets"
                    />
                  </th>
                  <th>Asset Name</th>
                  <th>Category</th>
                  <th>Serial Number</th>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>Deleted By</th>
                  <th>Deleted At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                      {search || category ? 'No deleted assets match your filters' : 'No deleted assets'}
                    </td>
                  </tr>
                ) : (
                  assets.map(asset => (
                    <tr key={asset.id}>
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedAssets.has(asset.id)}
                          onChange={() => toggleSelectAsset(asset.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="fw-600">{asset.asset_name}</td>
                      <td>
                        <span className="badge bg-secondary">{asset.category}</span>
                      </td>
                      <td><code className="small">{asset.serial_number}</code></td>
                      <td className="small">
                        {asset.employee_name ? (
                          <>
                            {asset.employee_name}
                            {asset.emp_id && <><br/><code>{asset.emp_id}</code></>}
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          asset.status === 'Assigned' ? 'bg-success' :
                          asset.status === 'Available' ? 'bg-primary' :
                          asset.status === 'Maintenance' ? 'bg-warning' :
                          'bg-secondary'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="small">{asset.deleted_by || '—'}</td>
                      <td className="small">{formatDate(asset.deleted_at)}</td>
                      <td>
                        <div className="action-group">
                          <NavButton
                            to={`/assets/${asset.id}`}
                            className="action-btn"
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </NavButton>
                          <button
                            className="action-btn"
                            onClick={() => handleRestore(asset)}
                            title="Restore Asset"
                            style={{ color: '#16a34a' }}
                          >
                            <i className="bi bi-arrow-counterclockwise"></i>
                          </button>
                          <button
                            className="action-btn"
                            onClick={() => handlePermanentDelete(asset)}
                            title="Delete Permanently"
                            style={{ color: '#dc2626' }}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreModal && assetToRestore && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title text-success">
                  <i className="bi bi-arrow-counterclockwise me-2"></i>
                  Restore Asset?
                </h5>
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowRestoreModal(false);
                    setAssetToRestore(null);
                  }}
                  disabled={restoring}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  Are you sure you want to restore this asset to active inventory?
                </p>
                <div className="border rounded p-3 bg-light">
                  <div className="row g-2">
                    <div className="col-12">
                      <strong>Asset:</strong> {assetToRestore.asset_name}
                    </div>
                    <div className="col-12">
                      <strong>Serial Number:</strong> <code>{assetToRestore.serial_number}</code>
                    </div>
                    <div className="col-12">
                      <strong>Category:</strong> {assetToRestore.category}
                    </div>
                    {assetToRestore.employee_name && (
                      <div className="col-12">
                        <strong>Employee:</strong> {assetToRestore.employee_name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="alert alert-info mt-3 mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  The asset will be returned to the active asset inventory with all its original data intact.
                </div>
              </div>
              <div className="modal-footer border-0">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowRestoreModal(false);
                    setAssetToRestore(null);
                  }}
                  disabled={restoring}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success"
                  onClick={confirmRestore}
                  disabled={restoring}
                >
                  {restoring ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Restoring...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-arrow-counterclockwise me-2"></i>
                      Restore Asset
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Permanent Delete Confirmation Modal */}
      {showDeleteModal && assetToDelete && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-danger">
              <div className="modal-header bg-danger text-white border-0">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Permanently Delete Asset?
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setAssetToDelete(null);
                  }}
                  disabled={deleting}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger mb-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>WARNING:</strong> This action permanently removes the asset record and <strong>cannot be undone</strong>.
                </div>
                <p className="mb-3">
                  You are about to permanently delete this archived asset:
                </p>
                <div className="border rounded p-3 bg-light">
                  <div className="row g-2">
                    <div className="col-12">
                      <strong>Asset:</strong> {assetToDelete.asset_name}
                    </div>
                    <div className="col-12">
                      <strong>Serial Number:</strong> <code>{assetToDelete.serial_number}</code>
                    </div>
                    <div className="col-12">
                      <strong>Category:</strong> {assetToDelete.category}
                    </div>
                    {assetToDelete.employee_name && (
                      <div className="col-12">
                        <strong>Employee:</strong> {assetToDelete.employee_name}
                      </div>
                    )}
                    <div className="col-12">
                      <strong>Deleted At:</strong> {formatDate(assetToDelete.deleted_at)}
                    </div>
                    <div className="col-12">
                      <strong>Deleted By:</strong> {assetToDelete.deleted_by || '—'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setAssetToDelete(null);
                  }}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={confirmPermanentDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash me-2"></i>
                      Permanently Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Permanent Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-danger">
              <div className="modal-header bg-danger text-white border-0">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Permanently Delete {selectedAssets.size} Assets?
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowBulkDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={deleting}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger mb-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>WARNING:</strong> This action permanently removes {selectedAssets.size} archived asset{selectedAssets.size !== 1 ? 's' : ''} and <strong>cannot be undone</strong>.
                </div>
                <p className="mb-3">
                  You are about to permanently delete <strong>{selectedAssets.size}</strong> archived asset{selectedAssets.size !== 1 ? 's' : ''}.
                </p>

                <div className="mb-3">
                  <strong>Safety Confirmation Required</strong>
                  <p className="small text-muted mb-2">
                    To confirm this bulk permanent deletion, type <code className="text-danger fw-bold">DELETE</code> below:
                  </p>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type DELETE to confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    autoFocus
                    disabled={deleting}
                  />
                </div>

                <div className="alert alert-warning mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  <small>Only archived assets can be permanently deleted. Active assets are automatically protected.</small>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowBulkDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={confirmBulkPermanentDelete}
                  disabled={deleting || deleteConfirmText !== 'DELETE'}
                >
                  {deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash me-2"></i>
                      Permanently Delete {selectedAssets.size} Asset{selectedAssets.size !== 1 ? 's' : ''}
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

export default DeletedAssets;
