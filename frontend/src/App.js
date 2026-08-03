// App.js – Root component with routing and auth guard
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage    from './pages/LoginPage';
import Dashboard    from './pages/Dashboard';
import AssetList    from './pages/AssetList';
import AssetAdd     from './pages/AssetAdd';
import AssetEdit    from './pages/AssetEdit';
import AssetView    from './pages/AssetView';
import AssetImport  from './pages/AssetImport';
import AssetTimeline from './pages/AssetTimeline';
import InventoryCategory from './pages/InventoryCategory';
import InventoryDetail from './pages/InventoryDetail';
import InventoryLifecycle from './pages/InventoryLifecycle';
import Reports      from './pages/Reports';
import Warranty    from './pages/Warranty';
import Settings   from './pages/Settings';
import ActivityHistory from './pages/ActivityHistory';
import TemporaryAssignments from './pages/TemporaryAssignments';
import AssetReplacements from './pages/AssetReplacements';
import Employees from './pages/Employees';
import EmployeeAdd from './pages/EmployeeAdd'; // Phase 1
import EmployeeAutocompleteDemo from './pages/EmployeeAutocompleteDemo'; // Phase 2 Demo
import EmployeeAssetHistory from './pages/EmployeeAssetHistory';
import OnboardingList from './pages/OnboardingList';
import OnboardingAdd from './pages/OnboardingAdd';
import OnboardingView from './pages/OnboardingView';
import CorporateSimList from './pages/CorporateSimList';
import CorporateSimAdd from './pages/CorporateSimAdd';
import CorporateSimView from './pages/CorporateSimView';
import Layout       from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';
import EmailConfig from './pages/EmailConfig';

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

  // Auth guard — no Layout here, Layout is shared at parent level
  const Protected = ({ children }) =>
    isAuthenticated ? children : <Navigate to="/login" replace />;

  // Admin-only guard
  const AdminOnly = ({ children }) => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (u.role !== 'admin') return <Navigate to="/dashboard" replace />;
    return children;
  };

  // Non-viewer guard (allows admin and user, blocks viewer)
  const NonViewerOnly = ({ children }) => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (u.role === 'viewer') {
      return (
        <div className="container mt-5">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Access Denied
            </h4>
            <p>You do not have permission to access this page.</p>
            <p className="mb-0">Viewer users have read-only access. Please contact your administrator if you need additional permissions.</p>
          </div>
        </div>
      );
    }
    return children;
  };

  // Persistent Layout wrapper for all protected routes
  const AppLayout = () => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <Layout><Outlet /></Layout>;
  };

  return (
    <ErrorBoundary>
      <Router>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={
          isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <LoginPage setAuth={setIsAuthenticated} />
        } />

        {/* All protected routes share ONE persistent Layout */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard"       element={<Protected><Dashboard /></Protected>} />
          <Route path="/assets"          element={<Protected><AssetList /></Protected>} />
          <Route path="/assets/add"      element={<NonViewerOnly><AssetAdd /></NonViewerOnly>} />
          <Route path="/assets/import"   element={<AdminOnly><AssetImport /></AdminOnly>} />
          <Route path="/assets/edit/:id" element={<NonViewerOnly><AssetEdit /></NonViewerOnly>} />
          <Route path="/assets/view/:id" element={<Protected><AssetView /></Protected>} />
          <Route path="/assets/timeline/:assetId" element={<Protected><AssetTimeline /></Protected>} />
          <Route path="/inventory/detail/:inventoryId" element={<Protected><InventoryDetail /></Protected>} />
          <Route path="/inventory/lifecycle/:assetId" element={<Protected><InventoryLifecycle /></Protected>} />
          <Route path="/inventory/:type" element={<Protected><InventoryCategory /></Protected>} />
          <Route path="/reports"         element={<Protected><Reports /></Protected>} />
          <Route path="/warranty"        element={<Protected><Warranty /></Protected>} />
          <Route path="/activity-history" element={<Protected><ActivityHistory /></Protected>} />
          <Route path="/temporary-assignments" element={<NonViewerOnly><TemporaryAssignments /></NonViewerOnly>} />
          <Route path="/asset-replacements" element={<NonViewerOnly><AssetReplacements /></NonViewerOnly>} />
          <Route path="/employees" element={<AdminOnly><Employees /></AdminOnly>} />
          <Route path="/employees/add" element={<AdminOnly><EmployeeAdd /></AdminOnly>} />
          <Route path="/employees/edit/:empId" element={<AdminOnly><EmployeeAdd /></AdminOnly>} />
          <Route path="/employees/autocomplete-demo" element={<AdminOnly><EmployeeAutocompleteDemo /></AdminOnly>} />
          <Route path="/employees/:employeeId/asset-history" element={<AdminOnly><EmployeeAssetHistory /></AdminOnly>} />
          <Route path="/onboarding"          element={<AdminOnly><OnboardingList /></AdminOnly>} />
          <Route path="/onboarding/add"      element={<AdminOnly><OnboardingAdd /></AdminOnly>} />
          <Route path="/onboarding/edit/:id" element={<AdminOnly><OnboardingAdd /></AdminOnly>} />
          <Route path="/onboarding/view/:id" element={<AdminOnly><OnboardingView /></AdminOnly>} />
          <Route path="/corporate-sims"          element={<Protected><CorporateSimList /></Protected>} />
          <Route path="/corporate-sims/add"      element={<NonViewerOnly><CorporateSimAdd /></NonViewerOnly>} />
          <Route path="/corporate-sims/view/:id" element={<Protected><CorporateSimView /></Protected>} />
          <Route path="/settings"        element={<AdminOnly><Settings /></AdminOnly>} />
          <Route path="/email-config"    element={<AdminOnly><EmailConfig /></AdminOnly>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
