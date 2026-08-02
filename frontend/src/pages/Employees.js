// Employees.js - Employee management with exit process
import React, { useState, useEffect } from 'react';
import { employeeAPI, assetAPI } from '../services/api';
import EmployeeExitModal from '../components/EmployeeExitModal';

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      // Get all assets to extract unique employees
      const res = await assetAPI.getAll({});
      const assetsData = res.data.assets || res.data || [];
      
      // Extract unique employees
      const empMap = {};
      assetsData.forEach(asset => {
        if (asset.emp_id && asset.employee_name) {
          if (!empMap[asset.emp_id]) {
            empMap[asset.emp_id] = {
              emp_id: asset.emp_id,
              employee_name: asset.employee_name,
              email: asset.employee_email || '',
              mobile_number: asset.mobile_number || '',
              asset_count: 0,
              status: 'Active',
              assets: []
            };
          }
          empMap[asset.emp_id].asset_count++;
          empMap[asset.emp_id].assets.push(asset);
        }
      });
      
      const employeesList = Object.values(empMap);
      console.log('Loaded employees:', employeesList);
      setEmployees(employeesList);
    } catch (err) {
      console.error('Failed to load employees:', err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExitEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowExitModal(true);
  };

  const handleExitSuccess = (summary) => {
    alert(`✅ Employee exit processed successfully!\n\n` +
      `Employee: ${summary.employee}\n` +
      `Recovered: ${summary.recovered}\n` +
      `Missing: ${summary.missing}\n` +
      `Damaged: ${summary.damaged}`
    );
    loadEmployees();
  };

  const filteredEmployees = employees.filter(emp =>
    emp.employee_name.toLowerCase().includes(search.toLowerCase()) ||
    emp.emp_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Employees</h2>
          <p className="text-muted mb-0">Manage employee records and process exits</p>
        </div>
      </div>

      {/* Search */}
      <div className="table-card mb-3">
        <div className="row g-2">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search employee name or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="table-card">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: "calc(100vh - 340px)", overflowY: "auto" }}>
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>EMP ID</th>
                  <th>Employee Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Assigned Assets</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                      No employees found
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => (
                    <tr key={emp.emp_id}>
                      <td><code className="small">{emp.emp_id}</code></td>
                      <td className="fw-500">{emp.employee_name}</td>
                      <td className="small">{emp.email || '—'}</td>
                      <td className="small">{emp.mobile_number || '—'}</td>
                      <td>
                        <span className="badge bg-primary">{emp.asset_count} assets</span>
                      </td>
                      <td>
                        <span className={`badge ${emp.status === 'Exited' ? 'bg-secondary' : 'bg-success'}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        {emp.status !== 'Exited' && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleExitEmployee(emp)}
                            title="Process Employee Exit"
                          >
                            <i className="bi bi-box-arrow-right me-1"></i>
                            Employee Exit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exit Modal */}
      {showExitModal && selectedEmployee && (
        <EmployeeExitModal
          employee={selectedEmployee}
          onClose={() => {
            setShowExitModal(false);
            setSelectedEmployee(null);
          }}
          onSuccess={handleExitSuccess}
        />
      )}
    </div>
  );
}

export default Employees;
