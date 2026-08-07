// EmployeeAutocompleteDemo.js - Phase 2 Demo Page
// Demonstrates Employee Master integration with autocomplete
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeAutocomplete from '../components/EmployeeAutocomplete';

function EmployeeAutocompleteDemo() {
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    asset_name: '',
    serial_number: '',
    category: 'Laptop'
  });

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    console.log('Selected employee:', employee);
  };

  const handleEmployeeClear = () => {
    setSelectedEmployee(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      alert('Please select an employee from Employee Master');
      return;
    }

    console.log('Form submitted:', {
      employee: selectedEmployee,
      asset: formData
    });

    alert(`✅ Phase 2 Demo\n\nEmployee: ${selectedEmployee.employee_name} (${selectedEmployee.emp_id})\nAsset: ${formData.asset_name}\n\nEmployee Master integration working!`);
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-search me-2"></i>Phase 2 Demo: Employee Master Integration
          </h2>
          <p className="text-muted mb-0">
            Test Employee Autocomplete from Employee Master
          </p>
        </div>
        <button 
          className="btn btn-outline-secondary"
          onClick={() => navigate('/employees')}
        >
          <i className="bi bi-arrow-left me-2"></i>Back to Employees
        </button>
      </div>

      {/* Info Card */}
      <div className="alert alert-info mb-4">
        <h5 className="alert-heading">
          <i className="bi bi-info-circle me-2"></i>Phase 2 Features
        </h5>
        <ul className="mb-0">
          <li>✅ Employee search from Employee Master (not assets)</li>
          <li>✅ Autocomplete dropdown with suggestions</li>
          <li>✅ Auto-fill employee information</li>
          <li>✅ Validation: Employee must exist in Employee Master</li>
          <li>✅ Shows employee details (designation, department, email, phone)</li>
          <li>✅ Only shows Active employees</li>
        </ul>
      </div>

      {/* Demo Form */}
      <div className="table-card">
        <form onSubmit={handleSubmit}>
          <h5 className="fw-bold text-primary mb-3">
            <i className="bi bi-person-check me-2"></i>Step 1: Select Employee
          </h5>

          <div className="row g-3 mb-4">
            <div className="col-md-12">
              <label className="form-label">
                Search Employee <span className="text-danger">*</span>
              </label>
              <EmployeeAutocomplete
                value={selectedEmployee}
                onChange={handleEmployeeSelect}
                onClear={handleEmployeeClear}
                required={true}
                placeholder="Type employee ID, name, email, or phone..."
                showDetails={true}
              />
              <small className="text-muted">
                Try searching: Employee ID, Name, Email, or Phone Number
              </small>
            </div>
          </div>

          {/* Selected Employee Info */}
          {selectedEmployee && (
            <div className="alert alert-success mb-4">
              <h6 className="alert-heading">
                <i className="bi bi-check-circle me-2"></i>Employee Selected
              </h6>
              <div className="row g-2">
                <div className="col-md-3">
                  <small className="text-muted">Employee ID:</small>
                  <div className="fw-bold">{selectedEmployee.emp_id}</div>
                </div>
                <div className="col-md-3">
                  <small className="text-muted">Name:</small>
                  <div className="fw-bold">{selectedEmployee.employee_name}</div>
                </div>
                <div className="col-md-3">
                  <small className="text-muted">Department:</small>
                  <div className="fw-bold">{selectedEmployee.department || '—'}</div>
                </div>
                <div className="col-md-3">
                  <small className="text-muted">Status:</small>
                  <div>
                    <span className="badge bg-success">{selectedEmployee.status}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <hr />

          <h5 className="fw-bold text-primary mb-3">
            <i className="bi bi-laptop me-2"></i>Step 2: Asset Details
          </h5>

          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label">Asset Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.asset_name}
                onChange={(e) => setFormData(f => ({ ...f, asset_name: e.target.value }))}
                placeholder="e.g., Dell Latitude 5430"
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Serial Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.serial_number}
                onChange={(e) => setFormData(f => ({ ...f, serial_number: e.target.value }))}
                placeholder="e.g., SN123456"
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
              >
                <option value="Laptop">Laptop</option>
                <option value="Monitor">Monitor</option>
                <option value="Phone">Phone</option>
                <option value="Printer">Printer</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="d-flex justify-content-end gap-2">
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/employees')}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn btn-primary"
            >
              <i className="bi bi-check-circle me-2"></i>
              Test Assignment
            </button>
          </div>
        </form>
      </div>

      {/* Testing Instructions */}
      <div className="mt-4">
        <div className="table-card">
          <h5 className="fw-bold mb-3">
            <i className="bi bi-clipboard-check me-2"></i>Testing Instructions
          </h5>
          <ol>
            <li>Type at least 2 characters in the employee search field</li>
            <li>Dropdown will show matching employees from Employee Master</li>
            <li>Click on an employee to select them</li>
            <li>Employee details will auto-fill below the search box</li>
            <li>If employee not found, you'll see validation message</li>
            <li>Fill in asset details and click "Test Assignment"</li>
          </ol>

          <div className="alert alert-warning mt-3">
            <strong>Note:</strong> This is a demo page. In the real implementation, this will be integrated into:
            <ul className="mb-0 mt-2">
              <li>Asset Add page (Existing Device tab)</li>
              <li>Asset Edit page</li>
              <li>Operations Center (future)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeAutocompleteDemo;
