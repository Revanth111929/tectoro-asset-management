// App.js – Root component with routing and auth guard
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage    from './pages/LoginPage';
import Dashboard    from './pages/Dashboard';
import AssetList    from './pages/AssetList';
import AssetAdd     from './pages/AssetAdd';
import AssetEdit    from './pages/AssetEdit';
import AssetView    from './pages/AssetView';
import AssetImport  from './pages/AssetImport';
import InventoryCategory from './pages/InventoryCategory';
import Reports      from './pages/Reports';
import Warranty    from './pages/Warranty';
import Settings   from './pages/Settings';
import Layout       from './components/Layout';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user  = localStorage.getItem('user');
    if (token && user) {
      const expiry = localStorage.getItem('tokenExpiry');
      if (expiry && new Date().getTime() < parseInt(expiry)) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiry');
      }
    }
    setLoading(false);
  }, []);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading…</span>
      </div>
    </div>
  );

  // Helper: wrap a page in Layout and guard with auth
  const Protected = ({ children }) =>
    isAuthenticated
      ? <Layout>{children}</Layout>
      : <Navigate to="/login" replace />;

  // Admin-only guard
  const AdminOnly = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/assets" replace />; // standard/viewer blocked
    return <Layout>{children}</Layout>;
  };

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={
          isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <LoginPage setAuth={setIsAuthenticated} />
        } />

        {/* Protected */}
        <Route path="/dashboard"       element={<Protected><Dashboard /></Protected>} />
        <Route path="/assets"          element={<Protected><AssetList /></Protected>} />
        <Route path="/assets/add"      element={<AdminOnly><AssetAdd /></AdminOnly>} />
        <Route path="/assets/import"   element={<AdminOnly><AssetImport /></AdminOnly>} />
        <Route path="/assets/edit/:id" element={<AdminOnly><AssetEdit /></AdminOnly>} />
        <Route path="/assets/view/:id" element={<Protected><AssetView /></Protected>} />
        <Route path="/inventory/:type" element={<Protected><InventoryCategory /></Protected>} />
        <Route path="/reports"         element={<Protected><Reports /></Protected>} />
        <Route path="/warranty"        element={<Protected><Warranty /></Protected>} />
        <Route path="/settings"       element={<AdminOnly><Settings /></AdminOnly>} />

        {/* Catch-all */}
        <Route path="*" element={isAuthenticated ? <Navigate to="/login" replace /> : <Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
