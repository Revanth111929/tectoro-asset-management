// EmployeeList.js - List all employees
import React, { useState } from 'react';
import { NavButton } from '../components/NavButton';
import './EmployeeList.css';

function EmployeeList() {
  const [employees] = useState([
    { id: 1, empId: 'EMP001', name: 'Alice Johnson', email: 'alice@company.com', department: 'Engineering', position: 'Software Engineer' },
    { id: 2, empId: 'EMP002', name: 'Bob Williams', email: 'bob@company.com', department: 'Marketing', position: 'Marketing Manager' },
    { id: 3, empId: 'EMP003', name: 'Carol Davis', email: 'carol@company.com', department: 'HR', position: 'HR Specialist' },
    { id: 4, empId: 'EMP004', name: 'David Brown', email: 'david@company.com', department: 'Finance', position: 'Accountant' },
    { id: 5, empId: 'EMP005', name: 'Eva Martinez', email: 'eva@company.com', department: 'Engineering', position: 'DevOps Engineer' },
  ]);

  const handleDownloadTemplate = () => {
    // TODO: Implement download template functionality
    console.log('Download Template');
  };

  const handleBulkImport = () => {
    // TODO: Implement bulk import functionality
    console.log('Bulk Import');
  };

  const handleDownloadCSV = () => {
    // TODO: Implement CSV download functionality
    console.log('Download CSV');
  };

  const handleDownloadExcel = () => {
    // TODO: Implement Excel download functionality
    console.log('Download Excel');
  };

  return (
    <div className="employee-list-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Employee Master</h2>
          <p className="text-muted mb-0">Manage employee records, bulk import, and process exits</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            onClick={handleDownloadTemplate}
            className="emp-action-btn"
            title="Download Template"
          >
            <i className="bi bi-download"></i>
            <span>Download Template</span>
          </button>
          <button 
            onClick={handleBulkImport}
            className="emp-action-btn"
            title="Bulk Import"
          >
            <i className="bi bi-upload"></i>
            <span>Bulk Import</span>
          </button>
          <button 
            onClick={handleDownloadCSV}
            className="emp-action-btn"
            title="Download CSV"
          >
            <i className="bi bi-download"></i>
            <span>Download CSV</span>
          </button>
          <button 
            onClick={handleDownloadExcel}
            className="emp-action-btn"
            title="Download Excel"
          >
            <i className="bi bi-download"></i>
            <span>Download Excel</span>
          </button>
          <NavButton to="/employees/add" className="emp-action-btn emp-action-btn-primary">
            <i className="bi bi-person-plus"></i>
            <span>Add Employee</span>
          </NavButton>
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive" style={{ maxHeight: "calc(100vh - 340px)", overflowY: "auto" }}>
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Position</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td><code>{emp.empId}</code></td>
                  <td className="fw-500">{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.department}</td>
                  <td>{emp.position}</td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <NavButton 
                        to={`/employees/${emp.empId}/asset-history`}
                        className="btn btn-outline-info"
                        title="View Asset History"
                      >
                        <i className="bi bi-clock-history"></i>
                      </NavButton>
                      <button className="btn btn-outline-primary">
                        <i className="bi bi-box-arrow-up-right"></i> Assign
                      </button>
                      <button className="btn btn-outline-secondary">
                        <i className="bi bi-pencil"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default EmployeeList;
