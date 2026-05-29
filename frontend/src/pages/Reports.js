// Reports.js – Export CSV/Excel and view activity log
import React, { useState, useEffect } from 'react';
import { reportAPI } from '../services/api';

function Reports() {
  const [logs,     setLogs]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    setLoading(true);
    reportAPI.getActivityLog({ page, per_page: 20 })
      .then(res => {
        setLogs(res.data.logs  || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    setExporting('csv');
    try {
      const res = await reportAPI.exportCSV();
      downloadBlob(res.data, `IT_Assets_${new Date().toISOString().slice(0,10)}.csv`);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setExporting('');
    }
  };

  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      const res = await reportAPI.exportExcel();
      downloadBlob(res.data, `IT_Assets_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setExporting('');
    }
  };

  const handlePrint = () => window.print();

  const actionColor = {
    CREATE: 'success', UPDATE: 'info', DELETE: 'danger',
    ASSIGN: 'primary', RETURN: 'secondary',
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Reports & Exports</h2>
        <p className="text-muted mb-0">Download asset data and view audit logs</p>
      </div>

      {/* Export Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="table-card text-center py-4">
            <i className="bi bi-file-earmark-spreadsheet fs-1 text-success mb-3 d-block"></i>
            <h6 className="fw-bold mb-1">Export CSV</h6>
            <p className="text-muted small mb-3">All 20 columns, UTF-8 encoded</p>
            <button
              className="btn btn-success"
              onClick={handleExportCSV}
              disabled={exporting === 'csv'}
            >
              {exporting === 'csv'
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Exporting…</>
                : <><i className="bi bi-download me-2"></i>Download CSV</>
              }
            </button>
          </div>
        </div>

        <div className="col-md-4">
          <div className="table-card text-center py-4">
            <i className="bi bi-file-earmark-excel fs-1 text-success mb-3 d-block" style={{ color: '#217346' }}></i>
            <h6 className="fw-bold mb-1">Export Excel</h6>
            <p className="text-muted small mb-3">Formatted .xlsx with styled headers</p>
            <button
              className="btn btn-success"
              onClick={handleExportExcel}
              disabled={exporting === 'excel'}
              style={{ background: '#217346', borderColor: '#217346' }}
            >
              {exporting === 'excel'
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Exporting…</>
                : <><i className="bi bi-download me-2"></i>Download Excel</>
              }
            </button>
          </div>
        </div>

        <div className="col-md-4">
          <div className="table-card text-center py-4">
            <i className="bi bi-printer fs-1 text-secondary mb-3 d-block"></i>
            <h6 className="fw-bold mb-1">Print Report</h6>
            <p className="text-muted small mb-3">Print the current page view</p>
            <button className="btn btn-secondary" onClick={handlePrint}>
              <i className="bi bi-printer me-2"></i>Print
            </button>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="table-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold mb-0">Activity Log <span className="text-muted fw-normal">({total} entries)</span></h6>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">No activity yet</td>
                    </tr>
                  )}
                  {logs.map((log, idx) => (
                    <tr key={log.id}>
                      <td className="text-muted small">{(page - 1) * 20 + idx + 1}</td>
                      <td className="small">{new Date(log.timestamp).toLocaleString()}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar-circle" style={{ width: 26, height: 26, fontSize: '0.7rem' }}>
                            {(log.user || 'A')[0].toUpperCase()}
                          </div>
                          {log.user}
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${actionColor[log.action] || 'secondary'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.module}</td>
                      <td>{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <small className="text-muted">
                  Page {page} of {totalPages}
                </small>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(p => p - 1)}>‹</button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
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

export default Reports;
