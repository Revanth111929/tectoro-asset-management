// AssetOperations.js
// Phase 4.1: Operations Engine - Assign & Return
// Context-aware operations component

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { assetAPI, employeeAPI } from '../services/api';
import EmployeeAutocomplete from './EmployeeAutocomplete';

const AssetOperations = ({ asset, onOperationComplete }) => {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentOperation, setCurrentOperation] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Assign operation state
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [assignComments, setAssignComments] = useState('');
  
  // Return operation state
  const [returnComments, setReturnComments] = useState('');
  
  // Load available operations
  useEffect(() => {
    if (asset && asset.id) {
      loadOperations();
    }
  }, [asset]);
  
  const loadOperations = async () => {
    try {
      setLoading(true);
      const response = await assetAPI.getAvailableOperations(asset.id);
      setOperations(response.data.available_operations || []);
    } catch (err) {
      console.error('Failed to load operations:', err);
      setOperations([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleOperationClick = (operation) => {
    setCurrentOperation(operation);
    setShowModal(true);
    // Reset form state
    setSelectedEmployee(null);
    setAssignComments('');
    setReturnComments('');
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentOperation(null);
    setProcessing(false);
  };

  
  const handleAssign = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }
    
    setProcessing(true);
    try {
      const response = await assetAPI.assignAsset({
        asset_id: asset.id,
        emp_id: selectedEmployee.emp_id,
        comments: assignComments
      });
      
      toast.success(`✅ ${response.data.message}`);
      handleCloseModal();
      if (onOperationComplete) {
        onOperationComplete(response.data);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to assign asset';
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setProcessing(false);
    }
  };
  
  const handleReturn = async () => {
    setProcessing(true);
    try {
      const response = await assetAPI.returnAsset({
        asset_id: asset.id,
        comments: returnComments
      });
      
      toast.success(`✅ ${response.data.message}`);
      handleCloseModal();
      if (onOperationComplete) {
        onOperationComplete(response.data);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to return asset';
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setProcessing(false);
    }
  };

  
  if (loading) {
    return <div className="text-muted small">Loading operations...</div>;
  }
  
  if (!operations || operations.length === 0) {
    return <div className="text-muted small">No operations available</div>;
  }
  
  return (
    <>
      {/* Operations Buttons */}
      <div className="btn-group" role="group">
        {operations.map((op, idx) => (
          <button
            key={idx}
            type="button"
            className={`btn btn-${op.color} btn-sm`}
            onClick={() => handleOperationClick(op)}
            title={op.description}
          >
            <i className={`bi bi-${op.icon} me-1`}></i>
            {op.label}
          </button>
        ))}
      </div>
      
      {/* Operation Modal */}
      {showModal && currentOperation && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi bi-${currentOperation.icon} me-2`}></i>
                  {currentOperation.label}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              
              <div className="modal-body">
                {currentOperation.operation === 'assign' && (
                  <div>
                    <p className="text-muted">{currentOperation.description}</p>
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        Select Employee <span className="text-danger">*</span>
                      </label>
                      <EmployeeAutocomplete
                        value={selectedEmployee}
                        onChange={setSelectedEmployee}
                        onClear={() => setSelectedEmployee(null)}
                        required={true}
                        placeholder="Search by Employee ID, Name, Email..."
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Comments (Optional)</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={assignComments}
                        onChange={(e) => setAssignComments(e.target.value)}
                        placeholder="Add any additional notes..."
                      />
                    </div>
                    <div className="alert alert-info small mb-0">
                      <i className="bi bi-info-circle me-1"></i>
                      <strong>Asset:</strong> {asset.asset_name} ({asset.serial_number})
                    </div>
                  </div>
                )}
                
                {currentOperation.operation === 'return' && (
                  <div>
                    <p className="text-muted">{currentOperation.description}</p>
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <strong>Current Assignment:</strong><br/>
                      Employee: {asset.employee_name} ({asset.emp_id})<br/>
                      This asset will be returned to inventory (Status: Available)
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Comments (Optional)</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={returnComments}
                        onChange={(e) => setReturnComments(e.target.value)}
                        placeholder="Reason for return or additional notes..."
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseModal}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className={`btn btn-${currentOperation.color}`}
                  onClick={currentOperation.operation === 'assign' ? handleAssign : handleReturn}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className={`bi bi-${currentOperation.icon} me-1`}></i>
                      {currentOperation.label}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AssetOperations;
