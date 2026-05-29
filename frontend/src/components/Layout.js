// Layout.js – Modern sidebar like Untitled UI
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { canPerform, getUserInfo } from '../utils/permissions';

function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { theme, setTheme } = useTheme();

  const user = JSON.parse(localStorage.getItem('user') || '{"username":"Admin"}');
  const userInfo = getUserInfo();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
    window.location.href = '/login';
  };

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const NavItem = ({ to, icon, label, exact = false, badge }) => (
    <Link
      to={to}
      title={collapsed ? label : ''}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        borderRadius: '8px',
        margin: '1px 8px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: isActive(to, exact) ? '600' : '400',
        color: isActive(to, exact) ? '#fff' : 'var(--nav-text)',
        background: isActive(to, exact) ? '#2563eb' : 'transparent',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!isActive(to, exact)) {
          e.currentTarget.style.background = 'var(--nav-hover)';
          e.currentTarget.style.color = 'var(--nav-text-hover)';
        }
      }}
      onMouseLeave={e => {
        if (!isActive(to, exact)) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--nav-text)';
        }
      }}
    >
      <i className={`bi bi-${icon}`} style={{ fontSize: '16px', flexShrink: 0, width: '20px', textAlign: 'center' }}></i>
      {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
      {!collapsed && badge && (
        <span style={{
          fontSize: '10px', fontWeight: '700',
          background: badge.color || '#2563eb',
          color: '#fff', padding: '1px 6px',
          borderRadius: '10px', lineHeight: '16px'
        }}>{badge.text}</span>
      )}
    </Link>
  );

  const SectionLabel = ({ label }) => (
    !collapsed ? (
      <div style={{
        fontSize: '11px', fontWeight: '600', letterSpacing: '0.6px',
        color: 'var(--nav-section)', padding: '16px 20px 4px',
        textTransform: 'uppercase'
      }}>{label}</div>
    ) : <div style={{ height: '16px' }} />
  );

  const Divider = () => (
    <div style={{ height: '1px', background: 'var(--nav-divider)', margin: '8px 16px' }} />
  );

  return (
    <>
      <style>{`
        :root {
          --sidebar-w: ${collapsed ? '64px' : '240px'};
          --nav-text: #6b7280;
          --nav-text-hover: #111827;
          --nav-hover: #f3f4f6;
          --nav-section: #9ca3af;
          --nav-divider: #f0f0f0;
          --nav-bg: #ffffff;
          --nav-border: #e5e7eb;
          --topbar-bg: #ffffff;
          --content-bg: #f9fafb;
        }
        [data-theme="dark"] {
          --nav-text: #a0aec0;
          --nav-text-hover: #ffffff;
          --nav-hover: rgba(255,255,255,0.08);
          --nav-section: #718096;
          --nav-divider: rgba(255,255,255,0.06);
          --nav-bg: #1a202c;
          --nav-border: rgba(255,255,255,0.06);
          --topbar-bg: #1a202c;
          --content-bg: #0f1419;
        }
        .layout-sidebar {
          width: var(--sidebar-w);
          min-height: 100vh;
          background: var(--nav-bg);
          border-right: 1px solid var(--nav-border);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 100;
          transition: width 0.2s ease;
          overflow: hidden;
        }
        .layout-main {
          margin-left: var(--sidebar-w);
          flex: 1;
          min-width: 0;
          min-height: 100vh;
          background: var(--content-bg);
          transition: margin-left 0.2s ease;
          display: flex;
          flex-direction: column;
        }
        .layout-topbar {
          height: 60px;
          background: var(--topbar-bg);
          border-bottom: 1px solid var(--nav-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .layout-content {
          flex: 1;
          padding: 28px 32px;
        }
        .sidebar-brand {
          height: 60px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 ${collapsed ? '20px' : '16px'};
          border-bottom: 1px solid var(--nav-border);
          flex-shrink: 0;
        }
        .brand-logo {
          width: 32px; height: 32px; flex-shrink: 0;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 16px;
        }
        .brand-name {
          font-size: 15px; font-weight: 700;
          color: var(--nav-text-hover);
          white-space: nowrap;
        }
        .sidebar-nav { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 8px 0; }
        .sidebar-nav::-webkit-scrollbar { width: 3px; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: var(--nav-divider); border-radius: 3px; }
        .sidebar-footer {
          border-top: 1px solid var(--nav-border);
          padding: 12px 8px;
        }
        .user-row {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; border-radius: 8px;
          cursor: pointer; transition: background 0.15s;
        }
        .user-row:hover { background: var(--nav-hover); }
        .user-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 13px; font-weight: 700;
          flex-shrink: 0;
        }
        .user-info { overflow: hidden; }
        .user-name { font-size: 13px; font-weight: 600; color: var(--nav-text-hover); white-space: nowrap; }
        .user-email { font-size: 11px; color: var(--nav-section); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .topbar-btn {
          width: 36px; height: 36px; border-radius: 8px;
          border: 1px solid var(--nav-border);
          background: transparent;
          color: var(--nav-text);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s;
          font-size: 16px;
        }
        .topbar-btn:hover { background: var(--nav-hover); color: var(--nav-text-hover); }
        .dropdown-menu {
          border: 1px solid var(--nav-border) !important;
          border-radius: 10px !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.10) !important;
          background: var(--nav-bg) !important;
          padding: 6px !important;
          min-width: 160px;
        }
        .dropdown-item {
          border-radius: 6px !important;
          font-size: 13px !important;
          padding: 7px 12px !important;
          color: var(--nav-text) !important;
        }
        .dropdown-item:hover { background: var(--nav-hover) !important; color: var(--nav-text-hover) !important; }
        .dropdown-item.active { background: #2563eb !important; color: #fff !important; }
        .collapse-btn {
          width: 24px; height: 24px; border-radius: 50%;
          border: 1px solid var(--nav-border);
          background: var(--nav-bg);
          color: var(--nav-text);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 12px;
          position: absolute; right: -12px; top: 20px; z-index: 101;
          transition: all 0.15s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.10);
        }
        .collapse-btn:hover { background: #2563eb; color: #fff; border-color: #2563eb; }
      `}</style>

      <div style={{ display: 'flex' }}>
        {/* ── Sidebar ── */}
        <div className="layout-sidebar">
          {/* Brand */}
          <div className="sidebar-brand" style={{ position: 'relative' }}>
            <div className="brand-logo">
              <i className="bi bi-laptop"></i>
            </div>
            {!collapsed && <span className="brand-name">Tectoro Asset Management</span>}
            <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
              <i className={`bi bi-chevron-${collapsed ? 'right' : 'left'}`}></i>
            </button>
          </div>

          {/* Nav */}
          <div className="sidebar-nav">
            <SectionLabel label="Main" />
            <NavItem to="/dashboard" icon="speedometer2" label="Dashboard" exact />

            <Divider />
            <SectionLabel label="Assets" />
            <NavItem to="/assets" icon="laptop" label="All Assets" exact />
            {canPerform('create') && (
              <NavItem to="/assets/add" icon="plus-circle" label="Add Asset" exact />
            )}
            {canPerform('import') && (
              <NavItem to="/assets/import" icon="cloud-upload" label="Import Excel" exact />
            )}

            <Divider />
            <SectionLabel label="Inventory" />
            <NavItem to="/inventory/laptops"    icon="laptop"          label="Laptops" />
            <NavItem to="/inventory/mobiles"    icon="phone"           label="Mobiles" />
            <NavItem to="/inventory/printers"   icon="printer"         label="Printers" />
            <NavItem to="/inventory/hard-disks" icon="device-hdd"      label="Hard Disks" />
            <NavItem to="/inventory/ups"        icon="lightning-charge" label="UPS Devices" />
            <NavItem to="/inventory/laptop-bags" icon="bag"            label="Laptop Bags" />
            <NavItem to="/inventory/mouse"      icon="mouse"           label="Mouse" />
            <NavItem to="/inventory/headphones" icon="headphones"      label="Headphones" />

            <Divider />
            <SectionLabel label="Reports" />
            <NavItem to="/reports"  icon="bar-chart-line"     label="Reports" exact />
            <NavItem to="/warranty" icon="shield-exclamation" label="Warranty" exact />

            {canPerform('edit') && (
              <>
                <Divider />
                <SectionLabel label="Settings" />
                <NavItem to="/settings" icon="gear" label="User Management" exact />
              </>
            )}
          </div>

          {/* Footer: user row */}
          <div className="sidebar-footer">
            {!collapsed ? (
              <div className="dropdown">
                <div className="user-row dropdown-toggle" data-bs-toggle="dropdown"
                  style={{ listStyle: 'none' }}>
                  <div className="user-avatar">{user.username[0].toUpperCase()}</div>
                  <div className="user-info">
                    <div className="user-name">{user.username}</div>
                    <div className="user-email">{userInfo?.roleLabel || user.role || 'User'}</div>
                  </div>
                  <i className="bi bi-dots-vertical ms-auto" style={{ color: 'var(--nav-section)', fontSize: '14px' }}></i>
                </div>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-left me-2"></i>Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                <div className="user-avatar" title={user.username} style={{ cursor: 'pointer' }}
                  onClick={handleLogout}>
                  {user.username[0].toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Main ── */}
        <div className="layout-main">
          {/* Topbar */}
          <div className="layout-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {location.pathname !== '/dashboard' && (
                <button className="topbar-btn" onClick={() => navigate(-1)} title="Go back">
                  <i className="bi bi-arrow-left"></i>
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Theme switcher */}
              <div className="dropdown">
                <button className="topbar-btn" data-bs-toggle="dropdown" title="Theme">
                  <i className={`bi bi-${theme === 'dark' ? 'moon-stars-fill' : 'sun-fill'}`}></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  {[['light','sun-fill','Light'],['dark','moon-stars-fill','Dark'],['system','circle-half','System']].map(([val,ico,lbl]) => (
                    <li key={val}>
                      <button className={`dropdown-item ${theme===val?'active':''}`} onClick={() => setTheme(val)}>
                        <i className={`bi bi-${ico} me-2`}></i>{lbl}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* User */}
              <div className="dropdown">
                <button className="topbar-btn d-flex align-items-center gap-2"
                  style={{ width: 'auto', padding: '0 10px', borderRadius: '8px' }}
                  data-bs-toggle="dropdown">
                  <div className="user-avatar" style={{ width:'28px', height:'28px', fontSize:'12px' }}>
                    {user.username[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize:'13px', fontWeight:'600', color:'var(--nav-text-hover)' }}
                    className="d-none d-md-inline">{user.username}</span>
                  <i className="bi bi-chevron-down" style={{ fontSize:'11px', color:'var(--nav-section)' }}></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><span className="dropdown-item-text" style={{ fontSize:'12px', color:'var(--nav-section)' }}>
                    {user.email || 'admin@company.com'}
                  </span></li>
                  <li><hr className="dropdown-divider" style={{ borderColor:'var(--nav-divider)', margin:'4px 0' }} /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-left me-2"></i>Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className="layout-content">{children}</div>
        </div>
      </div>
    </>
  );
}

export default Layout;
