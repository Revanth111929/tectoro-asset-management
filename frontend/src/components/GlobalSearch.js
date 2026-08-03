// GlobalSearch.js - Global Smart Search Component
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../services/api';
import './GlobalSearch.css';

function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [filterType, setFilterType] = useState('all');
  const [recentSearches, setRecentSearches] = useState([]);
  
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Handle click outside to close dropdown
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Debounced search
    if (query.length >= 2) {
      setLoading(true);
      
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(async () => {
        try {
          const response = await searchAPI.global(query, filterType);
          setResults(response.data);
          setShowResults(true);
          setSelectedIndex(-1);
        } catch (error) {
          console.error('Search error:', error);
          setResults({ results: { assets: [], employees: [], invoices: [], inventory: [] }, total: 0 });
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setResults(null);
      setShowResults(query.length === 0 && recentSearches.length > 0);
      setLoading(false);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, filterType]);

  const saveToRecentSearches = (searchQuery, result) => {
    const recent = [
      { query: searchQuery, result, timestamp: Date.now() },
      ...recentSearches.filter(s => s.query !== searchQuery)
    ].slice(0, 10);
    
    setRecentSearches(recent);
    localStorage.setItem('recentSearches', JSON.stringify(recent));
  };

  const handleResultClick = (result) => {
    saveToRecentSearches(query, result);
    setShowResults(false);
    setQuery('');
    navigate(result.url);
  };

  const handleRecentSearchClick = (recent) => {
    setQuery(recent.query);
    if (recent.result && recent.result.url) {
      navigate(recent.result.url);
      setShowResults(false);
      setQuery('');
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getAllResults = () => {
    if (!results || !results.results) return [];
    
    const { assets, employees, invoices, inventory } = results.results;
    return [
      ...assets.map(r => ({ ...r, group: 'Assets' })),
      ...employees.map(r => ({ ...r, group: 'Employees' })),
      ...inventory.map(r => ({ ...r, group: 'Inventory' })),
      ...invoices.map(r => ({ ...r, group: 'Invoices' }))
    ];
  };

  const handleKeyDown = (e) => {
    const allResults = getAllResults();
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < allResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && allResults[selectedIndex]) {
        handleResultClick(allResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setQuery('');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'asset':
      case 'inventory':
        return 'laptop';
      case 'employee':
        return 'person';
      case 'invoice':
        return 'receipt';
      default:
        return 'circle';
    }
  };

  const renderResultGroup = (groupName, items) => {
    if (items.length === 0) return null;

    return (
      <div className="search-group" key={groupName}>
        <div className="search-group-title">{groupName}</div>
        {items.map((item, index) => {
          const globalIndex = getAllResults().findIndex(r => r === item);
          const isSelected = globalIndex === selectedIndex;
          
          return (
            <div
              key={index}
              className={`search-result-item ${isSelected ? 'selected' : ''}`}
              onClick={() => handleResultClick(item)}
              onMouseEnter={() => setSelectedIndex(globalIndex)}
            >
              <div className="search-result-icon">
                <i className={`bi bi-${getIcon(item.type)}`}></i>
              </div>
              <div className="search-result-content">
                <div className="search-result-title">{item.title}</div>
                <div className="search-result-subtitle">{item.subtitle}</div>
              </div>
              {item.status && (
                <span className={`badge bg-${item.status === 'Available' ? 'success' : 'primary'}`}>
                  {item.status}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="global-search" ref={searchRef}>
      <div className="search-input-wrapper">
        <i className="bi bi-search search-icon"></i>
        <input
          type="text"
          className="form-control search-input"
          placeholder="Search assets, employees, invoices..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
        />
        {loading && (
          <div className="search-loading">
            <div className="spinner-border spinner-border-sm text-primary"></div>
          </div>
        )}
        {query && (
          <button
            className="search-clear"
            onClick={() => {
              setQuery('');
              setResults(null);
              setShowResults(false);
            }}
          >
            <i className="bi bi-x"></i>
          </button>
        )}
      </div>

      {showResults && (
        <div className="search-dropdown" ref={dropdownRef}>
          {/* Filter Tabs */}
          <div className="search-filters">
            <button
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filterType === 'assets' ? 'active' : ''}`}
              onClick={() => setFilterType('assets')}
            >
              Assets
            </button>
            <button
              className={`filter-btn ${filterType === 'employees' ? 'active' : ''}`}
              onClick={() => setFilterType('employees')}
            >
              Employees
            </button>
            <button
              className={`filter-btn ${filterType === 'inventory' ? 'active' : ''}`}
              onClick={() => setFilterType('inventory')}
            >
              Inventory
            </button>
            <button
              className={`filter-btn ${filterType === 'invoices' ? 'active' : ''}`}
              onClick={() => setFilterType('invoices')}
            >
              Invoices
            </button>
          </div>

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="recent-searches">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="search-group-title">Recent Searches</div>
                <button className="btn btn-sm btn-link text-muted p-0" onClick={clearRecentSearches}>
                  Clear
                </button>
              </div>
              {recentSearches.slice(0, 5).map((recent, index) => (
                <div
                  key={index}
                  className="search-result-item"
                  onClick={() => handleRecentSearchClick(recent)}
                >
                  <div className="search-result-icon">
                    <i className="bi bi-clock-history"></i>
                  </div>
                  <div className="search-result-content">
                    <div className="search-result-title">{recent.query}</div>
                    {recent.result && (
                      <div className="search-result-subtitle">{recent.result.title}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search Results */}
          {results && query && (
            <div className="search-results">
              {results.total === 0 ? (
                <div className="no-results">
                  <i className="bi bi-search mb-2"></i>
                  <div className="fw-bold">No matching records found</div>
                  <div className="text-muted small">Try searching with different keywords</div>
                </div>
              ) : (
                <>
                  {renderResultGroup('Assets', results.results.assets)}
                  {renderResultGroup('Employees', results.results.employees)}
                  {renderResultGroup('Inventory', results.results.inventory)}
                  {renderResultGroup('Invoices', results.results.invoices)}
                </>
              )}
            </div>
          )}

          {/* Keyboard Shortcuts Help */}
          <div className="search-footer">
            <span className="text-muted small">
              <kbd>↑</kbd> <kbd>↓</kbd> to navigate • <kbd>Enter</kbd> to select • <kbd>Esc</kbd> to close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
