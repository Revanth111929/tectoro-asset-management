// AssetImport.js - Bulk import assets from Excel
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AssetImport() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setError('Please select an Excel file (.xlsx or .xls)');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/assets/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setResult(response.data);
      setFile(null);
      document.getElementById('fileInput').value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'Import failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    window.open(`${API_BASE_URL}/assets/template`, '_blank');
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Import Assets</h2>
          <p className="text-muted mb-0">Upload Excel file to add multiple assets at once</p>
        </div>
        <Link to="/assets" className="btn btn-outline-primary">
          <i className="bi bi-arrow-left me-2"></i>Back to Assets
        </Link>
      </div>

      <div className="row">
        {/* Instructions Card */}
        <div className="col-md-5 mb-4">
          <div className="table-card">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-info-circle text-primary me-2"></i>How to Import
            </h5>
            
            <div className="mb-4">
              <h6 className="fw-bold mb-2">Step 1: Download Template</h6>
              <p className="text-muted small mb-2">
                Download the Excel template with all required columns and sample data.
              </p>
              <button onClick={downloadTemplate} className="btn btn-success btn-sm">
                <i className="bi bi-download me-2"></i>Download Template
              </button>
            </div>

            <div className="mb-4">
              <h6 className="fw-bold mb-2">Step 2: Fill Your Data</h6>
              <p className="text-muted small mb-2">
                Open the template and fill in your asset data. Required fields:
              </p>
              <ul className="small text-muted">
                <li><strong>Asset Name</strong> - Name of the asset</li>
                <li><strong>Serial Number</strong> - Must be unique</li>
              </ul>
              <p className="text-muted small">All other fields are optional.</p>
            </div>

            <div className="mb-3">
              <h6 className="fw-bold mb-2">Step 3: Upload File</h6>
              <p className="text-muted small mb-0">
                Select your filled Excel file and click "Import Assets" button.
              </p>
            </div>

            <div className="alert alert-warning py-2 small">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>Note:</strong> Duplicate serial numbers will be skipped.
            </div>
          </div>
        </div>

        {/* Upload Card */}
        <div className="col-md-7">
          <div className="table-card">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-cloud-upload text-primary me-2"></i>Upload Excel File
            </h5>

            {/* File Input */}
            <div className="mb-4">
              <label className="form-label fw-500">Select Excel File</label>
              <input
                id="fileInput"
                type="file"
                className="form-control"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <small className="text-muted">Accepted formats: .xlsx, .xls</small>
            </div>

            {/* Selected File Info */}
            {file && (
              <div className="alert alert-info py-2 mb-3">
                <i className="bi bi-file-earmark-excel me-2"></i>
                <strong>Selected:</strong> {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger py-2 mb-3">
                <i className="bi bi-exclamation-circle me-2"></i>{error}
              </div>
            )}

            {/* Success Result */}
            {result && result.success && (
              <div className="alert alert-success mb-3">
                <h6 className="fw-bold mb-2">
                  <i className="bi bi-check-circle me-2"></i>Import Completed!
                </h6>
                <p className="mb-2">{result.message}</p>
                <div className="d-flex gap-3 mb-2">
                  <span className="badge bg-success">
                    <i className="bi bi-check-lg me-1"></i>Imported: {result.imported}
                  </span>
                  {result.errors > 0 && (
                    <span className="badge bg-warning">
                      <i className="bi bi-exclamation-triangle me-1"></i>Errors: {result.errors}
                    </span>
                  )}
                </div>
                {result.error_details && result.error_details.length > 0 && (
                  <div className="mt-2">
                    <small className="fw-bold">Error Details:</small>
                    <ul className="small mb-0 mt-1">
                      {result.error_details.map((err, idx) => (
                        <li key={idx} className="text-danger">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-3">
                  <Link to="/assets" className="btn btn-primary btn-sm">
                    <i className="bi bi-list-ul me-2"></i>View All Assets
                  </Link>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="btn btn-primary w-100"
            >
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Importing...
                </>
              ) : (
                <>
                  <i className="bi bi-upload me-2"></i>Import Assets
                </>
              )}
            </button>
          </div>

          {/* Sample Data Preview */}
          <div className="table-card mt-3">
            <h6 className="fw-bold mb-3">Sample Excel Format</h6>
            <div className="table-responsive">
              <table className="table table-sm table-bordered small">
                <thead className="table-light">
                  <tr>
                    <th>Asset Name</th>
                    <th>Serial Number</th>
                    <th>Category</th>
                    <th>EMP ID</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Dell Laptop XPS 15</td>
                    <td>SN-DELL-001</td>
                    <td>Laptop</td>
                    <td>EMP001</td>
                    <td>Assigned</td>
                  </tr>
                  <tr>
                    <td>HP Monitor 27"</td>
                    <td>SN-MON-002</td>
                    <td>Monitor</td>
                    <td></td>
                    <td>Available</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              This is a simplified preview. Download the template for all columns.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssetImport;
