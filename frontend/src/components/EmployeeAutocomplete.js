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
  showDetails = true  // Show email/mobile in dropdown
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
      const response = await employeeAPI.search(term);
      const employees = response.data || [];

      if (employees.length === 0) {
        setNotFound(true);
        setSuggestions([]);
      } else {
        setNotFound(false);
        setSuggestions(employees.filter(emp => emp.status === 'Active' && emp.is_active !== false));
      }
      setShowDropdown(true);
    } catch (err) {
      console.error('Employee search failed:', err);
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
              <div className="col-md-4">
                <small className="text-muted">Designation:</small>
                <div className="fw-500">{value.designation}</div>
              </div>
            )}
            {value.department && (
              <div className="col-md-4">
                <small className="text-muted">Department:</small>
                <div className="fw-500">{value.department}</div>
              </div>
            )}
            {value.email && (
              <div className="col-md-4">
                <small className="text-muted">Email:</small>
                <div className="fw-500 small">{value.email}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeAutocomplete;
