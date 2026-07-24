// OnboardingList.js – New Employee Onboarding list with search, filter, pagination
import { canPerform } from '../utils/permissions';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { onboardingAPI } from '../services/api';

const TEAMS = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Support', 'Design', 'Other'];
const STATUSES = ['Pending', 'In Progress', 'Completed', 'Converted'];

function OnboardingList() {
  const [records, setRecords] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [deleting, setDeleting] = useState(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [team,   setTeam]   = useState('');
  const [page,   setPage]   = useState(1);
  const [sortBy, setSortBy] = useState('created_desc');

  const fetchRecords = useCallback(() => {
    setLoading(true);
    onboardingAPI.getAll({ search, status, team, page, per_page: 10, sort: sortBy })
      .then(res => {
        setRecords(res.data.records || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => setError('Failed to load onboarding records'))
      .finally(() => setLoading(false));
  }, [search, status, team, page, sortBy]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  useEffect(() => { setPage(1); }, [search, status, team]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete onboarding record for "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await onboardingAPI.delete(id);
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete record');
    } finally {
      setDeleting(null);
    }
  };

  const statusBadge = (s) => {
    const map = {
      Pending:      'secondary',
      'In Progress': 'warning',
      Completed:    'info',
      Converted:    'success',
    };
    return <span className={`badge bg-${map[s] || 'secondary'}`}>{s}</span>;
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">New Employee Onboarding</h2>
          <p className="text-muted mb-0">{total} total records</p>
        </div>
        {canPerform('create') && (
          <Link to="/onboarding/add" className="btn btn-primary">
            <i className="bi bi-person-plus me-2"></i>New Onboarding
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
                placeholder="Search name, email, phone…"
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
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" value={team} onChange={e => setTeam(e.target.value)}>
              <option value="">All Teams</option>
              {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}>
              <option value="created_desc">Sort: Newest First</option>
              <option value="created_asc">Sort: Oldest First</option>
              <option value="name_asc">Sort: Name (A→Z)</option>
              <option value="name_desc">Sort: Name (Z→A)</option>
            </select>
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => { setSearch(''); setStatus(''); setTeam(''); setSortBy('created_desc'); }}
            >
              <i className="bi bi-x-circle me-1"></i>Clear
            </button>
          </div>
        </div>
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
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone Number</th>
                    <th>Designation</th>
                    <th>Team</th>
                    <th>Assets Assigned</th>
                    <th>Application Access</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 && (
                    <tr>
                      <td colSpan={11} className="text-center py-5 text-muted">
                        <i className="bi bi-person-plus fs-2 d-block mb-2"></i>
                        No onboarding records found
                      </td>
                    </tr>
                  )}
                  {records.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="text-muted small">{(page - 1) * 10 + idx + 1}</td>
                      <td className="fw-500">{r.name}</td>
                      <td className="small">{r.email}</td>
                      <td className="small">{r.phone_number}</td>
                      <td className="small">{r.designation}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{r.team}</span>
                      </td>
                      <td className="small">
                        {r.assets_assigned && r.assets_assigned.length > 0
                          ? <span className="badge bg-primary">{r.assets_assigned.length} asset{r.assets_assigned.length !== 1 ? 's' : ''}</span>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td className="small">
                        {r.application_access && r.application_access.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {r.application_access.slice(0, 2).map(app => (
                              <span key={app} className="badge bg-light text-dark border" style={{ fontSize: '10px' }}>{app}</span>
                            ))}
                            {r.application_access.length > 2 && (
                              <span className="badge bg-light text-dark border" style={{ fontSize: '10px' }}>
                                +{r.application_access.length - 2}
                              </span>
                            )}
                          </div>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td>{statusBadge(r.status)}</td>
                      <td className="small text-muted">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Link to={`/onboarding/view/${r.id}`} className="btn btn-outline-primary" title="View">
                            <i className="bi bi-eye"></i>
                          </Link>
                          {canPerform('edit') && r.status !== 'Converted' && (
                            <Link to={`/onboarding/edit/${r.id}`} className="btn btn-outline-secondary" title="Edit">
                              <i className="bi bi-pencil"></i>
                            </Link>
                          )}
                          {canPerform('delete') && r.status !== 'Converted' && (
                            <button
                              className="btn btn-outline-danger"
                              title="Delete"
                              disabled={deleting === r.id}
                              onClick={() => handleDelete(r.id, r.name)}
                            >
                              {deleting === r.id
                                ? <span className="spinner-border spinner-border-sm"></span>
                                : <i className="bi bi-trash"></i>}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
    </div>
  );
}

export default OnboardingList;
