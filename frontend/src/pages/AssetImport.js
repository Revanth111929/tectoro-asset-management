// AssetImport.js - Unified Excel import for ALL asset categories
import React, { useState } from 'react';
import BackButton from '../components/BackButton';
import { NavButton } from '../components/NavButton';
import api from '../services/api';

function AssetImport() {
  const [file, setFile] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      return;
    }

    // Validate file extension
    if (!selectedFile.name.endsWith('.xlsx')) {
      setError('Please select an Excel file with .xlsx extension. If you have .xls, save it as .xlsx in Excel first.');
      setFile(null);
      setPreviewData(null);
      return;
    }

    setFile(selectedFile);
    setError('');
    setPreviewData(null);
    setImportResult(null);

    // Automatically preview
    await previewFile(selectedFile);
  };

  const previewFile = async (fileToPreview) => {
    setPreviewing(true);
    setError('');

    const formData = new FormData();
    formData.append('file', fileToPreview);

    try {
      const response = await api.post('/assets/import/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setPreviewData(response.data);
    } catch (err) {
      console.error('[AssetImport] Preview error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to preview file';
      const errorDetails = err.response?.data?.details || '';
      const suggestion = err.response?.data?.suggestion || '';
      
      setError(
        <div>
          <div><strong>{errorMsg}</strong></div>
          {errorDetails && <div className="mt-1">{errorDetails}</div>}
          {suggestion && <div className="mt-1 text-muted small">{suggestion}</div>}
        </div>
      );
      setFile(null);
      setPreviewData(null);
      document.getElementById('fileInput').value = '';
    } finally {
      setPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!file || !previewData || !previewData.can_import) {
      setError('Cannot import - please fix validation errors first');
      return;
    }

    setImporting(true);
    setError('');
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/assets/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportResult(response.data);
      // Clear file input
      setFile(null);
      setPreviewData(null);
      document.getElementById('fileInput').value = '';
    } catch (err) {
      console.error('[AssetImport] Import error:', err);
      const errorMsg = err.response?.data?.error || 'Import failed';
      const errorDetails = err.response?.data?.error_details || [];
      setError(errorMsg);
      if (errorDetails.length > 0) {
        setImportResult({ error_details: errorDetails });
      }
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async () => {
    setDownloading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/assets/template`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Template download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Asset_Import_Template_Unified.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Template download error:', err);
      setError('Failed to download template: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <BackButton />
            <h2 className="fw-bold mb-0">Import Assets</h2>
          </div>
          <p className="text-muted mb-0">Upload Excel file to add multiple assets at once</p>
        </div>
      </div>

      <div className="row">
        {/* Instructions Card */}
        <div className="col-md-5 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="fw-bold mb-3">
                <i className="bi bi-info-circle text-primary me-2"></i>How to Import
              </h5>
              
              <div className="mb-3">
                <h6 className="fw-bold mb-2">
                  <span className="badge bg-primary me-2">1</span>Download Template
                </h6>
                <p className="text-muted small mb-2">
                  Download the unified Excel template below.
                </p>
                <button
                  onClick={downloadTemplate}
                  disabled={downloading}
                  className="btn btn-primary btn-sm"
                >
                  {downloading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-download me-2"></i>
                      Download Template
                    </>
                  )}
                </button>
              </div>

              <div className="mb-3">
                <h6 className="fw-bold mb-2">
                  <span className="badge bg-primary me-2">2</span>Fill Your Data
                </h6>
                <p className="text-muted small mb-2">
                  The <strong>CATEGORY</strong> column determines where each asset goes:
                </p>
                <ul className="small text-muted mb-0" style={{ paddingLeft: '20px' }}>
                  <li>Laptop</li>
                  <li>Desktop</li>
                  <li>Monitor</li>
                  <li>Printer</li>
                  <li>Phone</li>
                  <li>Server</li>
                  <li>Mouse</li>
                  <li>Headphones</li>
                  <li>Hard Disk</li>
                  <li>Corporate SIM</li>
                </ul>
              </div>

              <div className="mb-3">
                <h6 className="fw-bold mb-2">
                  <span className="badge bg-primary me-2">3</span>Upload Excel File
                </h6>
                <p className="text-muted small mb-0">
                  Select your completed Excel file. The system automatically detects categories from each row.
                </p>
              </div>

              <div className="mb-3">
                <h6 className="fw-bold mb-2">
                  <span className="badge bg-primary me-2">4</span>Review & Import
                </h6>
                <p className="text-muted small mb-0">
                  Review the preview and validation results, then click Import Assets.
                </p>
              </div>

              <div className="alert alert-info py-2 small mb-0">
                <i className="bi bi-lightbulb me-2"></i>
                <strong>Mixed Categories Supported!</strong> You can have Laptop, Desktop, Monitor, and Corporate SIM all in the same file.
              </div>
            </div>
          </div>
        </div>

        {/* Upload Card */}
        <div className="col-md-7">
          <div className="card">
            <div className="card-body">
              <h5 className="fw-bold mb-4">
                <i className="bi bi-cloud-upload text-primary me-2"></i>Upload Excel File
              </h5>

              {/* File Input */}
              <div className="mb-4">
                <label className="form-label fw-500">
                  Select Excel File <span className="text-danger">*</span>
                </label>
                <input
                  id="fileInput"
                  type="file"
                  className="form-control"
                  accept=".xlsx"
                  onChange={handleFileSelect}
                  disabled={previewing || importing}
                />
                <small className="text-muted">Accepted format: .xlsx only</small>
              </div>

              {/* Previewing Status */}
              {previewing && (
                <div className="alert alert-info py-2 mb-3">
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Analyzing Excel file and validating data...
                </div>
              )}

              {/* Preview Results */}
              {file && previewData && !previewing && (
                <div className={`card ${previewData.can_import ? 'border-success' : 'border-warning'} mb-3`}>
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">
                      <i className={`bi ${previewData.can_import ? 'bi-check-circle text-success' : 'bi-exclamation-triangle text-warning'} me-2`}></i>
                      File Analysis Complete
                    </h6>
                    
                    {/* Summary Stats */}
                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <div className="small text-muted">File Name</div>
                        <div className="fw-500">{file.name}</div>
                      </div>
                      <div className="col-6">
                        <div className="small text-muted">Total Rows</div>
                        <div className="fw-500">{previewData.total_rows}</div>
                      </div>
                      <div className="col-6">
                        <div className="small text-muted">Valid Rows</div>
                        <div className="fw-500 text-success">{previewData.valid_rows}</div>
                      </div>
                      <div className="col-6">
                        <div className="small text-muted">Invalid Rows</div>
                        <div className={`fw-500 ${previewData.invalid_rows > 0 ? 'text-danger' : 'text-muted'}`}>
                          {previewData.invalid_rows}
                        </div>
                      </div>
                    </div>

                    {/* Detected Categories */}
                    {previewData.detected_categories && previewData.detected_categories.length > 0 && (
                      <div className="mb-3">
                        <div className="small text-muted mb-2">Detected Categories</div>
                        <div className="d-flex flex-wrap gap-2">
                          {previewData.detected_categories.map((cat) => (
                            <span key={cat} className="badge bg-primary" style={{ fontSize: '13px' }}>
                              {cat}: {previewData.category_counts[cat]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Validation Errors */}
                    {previewData.invalid_rows > 0 && previewData.error_details && (
                      <div className="alert alert-danger py-2 small mb-0">
                        <strong>Validation Errors:</strong>
                        <ul className="mb-0 mt-1" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {previewData.error_details.slice(0, 20).map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                          {previewData.error_details.length > 20 && (
                            <li className="text-muted">... and {previewData.error_details.length - 20} more errors</li>
                          )}
                        </ul>
                        <div className="mt-2">
                          <i className="bi bi-info-circle me-1"></i>
                          Please fix these errors in your Excel file and re-upload.
                        </div>
                      </div>
                    )}

                    {/* Preview Table */}
                    {previewData.preview_rows && previewData.preview_rows.length > 0 && (
                      <div className="mt-3">
                        <div className="small text-muted mb-2">Preview (first {previewData.preview_rows.length} rows)</div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          <table className="table table-sm table-bordered">
                            <thead>
                              <tr>
                                <th>Row</th>
                                <th>Category</th>
                                <th>Asset Name</th>
                                <th>Serial/ICCID</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.preview_rows.map((row) => (
                                <tr key={row.row_number} className={!row.is_valid ? 'table-danger' : ''}>
                                  <td>{row.row_number}</td>
                                  <td><span className="badge bg-secondary">{row.category}</span></td>
                                  <td className="small">{row.asset_name}</td>
                                  <td className="small">{row.serial_or_iccid}</td>
                                  <td>
                                    {row.is_valid ? (
                                      <span className="badge bg-success">Valid</span>
                                    ) : (
                                      <span className="badge bg-danger">
                                        {row.errors.length} error(s)
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="alert alert-danger py-2 mb-3">
                  <i className="bi bi-exclamation-circle me-2"></i>
                  {error}
                </div>
              )}

              {/* Import Result */}
              {importResult && importResult.success && (
                <div className="alert alert-success mb-3">
                  <h6 className="fw-bold mb-2">
                    <i className="bi bi-check-circle me-2"></i>Import Completed Successfully!
                  </h6>
                  <p className="mb-2">{importResult.message}</p>
                  
                  {/* Category Breakdown */}
                  {importResult.category_breakdown && Object.keys(importResult.category_breakdown).length > 0 && (
                    <div className="mb-2">
                      <div className="small fw-bold mb-1">Category Summary:</div>
                      <div className="d-flex flex-wrap gap-2">
                        {Object.entries(importResult.category_breakdown).map(([cat, count]) => (
                          <span key={cat} className="badge bg-success">
                            {cat}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="d-flex gap-3 mb-2">
                    <span className="badge bg-success">
                      <i className="bi bi-check-lg me-1"></i>Imported: {importResult.imported}
                    </span>
                    {importResult.failed > 0 && (
                      <span className="badge bg-warning">
                        <i className="bi bi-exclamation-triangle me-1"></i>Failed: {importResult.failed}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <NavButton to="/assets" className="btn btn-primary btn-sm">
                      <i className="bi bi-list-ul me-2"></i>View All Assets
                    </NavButton>
                  </div>
                </div>
              )}

              {/* Import Button */}
              <button
                onClick={handleImport}
                disabled={!previewData || !previewData.can_import || importing || previewing}
                className="btn btn-primary w-100"
              >
                {importing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Importing assets...
                  </>
                ) : previewData && previewData.can_import ? (
                  <>
                    <i className="bi bi-upload me-2"></i>
                    Import {previewData.valid_rows} Assets
                  </>
                ) : (
                  <>
                    <i className="bi bi-upload me-2"></i>
                    Import Assets
                  </>
                )}
              </button>

              {!file && !previewing && (
                <div className="alert alert-secondary py-2 mt-3 mb-0">
                  <i className="bi bi-arrow-up me-2"></i>
                  Select an Excel file to begin
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssetImport;
