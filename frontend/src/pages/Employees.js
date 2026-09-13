// Employees.js - Employee Master Management - Phase 1
// Loads from Employee table while maintaining backward compatibility
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavButton } from '../components/NavButton';
import BackButton from '../components/BackButton';
import { employeeAPI, assetAPI } from '../services/api';
import EmployeeExitModal from '../components/EmployeeExitModal';

function Employees() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active'); // Default to Active only
  const [sortOption, setSortOption] = useState('emp_id'); // Default to Employee ID
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk selection state
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());

  // Phase 1: Bulk import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // FIX: Re-fetch data whenever we navigate to this page OR when sort changes
  // This ensures status changes are immediately visible after update
  useEffect(() => {
    loadEmployees();
  }, [location.key, sortOption]); // Re-run when navigation occurs or sort changes

  const loadEmployees = async () => {
    try {
      setLoading(true);

      // Always fetch fresh data from Employee table with sorting
      // P1-BUG-FIX: Request ALL employees (backend default per_page=1000)
      const empRes = await employeeAPI.search({ sort: sortOption });

      // Backend returns array directly when no pagination params
      const employeesData = Array.isArray(empRes.data) ? empRes.data : (empRes.data.employees || []);

      if (employeesData && employeesData.length > 0) {
        // Map employee data - preserve status exactly as returned from API
        const employeesList = employeesData.map(emp => ({
          ...emp,  // Spread all fields including status
          asset_count: 0,  // Will be enriched from assets
          assets: []
        }));

        // Enrich with asset counts
        try {
          const assetsRes = await assetAPI.getAll({});
          const assets = assetsRes.data.assets || assetsRes.data || [];

          assets.forEach(asset => {
            if (asset.emp_id) {
              const emp = employeesList.find(e => e.emp_id === asset.emp_id);
              if (emp) {
                emp.asset_count++;
                emp.assets.push(asset);
              }
            }
          });
        } catch (err) {
          console.warn('Could not load asset counts:', err);
        }

        setEmployees(employeesList);
      } else {
        // Backward compatibility: Extract from assets (status will default at model level)
        const res = await assetAPI.getAll({});
        const assetsData = res.data.assets || res.data || [];

        const empMap = {};
        assetsData.forEach(asset => {
          if (asset.emp_id && asset.employee_name) {
            if (!empMap[asset.emp_id]) {
              empMap[asset.emp_id] = {
                emp_id: asset.emp_id,
                employee_name: asset.employee_name,
                email: asset.employee_email || '',
                mobile_number: asset.mobile_number || '',
                department: '',
                designation: '',
                status: 'Active',  // Only as fallback for asset-derived employees
                asset_count: 0,
                assets: []
              };
            }
            empMap[asset.emp_id].asset_count++;
            empMap[asset.emp_id].assets.push(asset);
          }
        });

        setEmployees(Object.values(empMap));
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Phase 1: Bulk import handlers
  const handleDownloadTemplate = async () => {
    try {
      const response = await employeeAPI.downloadTemplate();
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'employee_import_template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download template: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleBulkImport(file);
    }
  };

  const handleBulkImport = async (file) => {
    try {
      setImporting(true);
      setImportResult(null);

      const response = await employeeAPI.bulkImport(file);
      // Store the complete response data (includes both results and summary)
      setImportResult(response.data);
      setShowImportModal(true);

      // Reload employees
      await loadEmployees();
    } catch (err) {
      alert('Import failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDisableEmployee = async (emp) => {
    if (!window.confirm(`Are you sure you want to disable ${emp.employee_name}?`)) {
      return;
    }

    try {
      await employeeAPI.disable(emp.emp_id);
      alert('Employee disabled successfully');
      loadEmployees();
    } catch (err) {
      alert('Failed to disable employee: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleExitEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowExitModal(true);
  };

  const handleDeleteEmployee = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    try {
      setDeleting(true);
      await employeeAPI.delete(employeeToDelete.emp_id);

      alert(`✅ Employee ${employeeToDelete.employee_name} deleted successfully`);
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      loadEmployees();
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.active_assets && errorData.active_assets.length > 0) {
        // Show detailed error with asset list
        const assetList = errorData.active_assets.join('\n• ');
        alert(
          `❌ Cannot delete employee\n\n` +
          `${employeeToDelete.employee_name} still has ${errorData.asset_count} active asset(s) assigned:\n\n` +
          `• ${assetList}\n\n` +
          `Please return or reassign these assets before deleting the employee.`
        );
      } else if (errorData?.error) {
        alert(`❌ Failed to delete employee:\n\n${errorData.error}`);
      } else {
        alert(`❌ Failed to delete employee: ${err.message}`);
      }

      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleExitSuccess = (summary) => {
    alert(`✅ Employee exit processed successfully!\n\n` +
      `Employee: ${summary.employee}\n` +
      `Recovered: ${summary.recovered}\n` +
      `Missing: ${summary.missing}\n` +
      `Damaged: ${summary.damaged}`
    );
    loadEmployees();
  };

  // Bulk selection handlers
  const toggleEmployee = (empId) => {
    setSelectedEmployees(prev => {
      const next = new Set(prev);
      if (next.has(empId)) {
        next.delete(empId);
      } else {
        next.add(empId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(filteredEmployees.map(emp => emp.emp_id)));
    }
  };

  const clearSelection = () => {
    setSelectedEmployees(new Set());
  };

  // Bulk action handlers
  const handleBulkDeactivate = async () => {
    const selectedCount = selectedEmployees.size;

    if (!window.confirm(
      `Deactivate ${selectedCount} selected employee(s)?\n\n` +
      `Active employees will be changed to Inactive.`
    )) {
      return;
    }

    try {
      const emp_ids = Array.from(selectedEmployees);
      const response = await employeeAPI.bulkDeactivate(emp_ids);

      alert(
        `✅ ${response.data.message}\n\n` +
        `Updated: ${response.data.updated}\n` +
        `Skipped: ${response.data.skipped}`
      );

      clearSelection();
      loadEmployees();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to deactivate employees';
      alert(`❌ ${errorMsg}`);
    }
  };

  const handleBulkActivate = async () => {
    const selectedCount = selectedEmployees.size;

    if (!window.confirm(
      `Activate ${selectedCount} selected employee(s)?\n\n` +
      `Inactive/Exited employees will be changed to Active.`
    )) {
      return;
    }

    try {
      const emp_ids = Array.from(selectedEmployees);
      const response = await employeeAPI.bulkActivate(emp_ids);

      alert(
        `✅ ${response.data.message}\n\n` +
        `Updated: ${response.data.updated}\n` +
        `Skipped: ${response.data.skipped}`
      );

      clearSelection();
      loadEmployees();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to activate employees';
      alert(`❌ ${errorMsg}`);
    }
  };

  const handleBulkDelete = async () => {
    const selectedCount = selectedEmployees.size;
    const selectedEmps = employees.filter(emp => selectedEmployees.has(emp.emp_id));

    // Calculate eligibility
    const eligible = selectedEmps.filter(emp =>
      (emp.status === 'Inactive' || emp.status === 'Exited') && emp.asset_count === 0
    );

    const blocked = selectedEmps.filter(emp => {
      if (emp.status === 'Active') return true;
      if (emp.asset_count > 0) return true;
      return false;
    });

    // Build confirmation message
    let confirmMessage = '';

    if (eligible.length === 0) {
      alert(
        '❌ Cannot delete selected employees\n\n' +
        'No eligible employees selected.\n\n' +
        'Requirements:\n' +
        '• Status must be Inactive or Exited\n' +
        '• No assets assigned'
      );
      return;
    }

    confirmMessage = `Delete ${eligible.length} eligible employee(s)?\n\n`;

    if (eligible.length > 0) {
      confirmMessage += 'Eligible employees:\n';
      eligible.forEach(emp => {
        confirmMessage += `• ${emp.employee_name} (${emp.emp_id})\n`;
      });
    }

    if (blocked.length > 0) {
      confirmMessage += '\nCannot delete:\n';
      blocked.forEach(emp => {
        const reason = emp.status === 'Active'
          ? 'Active employee'
          : `${emp.asset_count} asset(s) assigned`;
        confirmMessage += `• ${emp.employee_name} — ${reason}\n`;
      });
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const emp_ids = Array.from(selectedEmployees);
      const response = await employeeAPI.bulkDelete(emp_ids);

      let message = `✅ ${response.data.message}\n\n` +
                   `Deleted: ${response.data.deleted}`;

      if (response.data.blocked > 0) {
        message += `\nBlocked: ${response.data.blocked}\n\n`;
        response.data.blocked_employees.forEach(emp => {
          message += `• ${emp.name} — ${emp.reason}\n`;
        });
      }

      alert(message);

      clearSelection();
      loadEmployees();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to delete employees';
      alert(`❌ ${errorMsg}`);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    // Text search filter
    const matchesSearch = emp.employee_name.toLowerCase().includes(search.toLowerCase()) ||
      emp.emp_id.toLowerCase().includes(search.toLowerCase()) ||
      (emp.email && emp.email.toLowerCase().includes(search.toLowerCase())) ||
      (emp.department && emp.department.toLowerCase().includes(search.toLowerCase()));

    // Status filter
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <BackButton />
            <h2 className="fw-bold mb-0">
              <i className="bi bi-people me-2"></i>Employee Master
            </h2>
          </div>
          <p className="text-muted mb-0">Manage employee records, bulk import, and process exits</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-success"
            onClick={handleDownloadTemplate}
          >
            <i className="bi bi-download me-2"></i>Download Template
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-success"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Importing...
              </>
            ) : (
              <>
                <i className="bi bi-upload me-2"></i>Bulk Import
              </>
            )}
          </button>
          <NavButton to="/employees/add" className="btn btn-primary">
            <i className="bi bi-person-plus me-2"></i>Add Employee
          </NavButton>
        </div>
      </div>

      {/* Search & Statistics */}
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="table-card">
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, ID, email, or department..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoComplete="off"
                name={`employee-list-search-${Math.random().toString(36).substring(7)}`}
                data-lpignore="true"
                data-form-type="other"
                role="searchbox"
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
        <div className="col-md-2">
          <div className="table-card">
            <select
              className="form-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Exited">Exited</option>
            </select>
          </div>
        </div>
        <div className="col-md-3">
          <div className="table-card">
            <select
              className="form-select"
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              title="Sort employees by"
            >
              <option value="emp_id">Employee ID</option>
              <option value="latest_created">Latest Created</option>
              <option value="oldest_created">Oldest Created</option>
              <option value="name_asc">Employee Name (A–Z)</option>
              <option value="name_desc">Employee Name (Z–A)</option>
            </select>
          </div>
        </div>
        <div className="col-md-3">
          <div className="table-card text-center">
            <div className="text-muted small mb-1">Showing</div>
            <div className="fw-bold fs-4">{filteredEmployees.length} / {employees.length}</div>
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar - Only show when employees are selected */}
      {selectedEmployees.size > 0 && (
        <div className="alert alert-info mb-3 d-flex justify-content-between align-items-center">
          <div>
            <strong>{selectedEmployees.size}</strong> employee(s) selected
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-warning"
              onClick={handleBulkDeactivate}
              title="Deactivate selected Active employees"
            >
              <i className="bi bi-dash-circle me-1"></i>Deactivate Selected
            </button>
            <button
              className="btn btn-sm btn-success"
              onClick={handleBulkActivate}
              title="Activate selected Inactive/Exited employees"
            >
              <i className="bi bi-check-circle me-1"></i>Activate Selected
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={handleBulkDelete}
              title="Delete selected Inactive/Exited employees"
            >
              <i className="bi bi-trash me-1"></i>Delete Selected
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={clearSelection}
            >
              <i className="bi bi-x-circle me-1"></i>Clear
            </button>
          </div>
        </div>
      )}

      {/* Employee List */}
      <div className="table-card">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
            <div className="text-muted mt-2">Loading employees...</div>
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: "calc(100vh - 380px)", overflowY: "auto" }}>
            <table className="table table-hover">
              <thead className="sticky-top bg-white">
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={filteredEmployees.length > 0 && selectedEmployees.size === filteredEmployees.length}
                      ref={input => {
                        if (input) {
                          input.indeterminate = selectedEmployees.size > 0 && selectedEmployees.size < filteredEmployees.length;
                        }
                      }}
                      onChange={toggleSelectAll}
                      title="Select all visible employees"
                    />
                  </th>
                  <th>EMP ID</th>
                  <th>Employee Name</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Assets</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                      {search ? 'No employees match your search' : 'No employees found'}
                      <div className="mt-2">
                        <NavButton to="/employees/add" className="btn btn-sm btn-primary">
                          <i className="bi bi-person-plus me-1"></i>Add First Employee
                        </NavButton>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => (
                    <tr key={emp.emp_id}>
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedEmployees.has(emp.emp_id)}
                          onChange={() => toggleEmployee(emp.emp_id)}
                        />
                      </td>
                      <td><code className="small">{emp.emp_id}</code></td>
                      <td className="fw-600">{emp.employee_name}</td>
                      <td className="small">{emp.designation || '—'}</td>
                      <td className="small">{emp.department || '—'}</td>
                      <td className="small">{emp.email || '—'}</td>
                      <td className="small">{emp.mobile_number || '—'}</td>
                      <td>
                        {emp.asset_count > 0 ? (
                          <span className="badge bg-primary">{emp.asset_count}</span>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          emp.status === 'Active' ? 'bg-success' :
                          emp.status === 'Exited' ? 'bg-secondary' :
                          'bg-warning'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <NavButton
                            to={`/employees/edit/${emp.emp_id}`}
                            className="action-btn action-edit"
                            title="Edit Employee"
                          >
                            <i className="bi bi-pencil"></i>
                          </NavButton>
                          <NavButton
                            to={`/employees/${emp.emp_id}/asset-history`}
                            className="action-btn action-history"
                            title="View Asset History"
                          >
                            <i className="bi bi-clock-history"></i>
                          </NavButton>
                          {emp.status === 'Active' && emp.is_active !== false && (
                            <>
                              <button
                                className="action-btn"
                                onClick={() => handleDisableEmployee(emp)}
                                title="Disable Employee"
                                style={{ color: '#f59e0b' }}
                              >
                                <i className="bi bi-slash-circle"></i>
                              </button>
                              {emp.asset_count > 0 && (
                                <button
                                  className="action-btn action-delete"
                                  onClick={() => handleExitEmployee(emp)}
                                  title="Process Employee Exit"
                                >
                                  <i className="bi bi-box-arrow-right"></i>
                                </button>
                              )}
                            </>
                          )}
                          {(emp.status === 'Inactive' || emp.status === 'Exited') && (
                            <button
                              className="action-btn action-delete"
                              onClick={() => handleDeleteEmployee(emp)}
                              title="Delete Employee"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
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

      {/* Import Result Modal */}
      {showImportModal && importResult && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-file-earmark-check me-2"></i>
                  Bulk Import Results
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setShowImportModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Summary Statistics */}
                <div className="row g-3 mb-4">
                  <div className="col-3">
                    <div className="text-center p-3 rounded" style={{ backgroundColor: '#d1e7dd' }}>
                      <div className="fs-3 fw-bold text-success">{importResult.results?.imported || 0}</div>
                      <div className="text-muted small">Imported</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="text-center p-3 rounded" style={{ backgroundColor: '#cff4fc' }}>
                      <div className="fs-3 fw-bold text-info">{importResult.results?.updated || 0}</div>
                      <div className="text-muted small">Updated</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="text-center p-3 rounded" style={{ backgroundColor: '#f8d7da' }}>
                      <div className="fs-3 fw-bold text-danger">{importResult.results?.failed || 0}</div>
                      <div className="text-muted small">Failed</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="text-center p-3 rounded" style={{ backgroundColor: '#e7f1ff' }}>
                      <div className="fs-3 fw-bold text-primary">
                        {importResult.summary?.total_excel_rows || 0}
                      </div>
                      <div className="text-muted small">Total Rows</div>
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                {(importResult.results?.imported > 0 || importResult.results?.updated > 0) && (
                  <div className="alert alert-success mb-3">
                    <i className="bi bi-check-circle me-2"></i>
                    <strong>Successfully processed {(importResult.results.imported || 0) + (importResult.results.updated || 0)} employee(s)!</strong>
                    {importResult.results.imported > 0 && <div className="small">• New employees: {importResult.results.imported}</div>}
                    {importResult.results.updated > 0 && <div className="small">• Updated employees: {importResult.results.updated}</div>}
                  </div>
                )}

                {/* Detailed Summary */}
                {importResult.summary && (
                  <div className="alert alert-info mb-3">
                    <h6 className="fw-bold mb-2">
                      <i className="bi bi-info-circle me-2"></i>Upload Summary
                    </h6>
                    <ul className="mb-0">
                      <li>Total Excel rows processed: <strong>{importResult.summary.total_excel_rows}</strong></li>
                      <li>Unique employees found: <strong>{importResult.summary.unique_employees}</strong></li>
                      <li>New employees imported: <strong>{importResult.results?.imported || 0}</strong></li>
                      <li>Existing employees updated: <strong>{importResult.results?.updated || 0}</strong></li>
                      {importResult.summary.duplicate_rows_merged > 0 && (
                        <li>Duplicate rows merged: <strong>{importResult.summary.duplicate_rows_merged}</strong></li>
                      )}
                      {importResult.results?.failed > 0 && (
                        <li className="text-danger">Failed: <strong>{importResult.results.failed}</strong></li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Duplicates Within Excel */}
                {importResult.duplicates_within_excel && importResult.duplicates_within_excel.length > 0 && (
                  <div className="mb-3">
                    <h6 className="fw-bold mb-2">
                      <i className="bi bi-files me-2 text-warning"></i>
                      Duplicate Employees Found in Excel
                    </h6>
                    <div
                      className="border rounded p-3"
                      style={{ maxHeight: '250px', overflowY: 'auto', backgroundColor: '#fff3cd' }}
                    >
                      {importResult.duplicates_within_excel.map((dup, index) => (
                        <div key={index} className="mb-2 pb-2 border-bottom">
                          <div className="fw-bold">
                            <i className="bi bi-person me-1"></i>
                            {dup.employee_name} (Employee ID: {dup.emp_id})
                          </div>
                          <div className="small text-muted">
                            Found in <strong>{dup.count}</strong> rows: <strong>{dup.rows.join(', ')}</strong>
                          </div>
                          <div className="small text-success">
                            <i className="bi bi-check-circle me-1"></i>
                            Imported once (duplicate rows skipped)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conflicts (Same EMP ID, Different Names) */}
                {importResult.conflicts && importResult.conflicts.length > 0 && (
                  <div className="mb-3">
                    <h6 className="fw-bold mb-2 text-danger">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Data Conflicts Detected
                    </h6>
                    <div
                      className="border border-danger rounded p-3"
                      style={{ maxHeight: '250px', overflowY: 'auto', backgroundColor: '#f8d7da' }}
                    >
                      {importResult.conflicts.map((conflict, index) => (
                        <div key={index} className="mb-2 pb-2 border-bottom border-danger">
                          <div className="fw-bold text-danger">
                            <i className="bi bi-x-circle me-1"></i>
                            Employee ID <code>{conflict.emp_id}</code> has different names
                          </div>
                          <div className="small">
                            Names found: <strong>{conflict.names.join(', ')}</strong>
                          </div>
                          <div className="small">
                            Rows: <strong>{conflict.rows.join(', ')}</strong>
                          </div>
                          <div className="small text-danger mt-1">
                            <i className="bi bi-info-circle me-1"></i>
                            Not imported - please fix the Excel data and re-upload
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Already in Database */}
                {importResult.already_in_database && importResult.already_in_database.length > 0 && (
                  <div className="mb-3">
                    <h6 className="fw-bold mb-2">
                      <i className="bi bi-database me-2 text-info"></i>
                      Already Exists in Database
                    </h6>
                    <div
                      className="border rounded p-3"
                      style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#cfe2ff' }}
                    >
                      {importResult.already_in_database.map((existing, index) => (
                        <div key={index} className="small mb-1">
                          <i className="bi bi-info-circle me-1 text-info"></i>
                          <strong>{existing.emp_id}</strong> - {existing.employee_name}
                          {existing.rows && existing.rows.length > 0 && (
                            <span className="text-muted"> (Rows: {existing.rows.join(', ')})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Errors */}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div>
                    <h6 className="fw-bold mb-2 text-danger">
                      <i className="bi bi-exclamation-circle me-2"></i>
                      Errors:
                    </h6>
                    <div
                      className="border rounded p-3"
                      style={{ maxHeight: '250px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}
                    >
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="small text-danger mb-1">
                          <i className="bi bi-exclamation-circle me-1"></i>{error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {importResult.imported > 0 && (
                  <div className="alert alert-success mt-3 mb-0">
                    <i className="bi bi-check-circle me-2"></i>
                    <strong>Successfully imported {importResult.imported} employee(s)!</strong>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowImportModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exit Modal */}
      {showExitModal && selectedEmployee && (
        <EmployeeExitModal
          employee={selectedEmployee}
          onClose={() => {
            setShowExitModal(false);
            setSelectedEmployee(null);
          }}
          onSuccess={handleExitSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && employeeToDelete && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title text-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Delete Employee?
                </h5>
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setEmployeeToDelete(null);
                  }}
                  disabled={deleting}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  Are you sure you want to permanently delete this employee?
                </p>
                <div className="border rounded p-3 bg-light">
                  <div className="row g-2">
                    <div className="col-12">
                      <strong>Employee:</strong> {employeeToDelete.employee_name}
                    </div>
                    <div className="col-12">
                      <strong>EMP ID:</strong> <code>{employeeToDelete.emp_id}</code>
                    </div>
                    <div className="col-12">
                      <strong>Status:</strong> <span className="badge bg-secondary">{employeeToDelete.status}</span>
                    </div>
                    {employeeToDelete.department && (
                      <div className="col-12">
                        <strong>Department:</strong> {employeeToDelete.department}
                      </div>
                    )}
                  </div>
                </div>
                <div className="alert alert-warning mt-3 mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>This action cannot be undone.</strong> Historical records will be preserved.
                </div>
              </div>
              <div className="modal-footer border-0">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setEmployeeToDelete(null);
                  }}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={confirmDeleteEmployee}
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
                      Delete Employee
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

export default Employees;