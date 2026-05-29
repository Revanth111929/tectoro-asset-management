// EmployeeAdd.js - Add new employee
import React from 'react';
import { useNavigate } from 'react-router-dom';

function EmployeeAdd() {
  const navigate = useNavigate();

  return (
    <div>
      <h2>Add New Employee</h2>
      <p>Employee form coming soon...</p>
      <button className="btn btn-secondary" onClick={() => navigate('/employees')}>Back to Employees</button>
    </div>
  );
}

export default EmployeeAdd;
