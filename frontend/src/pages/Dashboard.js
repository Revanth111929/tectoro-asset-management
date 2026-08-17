// Dashboard.js – Redesigned to match reference structure
import React, { useState, useEffect } from 'react';
import { NavButton } from '../components/NavButton';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { dashboardAPI } from '../services/api';
import { formatDateTime } from '../utils/dateUtils';
import { canPerform } from '../utils/permissions';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);
ChartJS.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [lifecycleStats, setLifecycleStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats and activity (required for all users)
        const [statsRes, actRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getActivity()
        ]);
        
        setStats(statsRes.data);
        setActivity(actRes.data.logs || []);
        
        // Fetch lifecycle stats (optional, may fail for non-admin users)
        try {
          const lifecycleRes = await dashboardAPI.getLifecycleStats();
          setLifecycleStats(lifecycleRes?.data?.stats || lifecycleRes?.stats || {});
        } catch (lifecycleError) {
          // Lifecycle stats not available for this user - not an error
          console.log('Lifecycle stats not available:', lifecycleError.response?.status);
          setLifecycleStats(null);
        }
      } catch (error) {
        console.error('Dashboard data error:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">{error}</div>
    );
  }

  const laptopTotal = stats.laptopStats?.total || 0;

  const statusChart = {
    labels: ['Available', 'Assigned', 'Maintenance', 'Retired'],
    datasets: [{
      data: [
        stats.laptopStats?.available || 0,
        stats.laptopStats?.assigned || 0,
        stats.laptopStats?.maintenance || 0,
        stats.laptopStats?.retired || 0
      ],
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#6b7280'],
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 12,
          font: { size: 11 },
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                return {
                  text: `${label}: ${value}`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed}`
        }
      }
    },
    cutout: '70%',
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const statusMap = ['Available', 'Assigned', 'Maintenance', 'Retired'];
        navigate(`/assets?status=${statusMap[index]}`);
      }
    },
  };

  const catChart = {
    labels: stats.categories.map(c => c.name),
    datasets: [{
      label: 'Count',
      data: stats.categories.map(c => c.count),
      backgroundColor: '#3b82f6',
      borderRadius: 4,
    }],
  };

  const barOptions = {
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 11 } }
      },
      x: {
        ticks: { font: { size: 11 } }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const categoryName = stats.categories[index].name;
        navigate(`/inventory/${categoryName.toLowerCase()}`);
      }
    },
  };

  const actionColor = {
    CREATE: 'success',
    UPDATE: 'info',
    DELETE: 'danger',
    ASSIGN: 'primary',
    RETURN: 'secondary'
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of your asset management</p>
        </div>
        {canPerform('create') && (
          <NavButton to="/assets/add" className="btn btn-primary">
            <i className="bi bi-plus-circle"></i>
            Add Asset
          </NavButton>
        )}
      </div>

      {/* KPI Cards - Minimal monochrome enterprise style */}
      <div className="row g-3 mb-4">
        {[
          {
            label: 'Total Assets',
            value: stats.laptopStats?.total || 0,
            icon: 'bi-laptop',
            sublabel: 'All Assets',
            link: '/inventory/laptop'
          },
          {
            label: 'Assigned Assets',
            value: stats.laptopStats?.assigned || 0,
            icon: 'bi-person-check-fill',
            sublabel: 'Currently Assigned',
            link: '/assets?status=Assigned'
          },
          {
            label: 'Available Assets',
            value: stats.laptopStats?.available || 0,
            icon: 'bi-box-seam',
            sublabel: 'In Inventory',
            link: '/assets?status=Available'
          },
          {
            label: 'Under Repair',
            value: stats.laptopStats?.maintenance || 0,
            icon: 'bi-tools',
            sublabel: 'Out for Repair',
            link: '/assets?status=Maintenance'
          },
          {
            label: 'Retired Assets',
            value: stats.laptopStats?.retired || 0,
            icon: 'bi-archive',
            sublabel: 'Retired',
            link: '/assets?status=Retired'
          },
        ].map((item, i) => (
          <div className="col-6 col-md-4 col-xl" key={i}>
            <div className="stat-card" onClick={() => navigate(item.link)}>
              <div className="stat-icon">
                <i className={`bi ${item.icon}`}></i>
              </div>
              <div className="stat-value">{item.value}</div>
              <div className="stat-label">{item.label}</div>
              <div className="stat-sublabel">{item.sublabel}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid - Two Column Layout */}
      <div className="row g-3 mb-4">
        {/* Recent Activity */}
        <div className="col-lg-7">
          <div className="table-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0" style={{ fontSize: '15px' }}>Recent Activity</h6>
              <NavButton to="/activity-history" className="btn btn-sm btn-outline-primary">
                View All
              </NavButton>
            </div>
            <div className="table-responsive" style={{ maxHeight: '320px' }}>
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Description</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        <i className="bi bi-inbox" style={{ fontSize: '32px', opacity: 0.3 }}></i>
                        <p className="mb-0 mt-2">No activity yet</p>
                      </td>
                    </tr>
                  )}
                  {activity.slice(0, 10).map(log => (
                    <tr key={log.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar-circle" style={{ width: 26, height: 26, fontSize: '11px' }}>
                            {(log.user || 'A')[0].toUpperCase()}
                          </div>
                          <span style={{ fontSize: '13px' }}>{log.user}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${actionColor[log.action] || 'secondary'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px' }}>{log.module}</td>
                      <td className="text-truncate" style={{ maxWidth: 220, fontSize: '13px' }}>
                        {log.description}
                      </td>
                      <td className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {formatDateTime(log.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Assets by Category Chart */}
        <div className="col-lg-5">
          <div className="table-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0" style={{ fontSize: '15px' }}>Assets by Category</h6>
              <NavButton to="/reports" className="btn btn-sm btn-outline-primary">
                View Report
              </NavButton>
            </div>
            <div style={{ position: 'relative', height: '280px' }}>
              <Doughnut
                data={statusChart}
                options={chartOptions}
                style={{ maxHeight: '280px', cursor: 'pointer' }}
              />
              <div style={{
                position: 'absolute',
                top: '35%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {laptopTotal}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Total
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="row g-3 mb-4">
        {/* Warranty Expiring */}
        <div className="col-lg-5">
          <div className="table-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0" style={{ fontSize: '15px' }}>
                <i className="bi bi-shield-exclamation me-2" style={{ color: 'var(--warning)' }}></i>
                Warranty Expiring Soon
              </h6>
              <NavButton to="/warranty?filter=expiring90" className="btn btn-sm btn-outline-primary">
                View All
              </NavButton>
            </div>
            <div style={{ padding: '16px 0' }}>
              <div className="d-flex align-items-center justify-content-center">
                <div className="text-center">
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--warning-light)',
                    border: '3px solid var(--warning)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}>
                    <i className="bi bi-shield-exclamation" style={{ fontSize: '28px', color: 'var(--warning)' }}></i>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--warning)' }}>
                    {stats.expiringWarranties || 0}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Assets expiring in 90 days
                  </div>
                  <NavButton
                    to="/warranty?filter=expiring90"
                    className="btn btn-sm btn-warning mt-3"
                    style={{ fontSize: '12px' }}
                  >
                    Review Warranties
                  </NavButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Distribution Bar Chart */}
        <div className="col-lg-7">
          <div className="table-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0" style={{ fontSize: '15px' }}>Asset Distribution</h6>
            </div>
            <div style={{ height: '200px' }}>
              <Bar
                data={catChart}
                options={barOptions}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lifecycle Stats (Admin Only) - Minimal dark style */}
      {canPerform('create') && lifecycleStats && (
        <div className="table-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0" style={{ fontSize: '15px' }}>
              <i className="bi bi-graph-up-arrow me-2" style={{ color: 'var(--primary)' }}></i>
              Lifecycle Tracking
            </h6>
            <NavButton to="/activity-history" className="btn btn-sm btn-outline-primary">
              View Details
            </NavButton>
          </div>
          <div className="row g-3">
            {[
              {
                label: 'Active Temp Assignments',
                value: lifecycleStats.active_temp_assignments || 0,
                icon: 'bi-arrow-repeat',
                desc: 'Loaner devices',
                link: '/temporary-assignments'
              },
              {
                label: 'Replaced This Month',
                value: lifecycleStats.assets_replaced_this_month || 0,
                icon: 'bi-arrow-left-right',
                desc: 'Asset swaps',
                link: '/asset-replacements'
              },
              {
                label: 'Lifecycle Events',
                value: lifecycleStats.total_lifecycle_events || 0,
                icon: 'bi-clock-history',
                desc: 'Total changes',
                link: '/activity-history'
              },
            ].map((stat, idx) => (
              <div className="col-6 col-md-4" key={idx}>
                <div
                  className="glass-card"
                  onClick={() => navigate(stat.link)}
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div className="d-flex align-items-center mb-2">
                    <div style={{
                      width: '36px',
                      height: '36px',
                      background: 'var(--primary-light)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '10px'
                    }}>
                      <i className={`bi ${stat.icon}`} style={{ fontSize: '16px', color: 'var(--primary)' }}></i>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {stat.value}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {stat.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
