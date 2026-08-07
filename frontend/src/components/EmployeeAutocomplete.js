// EmployeeAutocomplete.js - Phase 2: Employee Master Integration
// Reusable employee search with autocomplete from Employee Master
import React, { useState, useEffect, useRef } from 'react';
import { employeeAPI } from '../services/api';
import './EmployeeAutocomplete.css';

function EmployeeAutocomplete({ 
  value,           // Selected employee object { emp_id, employee_name, email, mobile_number, ... }
  onChange,        // Callback when employee selected: (employee) => void
  onClear,         // Callback when cleared: () => void
  required = false,
  disabled = false,
  placeholder = "Search employee by ID, name, email...",
  error = null,
  showDetails = true,  // Show email/mobile in dropdown
  activeOnly = false   // BUG FIX: Filter to only Active employees (for asset assignment)
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Display selected employee in input
  useEffect(() => {
    if (value && value.employee_name) {
      setSearchTerm(`${value.emp_id} - ${value.employee_name}`);
      setNotFound(false);
    } else {
      setSearchTerm('');
    }
  }, [value]);

  // Search employees from Employee Master
  const handleSearch = async (term) => {
    setSearchTerm(term);
    setNotFound(false);

    if (term.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    try {
      setLoading(true);
      // BUG FIX: Pass active_only parameter when filtering for asset assignment
      const params = { q: term };
      if (activeOnly) {
        params.active_only = 'true';
      }
      
      // STEP 2: Log the params being sent
      console.log('[EmployeeAutocomplete] Search params:', params);
      console.log('[EmployeeAutocomplete] activeOnly prop:', activeOnly);
      console.log('[EmployeeAutocomplete] API call: GET /api/employees with params:', JSON.stringify(params));
      
      const response = await employeeAPI.search(params);
      const employees = response.data || [];

      // STEP 6: Log the response received
      console.log('[EmployeeAutocomplete] API response received:', employees.length, 'employees');
      console.log('[EmployeeAutocomplete] First 3 employees:', employees.slice(0, 3).map(e => ({
        emp_id: e.emp_id,
        name: e.employee_name,
        status: e.status
      })));
      
      // Check for non-Active employees in response
      const nonActive = employees.filter(e => e.status !== 'Active');
      if (nonActive.length > 0 && activeOnly) {
        console.warn('[EmployeeAutocomplete] WARNING: activeOnly=true but response contains non-Active employees!');
        console.warn('[EmployeeAutocomplete] Non-Active employees:', nonActive.map(e => ({
          emp_id: e.emp_id,
          name: e.employee_name,
          status: e.status
        })));
      }

      if (employees.length === 0) {
        setNotFound(true);
        setSuggestions([]);
      } else {
        setNotFound(false);
        setSuggestions(employees);
      }
      setShowDropdown(true);
    } catch (err) {
      console.error('[EmployeeAutocomplete] Employee search failed:', err);
      setSuggestions([]);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Employee selected from dropdown
  const handleSelect = (employee) => {
    setSearchTerm(`${employee.emp_id} - ${employee.employee_name}`);
    setSuggestions([]);
    setShowDropdown(false);
    setNotFound(false);
    
    if (onChange) {
      onChange(employee);
    }
  };

  // Clear selection
  const handleClear = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowDropdown(false);
    setNotFound(false);
    
    if (onClear) {
      onClear();
    }
  };

  // Validate on blur
  const handleBlur = () => {
    // If user typed something but didn't select, try to find exact match
    if (searchTerm && !value) {
      setTimeout(() => {
        if (suggestions.length === 1) {
          // Auto-select if only one match
          handleSelect(suggestions[0]);
        } else if (suggestions.length === 0 && searchTerm.length >= 2) {
          setNotFound(true);
        }
      }, 200);
    }
  };

  return (
    <div ref={wrapperRef} className="employee-autocomplete">
      <div className="input-group">
        <span className="input-group-text">
          <i className={`bi ${loading ? 'bi-hourglass-split' : 'bi-person-circle'}`}></i>
        </span>
        <input
          type="text"
          className={`form-control ${error || notFound ? 'is-invalid' : ''}`}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onBlur={handleBlur}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
        />
        {searchTerm && (
          <button 
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleClear}
            disabled={disabled}
          >
            <i className="bi bi-x"></i>
          </button>
        )}
      </div>

      {/* Validation Messages */}
      {notFound && (
        <div className="invalid-feedback d-block">
          <i className="bi bi-exclamation-circle me-1"></i>
          Employee not found in Employee Master. Please add them first.
        </div>
      )}
      {error && (
        <div className="invalid-feedback d-block">
          <i className="bi bi-exclamation-circle me-1"></i>
          {error}
        </div>
      )}

      {/* Dropdown Suggestions */}
      {showDropdown && suggestions.length > 0 && (
        <div className="employee-autocomplete-dropdown">
          <div className="dropdown-header">
            <small className="text-muted">
              {suggestions.length} employee{suggestions.length !== 1 ? 's' : ''} found
            </small>
          </div>
          {suggestions.map(emp => (
            <div
              key={emp.emp_id}
              className="employee-autocomplete-item"
              onClick={() => handleSelect(emp)}
            >
              <div className="employee-main">
                <span className="employee-id">{emp.emp_id}</span>
                <span className="employee-name">{emp.employee_name}</span>
                {emp.status === 'Inactive' && (
                  <span className="badge bg-warning ms-2">Inactive</span>
                )}
                {emp.status === 'Exited' && (
                  <span className="badge bg-secondary ms-2">Exited</span>
                )}
              </div>
              {showDetails && (
                <div className="employee-details">
                  {emp.designation && <span>{emp.designation}</span>}
                  {emp.department && <span>{emp.department}</span>}
                  {emp.email && <span><i className="bi bi-envelope me-1"></i>{emp.email}</span>}
                  {emp.mobile_number && <span><i className="bi bi-phone me-1"></i>{emp.mobile_number}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="text-muted small mt-1">
          <span className="spinner-border spinner-border-sm me-2"></span>
          Searching Employee Master...
        </div>
      )}

      {/* Selected Employee Details (if value exists) */}
      {value && value.emp_id && (
        <div className="selected-employee-info">
          <div className="row g-2 mt-1">
            {value.designation && (
              <div className="col-md-6">
                <small className="text-muted">Designation:</small>
                <div className="fw-500">{value.designation}</div>
              </div>
            )}
            {value.department && (
              <div className="col-md-6">
                <small className="text-muted">Department:</small>
                <div className="fw-500">{value.department}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeAutocomplete;
