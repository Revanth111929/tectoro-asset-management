// Employees.js - Employee Master Management - Phase 1
// Loads from Employee table while maintaining backward compatibility
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);
  
  // Phase 1: Bulk import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // FIX: Re-fetch data whenever we navigate to this page
  // This ensures status changes are immediately visible after update
  useEffect(() => {
    loadEmployees();
  }, [location.key]); // Re-run when navigation occurs

  const loadEmployees = async () => {
    try {
      setLoading(true);
      
      // Always fetch fresh data from Employee table
      const empRes = await employeeAPI.search('');
      
      if (empRes.data && empRes.data.length > 0) {
        // Map employee data - preserve status exactly as returned from API
        const employeesList = empRes.data.map(emp => ({
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
      setImportResult(response.data.results);
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

  const handleExitSuccess = (summary) => {
    alert(`✅ Employee exit processed successfully!\n\n` +
      `Employee: ${summary.employee}\n` +
      `Recovered: ${summary.recovered}\n` +
      `Missing: ${summary.missing}\n` +
      `Damaged: ${summary.damaged}`
    );
    loadEmployees();
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
          <h2 className="fw-bold mb-1">
            <i className="bi bi-people me-2"></i>Employee Master
          </h2>
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
          <Link to="/employees/add" className="btn btn-primary">
            <i className="bi bi-person-plus me-2"></i>Add Employee
          </Link>
        </div>
      </div>

      {/* Search & Statistics */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <div className="table-card">
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, ID, email, or department..."
                value={search}
                onChange={e => setSearch(e.target.value)}
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
          <div className="table-card text-center">
            <div className="text-muted small mb-1">Showing</div>
            <div className="fw-bold fs-4">{filteredEmployees.length} / {employees.length}</div>
          </div>
        </div>
      </div>

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
                    <td colSpan="9" className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                      {search ? 'No employees match your search' : 'No employees found'}
                      <div className="mt-2">
                        <Link to="/employees/add" className="btn btn-sm btn-primary">
                          <i className="bi bi-person-plus me-1"></i>Add First Employee
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => (
                    <tr key={emp.emp_id}>
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
                        <div className="btn-group btn-group-sm">
                          <Link
                            to={`/employees/edit/${emp.emp_id}`}
                            className="btn btn-outline-primary"
                            title="Edit Employee"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <Link
                            to={`/employees/${emp.emp_id}/asset-history`}
                            className="btn btn-outline-info"
                            title="View Asset History"
                          >
                            <i className="bi bi-clock-history"></i>
                          </Link>
                          {emp.status === 'Active' && emp.is_active !== false && (
                            <>
                              <button
                                className="btn btn-outline-warning"
                                onClick={() => handleDisableEmployee(emp)}
                                title="Disable Employee"
                              >
                                <i className="bi bi-slash-circle"></i>
                              </button>
                              {emp.asset_count > 0 && (
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleExitEmployee(emp)}
                                  title="Process Employee Exit"
                                >
                                  <i className="bi bi-box-arrow-right"></i>
                                </button>
                              )}
                            </>
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
          <div className="modal-dialog modal-lg">
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
                <div className="row g-3 mb-3">
                  <div className="col-4">
                    <div className="text-center p-3 rounded" style={{ backgroundColor: '#d1e7dd' }}>
                      <div className="fs-3 fw-bold text-success">{importResult.imported}</div>
                      <div className="text-muted small">Imported</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center p-3 rounded" style={{ backgroundColor: '#fff3cd' }}>
                      <div className="fs-3 fw-bold text-warning">{importResult.skipped}</div>
                      <div className="text-muted small">Skipped</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center p-3 rounded" style={{ backgroundColor: '#f8d7da' }}>
                      <div className="fs-3 fw-bold text-danger">{importResult.failed}</div>
                      <div className="text-muted small">Failed</div>
                    </div>
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div>
                    <h6 className="fw-bold mb-2">Errors:</h6>
                    <div 
                      className="border rounded p-3" 
                      style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}
                    >
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="small text-danger mb-1">
                          <i className="bi bi-exclamation-circle me-1"></i>{error}
                        </div>
                      ))}
                    </div>
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
    </div>
  );
}

export default Employees;