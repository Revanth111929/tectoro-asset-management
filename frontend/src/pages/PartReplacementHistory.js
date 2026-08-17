import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import api from '../services/api';
import './PartReplacementHistory.css';

function PartReplacementHistory() {
  const navigate = useNavigate();
  const [replacements, setReplacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    component: '',
    vendor: '',
    start_date: '',
    end_date: ''
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchReplacements();
    fetchStats();
  }, []);

  const fetchReplacements = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.component) params.component = filters.component;
      if (filters.vendor) params.vendor = filters.vendor;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await api.get('/part-replacements', { params });
      if (response.data.success) {
        setReplacements(response.data.part_replacements || []);
      }
    } catch (error) {
      console.error('Error fetching part replacements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/part-replacements/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const applyFilters = () => {
    fetchReplacements();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      component: '',
      vendor: '',
      start_date: '',
      end_date: ''
    });
    setTimeout(() => fetchReplacements(), 100);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const viewAsset = (assetId) => {
    navigate(`/assets/view/${assetId}`);
  };

  return (
    <div className="part-replacement-history-container">
      {/* Page Header - Compact */}
      <div className="page-header d-flex justify-content-between align-items-start mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2"><BackButton /><h2 className="mb-0">Part Replacement History</h2></div>
          <p>Track replaced components and their history</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/part-replacements/add')}
        >
          <i className="bi bi-plus-circle"></i>
          Replace Part
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-gear-fill"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total_replacements}</div>
              <div className="stat-label">Total Replacements</div>
            </div>
          </div>
          {stats.by_component.length > 0 && (
            <div className="stat-card">
              <div className="stat-icon popular">
                <i className="bi bi-star-fill"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.by_component[0].component}</div>
                <div className="stat-label">Most Replaced ({stats.by_component[0].count}x)</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search component, asset, serial..."
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <input
              type="text"
              name="component"
              value={filters.component}
              onChange={handleFilterChange}
              placeholder="Component name"
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <input
              type="text"
              name="vendor"
              value={filters.vendor}
              onChange={handleFilterChange}
              placeholder="Vendor"
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="filter-input"
              placeholder="From date"
            />
          </div>
          <div className="filter-group">
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="filter-input"
              placeholder="To date"
            />
          </div>
          <button className="btn-filter" onClick={applyFilters}>
            <i className="bi bi-search"></i> Apply
          </button>
          <button className="btn-clear" onClick={clearFilters}>
            <i className="bi bi-x-circle"></i> Clear
          </button>
        </div>
      </div>

      {/* Replacements Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading replacement history...</p>
          </div>
        ) : replacements.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-inbox"></i>
            <p>No part replacements found</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/part-replacements/add')}
            >
              Add First Replacement
            </button>
          </div>
        ) : (
          <table className="replacements-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Asset</th>
                <th>Component</th>
                <th>Reason</th>
                <th>Old Part</th>
                <th>New Part</th>
                <th>Vendor</th>
                <th>Cost</th>
                <th>Installed By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {replacements.map(replacement => (
                <tr key={replacement.id}>
                  <td>{formatDate(replacement.replacement_date)}</td>
                  <td>
                    <div className="asset-cell">
                      <div className="asset-name">{replacement.asset_name}</div>
                      <div className="asset-serial">{replacement.asset_serial}</div>
                    </div>
                  </td>
                  <td>
                    <span className="component-badge">
                      {replacement.component_name}
                    </span>
                  </td>
                  <td>{replacement.replacement_reason}</td>
                  <td>
                    <div className="part-info">
                      {replacement.old_part_serial || 'N/A'}
                      {replacement.old_part_number && (
                        <div className="part-number">{replacement.old_part_number}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="part-info">
                      {replacement.new_part_serial || 'N/A'}
                      {replacement.new_part_number && (
                        <div className="part-number">{replacement.new_part_number}</div>
                      )}
                    </div>
                  </td>
                  <td>{replacement.vendor || 'N/A'}</td>
                  <td className="cost-cell">{formatCurrency(replacement.replacement_cost)}</td>
                  <td>{replacement.installed_by || 'N/A'}</td>
                  <td>
                    <div className="action-group">
                      <button
                        className="action-btn action-view"
                        onClick={() => viewAsset(replacement.asset_id)}
                        title="View Asset"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Results Summary */}
      {!loading && replacements.length > 0 && (
        <div className="results-summary">
          Showing {replacements.length} replacement{replacements.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export default PartReplacementHistory;
