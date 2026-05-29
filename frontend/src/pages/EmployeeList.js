// EmployeeList.js - List all employees
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function EmployeeList() {
  const [employees] = useState([
    { id: 1, empId: 'EMP001', name: 'Alice Johnson', email: 'alice@company.com', department: 'Engineering', position: 'Software Engineer' },
    { id: 2, empId: 'EMP002', name: 'Bob Williams', email: 'bob@company.com', department: 'Marketing', position: 'Marketing Manager' },
    { id: 3, empId: 'EMP003', name: 'Carol Davis', email: 'carol@company.com', department: 'HR', position: 'HR Specialist' },
    { id: 4, empId: 'EMP004', name: 'David Brown', email: 'david@company.com', department: 'Finance', position: 'Accountant' },
    { id: 5, empId: 'EMP005', name: 'Eva Martinez', email: 'eva@company.com', department: 'Engineering', position: 'DevOps Engineer' },
  ]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Employees</h2>
          <p className="text-muted mb-0">Manage employee records and asset assignments</p>
        </div>
        <Link to="/employees/add" className="btn btn-primary">
          <i className="bi bi-person-plus me-2"></i>Add Employee
        </Link>
      </div>

      <div className="table-card">
        <div className="table-responsive">
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
