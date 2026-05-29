// Dashboard.js – Main dashboard with live stats, charts, and recent activity
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { dashboardAPI } from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats]       = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    Promise.all([dashboardAPI.getStats(), dashboardAPI.getActivity()])
      .then(([statsRes, actRes]) => {
        setStats(statsRes.data);
        setActivity(actRes.data.logs || []);
      })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading…</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="alert alert-danger">{error}</div>
  );

  // Laptop Status Chart with percentages
  const laptopTotal = stats.laptopStats?.total || 0;
  const laptopData = [
    stats.laptopStats?.available || 0,
    stats.laptopStats?.assigned || 0,
    stats.laptopStats?.maintenance || 0,
    stats.laptopStats?.retired || 0
  ];
  
  const statusChart = {
    labels: ['Available', 'Assigned', 'Maintenance', 'Retired'],
    datasets: [{
      data: laptopData,
      backgroundColor: ['#16a34a', '#2563eb', '#d97706', '#6b7280'],
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
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
          label: (context) => {
            const value = context.parsed;
            return `${context.label}: ${value}`;
          }
        }
      }
    },
    cutout: '70%',
  };

  const catChart = {
    labels: stats.categories.map(c => c.name),
    datasets: [{
      label: 'Count',
      data:  stats.categories.map(c => c.count),
      backgroundColor: '#2563eb',
      borderRadius: 6,
    }],
  };

  const actionColor = { CREATE: 'success', UPDATE: 'info', DELETE: 'danger', ASSIGN: 'primary', RETURN: 'secondary' };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Dashboard</h2>
          <p className="text-muted mb-0">IT Asset Management Overview</p>
        </div>
        <Link to="/assets/add" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>Add Asset
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Laptops',    value: stats.laptopStats?.total || 0,       icon: 'bi-laptop',             bg: '#dbeafe', color: '#2563eb' },
          { label: 'Available',       value: stats.laptopStats?.available || 0,   icon: 'bi-check-circle',       bg: '#dcfce7', color: '#16a34a' },
          { label: 'Assigned',        value: stats.laptopStats?.assigned || 0,    icon: 'bi-person-check',       bg: '#fef3c7', color: '#d97706' },
          { label: 'Maintenance',     value: stats.laptopStats?.maintenance || 0, icon: 'bi-tools',              bg: '#fee2e2', color: '#dc2626' },
          { label: 'Warranty Expiring (90d)', value: stats.expiringWarranties, icon: 'bi-shield-exclamation', bg: '#fce7f3', color: '#9333ea' },
        ].map((s, i) => (
          <div className="col-6 col-md-4 col-xl" key={i}>
            <div className="stat-card" onClick={() => navigate(s.link)} style={{ cursor: 'pointer' }}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <i className={`bi ${s.icon}`}></i>
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row g-3 mb-4">
        <div className="col-md-5">
          <div className="table-card h-100">
            <h6 className="fw-bold mb-3">Laptop Status Distribution</h6>
            <div style={{ maxWidth: 280, margin: '0 auto', position: 'relative' }}>
              <Doughnut data={statusChart} options={chartOptions} />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {laptopTotal}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Total Laptops
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-7">
          <div className="table-card h-100">
            <h6 className="fw-bold mb-3">Assigned Assets by Category</h6>
            <Bar
              data={catChart}
              options={{
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="table-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold mb-0">Recent Activity</h6>
          <Link to="/reports" className="btn btn-sm btn-outline-primary">View All</Link>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>User</th><th>Action</th><th>Module</th><th>Description</th><th>Time</th>
              </tr>
            </thead>
            <tbody>
              {activity.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-4">No activity yet</td></tr>
              )}
              {activity.map(log => (
                <tr key={log.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="avatar-circle" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                        {(log.user || 'A')[0].toUpperCase()}
                      </div>
                      {log.user}
                    </div>
                  </td>
                  <td>
                    <span className={`badge bg-${actionColor[log.action] || 'secondary'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.module}</td>
                  <td className="text-truncate" style={{ maxWidth: 280 }}>{log.description}</td>
                  <td className="text-muted small">
                    {new Date(log.timestamp).toLocaleString()}
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

export default Dashboard;
