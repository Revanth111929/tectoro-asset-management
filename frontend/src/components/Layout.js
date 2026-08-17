// Layout.js – Restructured to match reference design
import tectoroLogo from '../assets/tectoro-logo.svg';
import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { canPerform, getUserInfo } from '../utils/permissions';
import { resolveActiveMenu, ASSET_DETAIL_ROUTE } from '../utils/sidebarActiveResolver';
import { assetAPI } from '../services/api';

function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSections, setOpenSections] = useState({ 
    assets: true, 
    inventory: false, 
    lifecycle: false, 
    reports: false, 
    settings: false 
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const user = JSON.parse(localStorage.getItem('user') || '{"username":"Admin"}');
  const userInfo = getUserInfo();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
    window.location.href = '/login';
  };

  // Resolve category for /assets/edit|view|timeline/:id pages
  const [resolvedCategory, setResolvedCategory] = useState(null);
  const categoryCacheRef = React.useRef(new Map());

  React.useEffect(() => {
    const match = location.pathname.match(ASSET_DETAIL_ROUTE);
    if (!match) { setResolvedCategory(null); return; }
    const id = match[1];
    const cache = categoryCacheRef.current;
    if (cache.has(id)) { setResolvedCategory(cache.get(id)); return; }
    let cancelled = false;
    assetAPI.getById(id)
      .then(res => {
        const category = res?.data?.category || res?.category || null;
        cache.set(id, category);
        if (!cancelled) setResolvedCategory(category);
      })
      .catch(() => { if (!cancelled) setResolvedCategory(null); });
    return () => { cancelled = true; };
  }, [location.pathname]);

  const activeMenu = React.useMemo(
    () => resolveActiveMenu(location.pathname, resolvedCategory),
    [location.pathname, resolvedCategory]
  );

  // Auto-expand section containing active item
  React.useEffect(() => {
    if (!activeMenu.section) return;
    setOpenSections(prev => ({
      ...prev,
      [activeMenu.section]: true
    }));
  }, [activeMenu.section]);

  const isActive = (path) => activeMenu.key === path;

  const toggleSection = (section) => {
    if (collapsed) return;
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const NavItem = ({ to, icon, label, badge }) => {
    const handleClick = () => {
      navigate(to);
      setMobileMenuOpen(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="link"
        tabIndex={0}
        title={collapsed ? label : ''}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: collapsed ? '10px 0' : '10px 14px',
          borderRadius: '8px',
          margin: collapsed ? '2px 16px' : '2px 8px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: isActive(to) ? '600' : '500',
          color: isActive(to) ? 'var(--nav-active-text)' : 'var(--nav-text)',
          background: isActive(to) ? 'var(--nav-active-bg)' : 'transparent',
          borderLeft: isActive(to) ? '2px solid var(--nav-active-border)' : '2px solid transparent',
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          cursor: 'pointer',
          border: 'none',
          font: 'inherit',
          textAlign: 'left',
          width: '100%',
          borderRight: 'none',
          borderTop: 'none',
          borderBottom: 'none',
        }}
        onMouseEnter={e => {
          if (!isActive(to)) {
            e.currentTarget.style.background = 'var(--nav-hover-bg)';
            e.currentTarget.style.color = 'var(--nav-hover-text)';
          }
        }}
        onMouseLeave={e => {
          if (!isActive(to)) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--nav-text)';
          }
        }}
      >
        <i 
          className={`bi bi-${icon}`} 
          style={{ 
            fontSize: '15px', 
            flexShrink: 0, 
            width: '15px', 
            textAlign: 'center',
            color: isActive(to) ? 'var(--nav-active-icon)' : 'inherit'
          }}
        ></i>
        {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
        {!collapsed && badge && (
          <span style={{
            fontSize: '10px',
            fontWeight: '700',
            background: badge.color || 'var(--primary)',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '8px',
            lineHeight: 1
          }}>
            {badge.text}
          </span>
        )}
      </button>
    );
  };

  const SectionHeader = ({ label, section }) => (
    !collapsed ? (
      <div
        onClick={() => toggleSection(section)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px',
          fontWeight: '700',
          letterSpacing: '0.8px',
          color: 'var(--nav-section)',
          padding: '12px 12px 6px',
          textTransform: 'uppercase',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--nav-section-hover)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--nav-section)'}
      >
        <span>{label}</span>
        <i
          className={`bi bi-chevron-${openSections[section] ? 'up' : 'down'}`}
          style={{ fontSize: '9px' }}
        ></i>
      </div>
    ) : <div style={{ height: '12px' }} />
  );

  const SectionLabel = ({ label }) => (
    !collapsed ? (
      <div style={{
        fontSize: '10px',
        fontWeight: '700',
        letterSpacing: '0.8px',
        color: 'var(--nav-section)',
        padding: '12px 12px 6px',
        textTransform: 'uppercase'
      }}>
        {label}
      </div>
    ) : <div style={{ height: '12px' }} />
  );

  const Divider = () => (
    <div style={{
      height: '1px',
      background: 'var(--nav-divider)',
      margin: '8px 12px'
    }} />
  );

  return (
    <>
      <style>{`
        :root {
          --sidebar-w: ${collapsed ? '70px' : '220px'};
          --topbar-h: 60px;
          
          /* Sidebar Colors - Light - Clean solid backgrounds */
          --nav-bg: #ffffff;
          --nav-border: rgba(226, 232, 240, 1);
          --nav-text: #64748b;
          --nav-hover-bg: rgba(241, 245, 249, 0.8);
          --nav-hover-text: #334155;
          --nav-active-bg: rgba(59, 130, 246, 0.1);
          --nav-active-text: #2563eb;
          --nav-active-icon: #3b82f6;
          --nav-active-border: #3b82f6;
          --nav-section: #94a3b8;
          --nav-section-hover: #64748b;
          --nav-divider: rgba(226, 232, 240, 0.5);
          
          /* Topbar Colors - Light - Clean white header */
          --topbar-bg: #ffffff;
          --topbar-border: rgba(226, 232, 240, 1);
          
          /* Content */
          --content-bg: #f0f4f8;
        }
        
        [data-theme="dark"] {
          /* Sidebar Colors - Premium Dark Enterprise */
          --nav-bg: #050505;
          --nav-border: rgba(255, 255, 255, 0.06);
          --nav-text: #8A8A8A;
          --nav-hover-bg: #0F0F0F;
          --nav-hover-text: #F5F5F5;
          --nav-active-bg: #1A1A1A;
          --nav-active-text: #FFFFFF;
          --nav-active-icon: #14b8a6;
          --nav-active-border: #14b8a6;
          --nav-section: #6F6F6F;
          --nav-section-hover: #A1A1A1;
          --nav-divider: rgba(255, 255, 255, 0.05);
          
          /* Topbar Colors - Dark */
          --topbar-bg: #090909;
          --topbar-border: rgba(255, 255, 255, 0.08);
          
          /* Content */
          --content-bg: #090909;
        }

        /* Layout Structure */
        .app-wrapper {
          display: flex;
          min-height: 100vh;
          background: var(--content-bg);
        }

        /* Sidebar */
        .sidebar {
          width: var(--sidebar-w);
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          background: var(--nav-bg);
          border-right: 1px solid var(--nav-border);
          display: flex;
          flex-direction: column;
          z-index: 100;
          transition: width 0.2s ease, transform 0.3s ease;
          overflow: hidden;
        }
        
        [data-theme="dark"] .sidebar {
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          box-shadow: none;
        }

        /* Sidebar Brand */
        .sidebar-brand {
          height: var(--topbar-h);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 ${collapsed ? '20px' : '16px'};
          border-bottom: 1px solid var(--nav-divider);
          flex-shrink: 0;
          position: relative;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
        }

        .brand-logo {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        /* Sidebar Navigation */
        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 8px 0;
        }

        .sidebar-nav::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-nav::-webkit-scrollbar-thumb {
          background: var(--nav-divider);
          border-radius: 2px;
        }

        .nav-children {
          overflow: hidden;
          transition: max-height 0.25s ease, opacity 0.2s ease;
        }

        /* Collapse Button */
        .collapse-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 1px solid var(--nav-border);
          background: var(--nav-bg);
          color: var(--nav-text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 11px;
          position: absolute;
          right: -12px;
          top: 18px;
          z-index: 101;
          transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .collapse-btn:hover {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
          transform: scale(1.05);
        }

        /* Main Content Area */
        .main-content {
          margin-left: var(--sidebar-w);
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          min-width: 0;
          transition: margin-left 0.2s ease;
        }

        /* Topbar */
        .topbar {
          height: var(--topbar-h);
          background: var(--topbar-bg);
          border-bottom: 1px solid var(--topbar-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        
        [data-theme="dark"] .topbar {
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          box-shadow: none;
        }

        .topbar-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
          font-size: 16px;
        }

        .topbar-btn:hover {
          background: var(--surface-hover);
          color: var(--primary);
          border-color: var(--border-hover);
        }

        .topbar-user-btn {
          height: 36px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 10px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .topbar-user-btn:hover {
          background: var(--surface-hover);
          border-color: var(--border-hover);
        }

        .topbar-username {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
        }

        /* Content Area */
        .content-area {
          flex: 1;
          padding: 24px;
          background: var(--content-bg);
        }

        /* Mobile Styles */
        @media (max-width: 1023px) {
          .sidebar {
            transform: translateX(-100%);
          }
          
          .sidebar.mobile-open {
            transform: translateX(0);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
          }
          
          .main-content {
            margin-left: 0 !important;
          }
          
          .collapse-btn {
            display: none !important;
          }

          .mobile-menu-toggle {
            display: flex !important;
          }
        }

        @media (min-width: 1024px) {
          .mobile-menu-toggle {
            display: none !important;
          }
        }

        .mobile-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 99;
          display: none;
        }

        .mobile-overlay.active {
          display: block;
        }

        @media (min-width: 1024px) {
          .mobile-overlay {
            display: none !important;
          }
        }
      `}</style>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-overlay active"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="app-wrapper">
        {/* Sidebar */}
        <div className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {/* Brand */}
          <div className="sidebar-brand">
            <div className="brand-logo">
              <img
                src={tectoroLogo}
                alt="Tectoro"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            {!collapsed && <span className="brand-name">TECTORO</span>}
            
            <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
              <i className={`bi bi-chevron-${collapsed ? 'right' : 'left'}`}></i>
            </button>
          </div>

          {/* Navigation */}
          <div className="sidebar-nav">
            {/* MAIN */}
            <SectionLabel label="MAIN" />
            <NavItem to="/dashboard" icon="grid-fill" label="Dashboard" />

            {/* ASSETS */}
            <Divider />
            <SectionHeader label="ASSETS" section="assets" />
            <div
              className="nav-children"
              style={{
                maxHeight: (collapsed || openSections.assets) ? '200px' : '0',
                opacity: (collapsed || openSections.assets) ? 1 : 0
              }}
            >
              <NavItem to="/assets" icon="laptop" label="All Assets" />
              {canPerform('create') && <NavItem to="/assets/add" icon="plus-circle" label="Add Asset" />}
              {canPerform('import') && <NavItem to="/assets/import" icon="cloud-upload" label="Import Excel" />}
              {canPerform('settings') && <NavItem to="/assets/deleted" icon="trash" label="Deleted Assets" />}
            </div>

            {/* INVENTORY */}
            <Divider />
            <SectionHeader label="INVENTORY" section="inventory" />
            <div
              className="nav-children"
              style={{
                maxHeight: (collapsed || openSections.inventory) ? '520px' : '0',
                opacity: (collapsed || openSections.inventory) ? 1 : 0
              }}
            >
              <NavItem to="/inventory/laptop" icon="laptop" label="Laptop" />
              <NavItem to="/inventory/desktop" icon="pc-display" label="Desktop" />
              <NavItem to="/inventory/monitor" icon="display" label="Monitor" />
              <NavItem to="/inventory/printer" icon="printer" label="Printer" />
              <NavItem to="/inventory/phone" icon="phone" label="Phone" />
              <NavItem to="/corporate-sims" icon="sim" label="Corporate SIMs" />
              <NavItem to="/inventory/server" icon="hdd-rack" label="Server" />
              <NavItem to="/inventory/mouse" icon="mouse" label="Mouse" />
              <NavItem to="/inventory/headphones" icon="headphones" label="Headphones" />
              <NavItem to="/inventory/hard-disk" icon="device-hdd" label="Hard Disk" />
            </div>

            {/* LIFECYCLE */}
            {canPerform('create') && (
              <>
                <Divider />
                <SectionHeader label="LIFECYCLE" section="lifecycle" />
                <div
                  className="nav-children"
                  style={{
                    maxHeight: (collapsed || openSections.lifecycle) ? '200px' : '0',
                    opacity: (collapsed || openSections.lifecycle) ? 1 : 0
                  }}
                >
                  <NavItem to="/temporary-assignments" icon="arrow-repeat" label="Temp Assignments" />
                  <NavItem to="/asset-replacements" icon="arrow-left-right" label="Asset Replacements" />
                  <NavItem to="/part-replacements" icon="tools" label="Part Replacement" />
                  <NavItem to="/activity-history" icon="clock-history" label="Activity History" />
                </div>
              </>
            )}

            {/* REPORTS */}
            <Divider />
            <SectionHeader label="REPORTS" section="reports" />
            <div
              className="nav-children"
              style={{
                maxHeight: (collapsed || openSections.reports) ? '150px' : '0',
                opacity: (collapsed || openSections.reports) ? 1 : 0
              }}
            >
              <NavItem to="/reports" icon="bar-chart-line" label="Reports" />
              <NavItem to="/warranty" icon="shield-exclamation" label="Warranty" />
            </div>

            {/* SETTINGS */}
            {canPerform('settings') && (
              <>
                <Divider />
                <SectionHeader label="SETTINGS" section="settings" />
                <div
                  className="nav-children"
                  style={{
                    maxHeight: (collapsed || openSections.settings) ? '150px' : '0',
                    opacity: (collapsed || openSections.settings) ? 1 : 0
                  }}
                >
                  <NavItem to="/employees" icon="people" label="Employees" />
                  <NavItem to="/settings" icon="gear" label="User Management" />
                  <NavItem to="/email-config" icon="envelope-gear" label="Email Config" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Topbar */}
          <div className="topbar">
            {/* Left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="mobile-menu-toggle topbar-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <i className="bi bi-list"></i>
              </button>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Theme Toggle */}
              <div className="dropdown">
                <button className="topbar-btn" data-bs-toggle="dropdown" title="Theme">
                  <i className={`bi bi-${theme === 'dark' ? 'moon-stars-fill' : 'sun-fill'}`}></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  {[
                    ['light', 'sun-fill', 'Light'],
                    ['dark', 'moon-stars-fill', 'Dark'],
                    ['system', 'circle-half', 'System']
                  ].map(([val, ico, lbl]) => (
                    <li key={val}>
                      <button
                        className={`dropdown-item ${theme === val ? 'active' : ''}`}
                        onClick={() => setTheme(val)}
                      >
                        <i className={`bi bi-${ico} me-2`}></i>{lbl}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* User Menu */}
              <div className="dropdown">
                <button className="topbar-user-btn dropdown-toggle" data-bs-toggle="dropdown">
                  <div className="user-avatar" style={{ width: '26px', height: '26px', fontSize: '11px' }}>
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="topbar-username d-none d-md-inline">{user.username}</span>
                  <i className="bi bi-chevron-down" style={{ fontSize: '10px', color: 'var(--text-muted)' }}></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <span className="dropdown-item-text" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {user.email || 'admin@company.com'}
                    </span>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-left me-2"></i>Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="content-area">
            {children || <Outlet />}
          </div>
        </div>
      </div>
    </>
  );
}

export default Layout;
