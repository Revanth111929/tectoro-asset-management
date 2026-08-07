// EmployeeAdd.js - Add/Edit Employee - Phase 1 Complete
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employeeAPI } from '../services/api';

function EmployeeAdd() {
  const navigate = useNavigate();
  const { empId } = useParams(); // For edit mode
  const isEditMode = !!empId;

  const [formData, setFormData] = useState({
    emp_id: '',
    employee_name: '',
    designation: '',
    department: '',
    team: '',
    project: '',
    manager: '',
    microsoft_license: '',
    email: '',
    mobile_number: '',
    location: '',
    status: 'Active',
    is_active: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchEmployee();
    }
  }, [empId]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getById(empId);
      setFormData(response.data.employee);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load employee');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.emp_id.trim()) {
      setError('Employee ID is required');
      return;
    }
    if (!formData.employee_name.trim()) {
      setError('Employee Name is required');
      return;
    }
    if (formData.email && !formData.email.includes('@')) {
      setError('Invalid email format');
      return;
    }

    try {
      setLoading(true);
      
      if (isEditMode) {
        await employeeAPI.update(empId, formData);
        setSuccess('Employee updated successfully!');
      } else {
        await employeeAPI.create(formData);
        setSuccess('Employee created successfully!');
      }

      setTimeout(() => {
        navigate('/employees');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-person-plus me-2"></i>
            {isEditMode ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <p className="text-muted mb-0">
            {isEditMode ? 'Update employee information' : 'Create a new employee record'}
          </p>
        </div>
        <button 
          className="btn btn-outline-secondary" 
          onClick={() => navigate('/employees')}
        >
          <i className="bi bi-arrow-left me-2"></i>Back
        </button>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle me-2"></i>{success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {/* Form */}
      <div className="table-card">
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="mb-4">
            <h5 className="fw-bold text-primary mb-3">
              <i className="bi bi-info-circle me-2"></i>Basic Information
            </h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">
                  Employee ID <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="emp_id"
                  className="form-control"
                  value={formData.emp_id}
                  onChange={handleChange}
                  placeholder="e.g., EMP001"
                  required
                  disabled={isEditMode}
                  autoComplete="off"
                />
                <small className="text-muted">Unique identifier (cannot be changed)</small>
              </div>

              <div className="col-md-4">
                <label className="form-label">
                  Employee Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="employee_name"
                  className="form-control"
                  value={formData.employee_name}
                  onChange={handleChange}
                  placeholder="e.g., John Doe"
                  required
                  autoComplete="off"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  className="form-select"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Exited">Exited</option>
                </select>
              </div>
            </div>
          </div>

          {/* Organization Information */}
          <div className="mb-4">
            <h5 className="fw-bold text-primary mb-3">
              <i className="bi bi-building me-2"></i>Organization Information
            </h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Designation</label>
                <input
                  type="text"
                  name="designation"
                  className="form-control"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="e.g., Software Engineer"
                  autoComplete="off"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  name="department"
                  className="form-control"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g., IT"
                  autoComplete="off"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Team</label>
                <input
                  type="text"
                  name="team"
                  className="form-control"
                  value={formData.team}
                  onChange={handleChange}
                  placeholder="e.g., Backend Team"
                  autoComplete="off"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Project</label>
                <input
                  type="text"
                  name="project"
                  className="form-control"
                  value={formData.project}
                  onChange={handleChange}
                  placeholder="e.g., Project Alpha"
                  autoComplete="off"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Manager</label>
                <input
                  type="text"
                  name="manager"
                  className="form-control"
                  value={formData.manager}
                  onChange={handleChange}
                  placeholder="e.g., Manager Name"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-4">
            <h5 className="fw-bold text-primary mb-3">
              <i className="bi bi-telephone me-2"></i>Contact Information
            </h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g., john.doe@company.com"
                  autoComplete="off"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  name="mobile_number"
                  className="form-control"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  placeholder="e.g., +1234567890"
                  autoComplete="off"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Office Location</label>
                <input
                  type="text"
                  name="location"
                  className="form-control"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Office - Floor 1"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          {/* License Information */}
          <div className="mb-4">
            <h5 className="fw-bold text-primary mb-3">
              <i className="bi bi-key me-2"></i>License Information
            </h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Microsoft License</label>
                <input
                  type="text"
                  name="microsoft_license"
                  className="form-control"
                  value={formData.microsoft_license}
                  onChange={handleChange}
                  placeholder="e.g., E3, E5"
                  autoComplete="off"
                />
                <small className="text-muted">Microsoft Office 365 license type</small>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="d-flex justify-content-end gap-2">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => navigate('/employees')}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  {isEditMode ? 'Update Employee' : 'Create Employee'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeAdd;
