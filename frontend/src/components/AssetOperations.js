// AssetOperations.js
// Phase 4.1-4.2: Operations Engine - Assign, Return, Transfer
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
  
  // Transfer operation state
  const [transferEmployee, setTransferEmployee] = useState(null);
  const [transferReason, setTransferReason] = useState('');
  const [transferComments, setTransferComments] = useState('');
  const [transferMode, setTransferMode] = useState('simple'); // 'simple' or 'swap'
  const [employeeAssets, setEmployeeAssets] = useState([]);
  const [selectedSwapAsset, setSelectedSwapAsset] = useState(null);
  const [loadingEmployeeAssets, setLoadingEmployeeAssets] = useState(false);
  
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
    setTransferEmployee(null);
    setTransferReason('');
    setTransferComments('');
    setTransferMode('simple');
    setEmployeeAssets([]);
    setSelectedSwapAsset(null);
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

  const handleTransferEmployeeSelect = async (employee) => {
    setTransferEmployee(employee);
    if (employee && employee.emp_id) {
      // Load employee's current assets to check for swap option
      setLoadingEmployeeAssets(true);
      try {
        const response = await assetAPI.getAll({ emp_id: employee.emp_id, status: 'Assigned' });
        const assets = response.data.assets || response.data || [];
        setEmployeeAssets(assets);
        // If employee has assets in same category, enable swap mode option
        const sameCategory = assets.filter(a => a.category === asset.category);
        if (sameCategory.length > 0) {
          // Don't auto-switch to swap, just show the option
        }
      } catch (err) {
        console.error('Failed to load employee assets:', err);
        setEmployeeAssets([]);
      } finally {
        setLoadingEmployeeAssets(false);
      }
    } else {
      setEmployeeAssets([]);
      setSelectedSwapAsset(null);
    }
  };

  const handleTransfer = async () => {
    if (!transferEmployee) {
      toast.error('Please select a target employee');
      return;
    }
    if (!transferReason.trim()) {
      toast.error('Transfer reason is required');
      return;
    }
    if (transferMode === 'swap' && !selectedSwapAsset) {
      toast.error('Please select an asset to swap');
      return;
    }
    
    setProcessing(true);
    try {
      const payload = {
        asset_id: asset.id,
        to_emp_id: transferEmployee.emp_id,
        reason: transferReason,
        comments: transferComments
      };
      
      if (transferMode === 'swap' && selectedSwapAsset) {
        payload.swap_asset_id = selectedSwapAsset.id;
      }
      
      const response = await assetAPI.transferAsset(payload);
      
      toast.success(`✅ ${response.data.message}`);
      handleCloseModal();
      if (onOperationComplete) {
        onOperationComplete(response.data);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to transfer asset';
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
                
                {currentOperation.operation === 'transfer' && (
                  <div>
                    <p className="text-muted">{currentOperation.description}</p>
                    
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>Current Assignment:</strong><br/>
                      Employee: {asset.employee_name} ({asset.emp_id})<br/>
                      Asset: {asset.asset_name} ({asset.serial_number})
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        Target Employee <span className="text-danger">*</span>
                      </label>
                      <EmployeeAutocomplete
                        value={transferEmployee}
                        onChange={handleTransferEmployeeSelect}
                        onClear={() => {
                          setTransferEmployee(null);
                          setEmployeeAssets([]);
                          setSelectedSwapAsset(null);
                        }}
                        required={true}
                        placeholder="Search by Employee ID, Name, Email..."
                      />
                      {loadingEmployeeAssets && (
                        <div className="text-muted small mt-1">
                          <span className="spinner-border spinner-border-sm me-1"></span>
                          Loading employee assets...
                        </div>
                      )}
                    </div>
                    
                    {transferEmployee && employeeAssets.length > 0 && (
                      <div className="mb-3">
                        <label className="form-label fw-bold">Transfer Mode</label>
                        <div className="btn-group w-100" role="group">
                          <input
                            type="radio"
                            className="btn-check"
                            id="transfer-simple"
                            checked={transferMode === 'simple'}
                            onChange={() => {
                              setTransferMode('simple');
                              setSelectedSwapAsset(null);
                            }}
                          />
                          <label className="btn btn-outline-primary" htmlFor="transfer-simple">
                            <i className="bi bi-arrow-right me-1"></i>
                            Simple Transfer
                          </label>
                          
                          <input
                            type="radio"
                            className="btn-check"
                            id="transfer-swap"
                            checked={transferMode === 'swap'}
                            onChange={() => setTransferMode('swap')}
                          />
                          <label className="btn btn-outline-info" htmlFor="transfer-swap">
                            <i className="bi bi-arrow-left-right me-1"></i>
                            Swap Assets
                          </label>
                        </div>
                        <div className="form-text">
                          {transferMode === 'simple' 
                            ? `${asset.employee_name} will lose this asset. ${transferEmployee.employee_name} will receive it.`
                            : `Exchange assets between ${asset.employee_name} and ${transferEmployee.employee_name}.`
                          }
                        </div>
                      </div>
                    )}
                    
                    {transferMode === 'swap' && employeeAssets.length > 0 && (
                      <div className="mb-3">
                        <label className="form-label fw-bold">
                          Select Asset to Swap <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={selectedSwapAsset?.id || ''}
                          onChange={(e) => {
                            const assetId = parseInt(e.target.value);
                            const swapAsset = employeeAssets.find(a => a.id === assetId);
                            setSelectedSwapAsset(swapAsset || null);
                          }}
                        >
                          <option value="">-- Select Asset --</option>
                          {employeeAssets.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.asset_name} - {a.serial_number} ({a.category})
                            </option>
                          ))}
                        </select>
                        {selectedSwapAsset && (
                          <div className="alert alert-success mt-2 mb-0 small">
                            <strong>Swap Result:</strong><br/>
                            • {asset.employee_name} will receive: {selectedSwapAsset.asset_name}<br/>
                            • {transferEmployee.employee_name} will receive: {asset.asset_name}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        Transfer Reason <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={transferReason}
                        onChange={(e) => setTransferReason(e.target.value)}
                        placeholder="e.g., Replacement device, Role change, etc."
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Additional Comments (Optional)</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={transferComments}
                        onChange={(e) => setTransferComments(e.target.value)}
                        placeholder="Any additional notes..."
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
                  onClick={
                    currentOperation.operation === 'assign' ? handleAssign :
                    currentOperation.operation === 'return' ? handleReturn :
                    currentOperation.operation === 'transfer' ? handleTransfer :
                    null
                  }
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
