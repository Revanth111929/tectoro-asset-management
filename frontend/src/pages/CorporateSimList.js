// CorporateSimList.js – Corporate SIM inventory list with search, filter, assign
import { canPerform } from '../utils/permissions';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { corporateSimAPI, employeeAPI } from '../services/api';

const CARRIERS = ['Airtel', 'Jio', 'Vi (Vodafone Idea)', 'BSNL', 'Other'];
const STATUSES = ['Available', 'Assigned', 'Active', 'Suspended', 'Returned', 'Lost', 'Damaged', 'Terminated'];

function CorporateSimList() {
  const [sims, setSims] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [carrier, setCarrier] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningSim, setAssigningSim] = useState(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [assignRemarks, setAssignRemarks] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Return Modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returningSim, setReturningSim] = useState(null);
  const [returnStatus, setReturnStatus] = useState('Available');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [returning, setReturning] = useState(false);

  const fetchSims = useCallback(() => {
    setLoading(true);
    setError('');
    corporateSimAPI.getAll({ search, carrier, status, page, per_page: 20 })
      .then(res => {
        setSims(res.data.sims || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => setError('Failed to load Corporate SIMs'))
      .finally(() => setLoading(false));
  }, [search, carrier, status, page]);

  useEffect(() => { fetchSims(); }, [fetchSims]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this SIM? This action cannot be undone.')) return;
    setDeleting(id);
    try {
      await corporateSimAPI.delete(id);
      fetchSims();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete SIM');
    } finally {
      setDeleting(null);
    }
  };

  // Employee search for assignment
  const handleEmployeeSearch = async (val) => {
    setEmployeeSearch(val);
    setSelectedEmployee(null);
    if (val.length < 2) {
      setEmployeeSuggestions([]);
      return;
    }
    try {
      const res = await employeeAPI.search(val);
      setEmployeeSuggestions(res.data || []);
    } catch {}
  };

  const selectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setEmployeeSearch(emp.employee_name);
    setEmployeeSuggestions([]);
  };

  const openAssignModal = (sim) => {
    setAssigningSim(sim);
    setEmployeeSearch('');
    setSelectedEmployee(null);
    setAssignRemarks('');
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }
    setAssigning(true);
    try {
      await corporateSimAPI.assign(assigningSim.id, {
        employee_id: selectedEmployee.emp_id,
        remarks: assignRemarks
      });
      setShowAssignModal(false);
      fetchSims();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign SIM');
    } finally {
      setAssigning(false);
    }
  };

  const openReturnModal = (sim) => {
    setReturningSim(sim);
    setReturnStatus('Available');
    setReturnRemarks('');
    setShowReturnModal(true);
  };

  const handleReturn = async () => {
    setReturning(true);
    try {
      await corporateSimAPI.return(returningSim.id, {
        new_status: returnStatus,
        remarks: returnRemarks
      });
      setShowReturnModal(false);
      fetchSims();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to return SIM');
    } finally {
      setReturning(false);
    }
  };

  const totalPages = Math.ceil(total / 20);

  const getStatusBadge = (st) => {
    const colors = {
      'Available': 'success',
      'Assigned': 'primary',
      'Active': 'info',
      'Suspended': 'warning',
      'Returned': 'secondary',
      'Lost': 'danger',
      'Damaged': 'danger',
      'Terminated': 'dark'
    };
    return <span className={`badge bg-${colors[st] || 'secondary'}`}>{st}</span>;
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <i className="bi bi-sim me-2"></i>Corporate SIM Cards
          </h2>
          <p className="text-muted mb-0">Manage corporate SIM inventory and assignments</p>
        </div>
        {canPerform('create') && (
          <Link to="/corporate-sims/add" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>Add New SIM
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search by ICCID or Mobile Number..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="col-md-3">
              <select className="form-select" value={carrier} onChange={(e) => { setCarrier(e.target.value); setPage(1); }}>
                <option value="">All Carriers</option>
                {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <option value="">All Status</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setCarrier(''); setStatus(''); setPage(1); }}>
                <i className="bi bi-x-circle me-1"></i>Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-3">
        <span className="text-muted">Showing {sims.length} of {total} SIM cards</span>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ICCID</th>
                    <th>Mobile Number</th>
                    <th>Carrier</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Assignment Date</th>
                    <th style={{ width: '200px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sims.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">
                        No SIM cards found
                      </td>
                    </tr>
                  ) : (
                    sims.map(sim => (
                      <tr key={sim.id}>
                        <td><code className="small">{sim.iccid}</code></td>
                        <td>{sim.mobile_number || <span className="text-muted">—</span>}</td>
                        <td>{sim.carrier}</td>
                        <td>
                          {sim.plan_type}
                          {sim.monthly_cost > 0 && <div className="small text-muted">₹{sim.monthly_cost}/mo</div>}
                        </td>
                        <td>{getStatusBadge(sim.status)}</td>
                        <td>
                          {sim.assigned_employee_name ? (
                            <div>
                              <div className="fw-semibold">{sim.assigned_employee_name}</div>
                              <div className="small text-muted">{sim.assigned_employee_id}</div>
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {sim.assignment_date ? (
                            new Date(sim.assignment_date).toLocaleDateString()
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm" role="group">
                            <Link to={`/corporate-sims/view/${sim.id}`} className="btn btn-outline-primary" title="View">
                              <i className="bi bi-eye"></i>
                            </Link>
                            {canPerform('edit') && (
                              <Link to={`/corporate-sims/edit/${sim.id}`} className="btn btn-outline-secondary" title="Edit">
                                <i className="bi bi-pencil"></i>
                              </Link>
                            )}
                            {canPerform('edit') && sim.status !== 'Assigned' && (
                              <button className="btn btn-outline-success" onClick={() => openAssignModal(sim)} title="Assign">
                                <i className="bi bi-person-plus"></i>
                              </button>
                            )}
                            {canPerform('edit') && sim.status === 'Assigned' && (
                              <button className="btn btn-outline-warning" onClick={() => openReturnModal(sim)} title="Return">
                                <i className="bi bi-arrow-return-left"></i>
                              </button>
                            )}
                            {canPerform('delete') && (
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDelete(sim.id)}
                                disabled={deleting === sim.id || sim.status === 'Assigned'}
                                title={sim.status === 'Assigned' ? 'Cannot delete assigned SIM' : 'Delete'}
                              >
                                {deleting === sim.id ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-trash"></i>}
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => p - 1)}>Previous</button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => p + 1)}>Next</button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assign SIM to Employee</h5>
                <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">SIM Details</label>
                  <div className="p-2 bg-light rounded">
                    <div><strong>ICCID:</strong> {assigningSim.iccid}</div>
                    <div><strong>Mobile:</strong> {assigningSim.mobile_number || 'N/A'}</div>
                    <div><strong>Carrier:</strong> {assigningSim.carrier}</div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Search Employee *</label>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Type employee name or ID..."
                      value={employeeSearch}
                      onChange={(e) => handleEmployeeSearch(e.target.value)}
                    />
                    {employeeSuggestions.length > 0 && (
                      <div className="position-absolute w-100 border rounded bg-white shadow-sm" style={{ zIndex: 1000, maxHeight: 200, overflowY: 'auto' }}>
                        {employeeSuggestions.map(emp => (
                          <div
                            key={emp.emp_id}
                            className="p-2 cursor-pointer"
                            style={{ cursor: 'pointer' }}
                            onClick={() => selectEmployee(emp)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <div className="fw-semibold">{emp.emp_id} — {emp.employee_name}</div>
                            <div className="small text-muted">{emp.email} {emp.mobile_number ? `· ${emp.mobile_number}` : ''}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedEmployee && (
                    <div className="mt-2 p-2 bg-success bg-opacity-10 border border-success rounded">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      <strong>{selectedEmployee.employee_name}</strong> ({selectedEmployee.emp_id})
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Remarks</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Optional notes about this assignment..."
                    value={assignRemarks}
                    onChange={(e) => setAssignRemarks(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleAssign} disabled={!selectedEmployee || assigning}>
                  {assigning ? 'Assigning...' : 'Assign SIM'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Return SIM</h5>
                <button type="button" className="btn-close" onClick={() => setShowReturnModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">SIM Details</label>
                  <div className="p-2 bg-light rounded">
                    <div><strong>ICCID:</strong> {returningSim.iccid}</div>
                    <div><strong>Mobile:</strong> {returningSim.mobile_number || 'N/A'}</div>
                    <div><strong>Currently Assigned To:</strong> {returningSim.assigned_employee_name} ({returningSim.assigned_employee_id})</div>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">New Status *</label>
                  <select className="form-select" value={returnStatus} onChange={(e) => setReturnStatus(e.target.value)}>
                    <option value="Available">Available (Good Condition)</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Lost">Lost</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Remarks</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Optional notes about return condition..."
                    value={returnRemarks}
                    onChange={(e) => setReturnRemarks(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReturnModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleReturn} disabled={returning}>
                  {returning ? 'Processing...' : 'Return SIM'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CorporateSimList;
