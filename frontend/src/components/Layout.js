// Layout.js – sidebar with accordion sections (only one open at a time)
import tectoroIcon from '../assets/tectoro-icon-only.png';
import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { canPerform, getUserInfo } from '../utils/permissions';
import { resolveActiveMenu, ASSET_DETAIL_ROUTE } from '../utils/sidebarActiveResolver';
import { assetAPI } from '../services/api';
import GlobalSearch from './GlobalSearch';

function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState({ assets: true, inventory: false, lifecycle: false, reports: false, settings: false });
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

  // Resolve category for /assets/edit|view|timeline/:id pages so the
  // matching Inventory item (not just "All Assets") gets highlighted.
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

  // Keep the section containing the active item expanded; persists until
  // the user navigates to a different module. Manual toggling still works
  // for browsing other sections without leaving the current page.
  React.useEffect(() => {
    if (!activeMenu.section) return;
    setOpenSections({
      assets: activeMenu.section === 'assets',
      inventory: activeMenu.section === 'inventory',
      lifecycle: activeMenu.section === 'lifecycle',
      reports: activeMenu.section === 'reports',
      settings: activeMenu.section === 'settings',
    });
  }, [activeMenu.section]);

  const isActive = (path) => activeMenu.key === path;

  // Accordion: open clicked section, close all others
  const toggleSection = (section) => {
    if (collapsed) return;
    setOpenSections({
      assets:    section === 'assets'    ? !openSections.assets    : false,
      inventory: section === 'inventory' ? !openSections.inventory : false,
      lifecycle: section === 'lifecycle' ? !openSections.lifecycle : false,
      reports:   section === 'reports'   ? !openSections.reports   : false,
      settings:  section === 'settings'  ? !openSections.settings  : false,
    });
  };

  const NavItem = ({ to, icon, label, exact = false, badge }) => (
    <Link
      to={to}
      title={collapsed ? label : ''}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: collapsed ? '14px 0' : '10px 16px', 
        borderRadius: '8px', 
        margin: collapsed ? '4px 16px' : '2px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        textDecoration: 'none', fontSize: '14px',
        fontWeight: isActive(to, exact) ? '500' : '400',
        color: isActive(to, exact) ? '#ffffff' : 'var(--nav-text)',
        background: isActive(to, exact) ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
        borderLeft: isActive(to, exact) ? '3px solid #6366f1' : '3px solid transparent',
        transition: 'all 0.15s ease', whiteSpace: 'nowrap', overflow: 'hidden',
      }}
      onMouseEnter={e => { if (!isActive(to, exact)) { e.currentTarget.style.background = 'var(--nav-hover)'; e.currentTarget.style.color = 'var(--nav-text-hover)'; }}}
      onMouseLeave={e => { if (!isActive(to, exact)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--nav-text)'; }}}
    >
      <i className={`bi bi-${icon}`} style={{ fontSize: collapsed ? '20px' : '18px', flexShrink: 0, width: '20px', textAlign: 'center' }}></i>
      {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
      {!collapsed && badge && (
        <span style={{ fontSize: '10px', fontWeight: '700', background: badge.color || '#6366f1', color: '#fff', padding: '2px 6px', borderRadius: '10px', lineHeight: '16px' }}>{badge.text}</span>
      )}
    </Link>
  );

  const SectionHeader = ({ label, section }) => (
    !collapsed ? (
      <div onClick={() => toggleSection(section)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '11px', fontWeight: '700', letterSpacing: '0.8px',
        color: '#94a3b8', padding: '16px 20px 4px',
        textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none',
      }}
        onMouseEnter={e => e.currentTarget.style.color = '#cbd5e1'}
        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
      >
        <span>{label}</span>
        <i className={`bi bi-chevron-${openSections[section] ? 'up' : 'down'}`} style={{ fontSize: '10px', marginRight: '8px', color: '#94a3b8' }}></i>
      </div>
    ) : <div style={{ height: '16px' }} />
  );

  const SectionLabel = ({ label }) => (
    !collapsed ? (
      <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.8px', color: '#94a3b8', padding: '16px 20px 4px', textTransform: 'uppercase' }}>{label}</div>
    ) : <div style={{ height: '16px' }} />
  );

  const Divider = () => <div style={{ height: '1px', background: 'var(--nav-divider)', margin: '8px 16px' }} />;

  return (
    <>
      <style>{`
        :root {
          --sidebar-w: ${collapsed ? '70px' : '220px'};
          --nav-text: #b8c5d6; --nav-text-hover: #ffffff; --nav-hover: rgba(99,102,241,0.15);
          --nav-section: #7888a0; --nav-divider: rgba(255,255,255,0.06); --nav-bg: #1e2a3a;
          --nav-border: rgba(255,255,255,0.05); --topbar-bg: #ffffff; --content-bg: #f8fafc;
        }
        [data-theme="dark"] {
          --nav-text: #b8c5d6; --nav-text-hover: #ffffff; --nav-hover: rgba(99,102,241,0.15);
          --nav-section: #7888a0; --nav-divider: rgba(255,255,255,0.06); --nav-bg: #1e2a3a;
          --nav-border: rgba(255,255,255,0.05); --topbar-bg: #1a202c; --content-bg: #0f1419;
        }
        .layout-sidebar { width: var(--sidebar-w); min-height: 100vh; background: var(--nav-bg); border-right: 1px solid var(--nav-border); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 100; transition: width 0.2s ease; overflow: hidden; }
        .layout-main { margin-left: var(--sidebar-w); flex: 1; min-width: 0; min-height: 100vh; background: var(--content-bg); transition: margin-left 0.2s ease; display: flex; flex-direction: column; }
        .layout-topbar { height: 60px; background: var(--topbar-bg); border-bottom: 1px solid var(--nav-border); display: flex; align-items: center; justify-content: space-between; padding: 0 24px; position: sticky; top: 0; z-index: 50; }
        .layout-content { flex: 1; padding: 28px 32px; }
        .sidebar-brand { height: 68px; display: flex; align-items: center; gap: 12px; padding: 0 ${collapsed ? '20px' : '16px'}; border-bottom: 1px solid var(--nav-border); flex-shrink: 0; position: relative; justify-content: ${collapsed ? 'center' : 'flex-start'}; }
        .brand-logo { width: 40px; height: 40px; flex-shrink: 0; background: transparent; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .brand-name { font-size: 18px; font-weight: 600; color: #6b7280; white-space: nowrap; letter-spacing: -0.3px; }
        .sidebar-nav { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 8px 0; }
        .sidebar-nav::-webkit-scrollbar { width: 3px; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: var(--nav-divider); border-radius: 3px; }
        .sidebar-footer { border-top: 1px solid var(--nav-border); padding: 12px 8px; }
        .user-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: background 0.15s; }
        .user-row:hover { background: var(--nav-hover); }
        .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4, #14b8a6); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 700; flex-shrink: 0; }
        .user-name { font-size: 13px; font-weight: 600; color: var(--nav-text-hover); white-space: nowrap; }
        .user-email { font-size: 11px; color: var(--nav-section); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .topbar-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--nav-border); background: transparent; color: var(--nav-text); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; font-size: 16px; }
        .topbar-btn:hover { background: var(--nav-hover); color: var(--nav-text-hover); }
        .dropdown-menu { border: 1px solid var(--nav-border) !important; border-radius: 10px !important; box-shadow: 0 4px 24px rgba(0,0,0,0.10) !important; background: var(--nav-bg) !important; padding: 6px !important; min-width: 160px; }
        .dropdown-item { border-radius: 6px !important; font-size: 13px !important; padding: 7px 12px !important; color: var(--nav-text) !important; }
        .dropdown-item:hover { background: var(--nav-hover) !important; color: var(--nav-text-hover) !important; }
        .dropdown-item.active { background: #2563eb !important; color: #fff !important; }
        .collapse-btn { width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--nav-border); background: var(--nav-bg); color: var(--nav-text); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; position: absolute; right: -12px; top: 20px; z-index: 101; transition: all 0.15s; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        .collapse-btn:hover { background: #6366f1; color: #fff; border-color: #6366f1; }
        .nav-children { overflow: hidden; transition: max-height 0.25s ease, opacity 0.2s ease; }
      `}</style>

      <div style={{ display: 'flex' }}>
        <div className="layout-sidebar">
          <div className="sidebar-brand">
            <div className="brand-logo">
              <img 
                src={tectoroIcon} 
                alt="Tectoro Logo" 
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onError={(e) => {
                  console.error('Logo failed to load');
                  e.target.style.display = 'none';
                }}
              />
            </div>
            {!collapsed && <span className="brand-name">Tectoro</span>}
            
            <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
              <i className={`bi bi-chevron-${collapsed ? 'right' : 'left'}`}></i>
            </button>
          </div>

          <div className="sidebar-nav">
            <SectionLabel label="Main" />
            <NavItem to="/dashboard" icon="speedometer2" label="Dashboard" exact />

            <Divider />
            <SectionHeader label="Assets" section="assets" />
            <div className="nav-children" style={{ maxHeight: (collapsed || openSections.assets) ? '200px' : '0', opacity: (collapsed || openSections.assets) ? 1 : 0 }}>
              <NavItem to="/assets" icon="laptop" label="All Assets" exact />
              {canPerform('create') && <NavItem to="/assets/add" icon="plus-circle" label="Add Asset" exact />}
              {canPerform('import') && <NavItem to="/assets/import" icon="cloud-upload" label="Import Excel" exact />}
            </div>

            <Divider />
            <SectionHeader label="Inventory" section="inventory" />
            <div className="nav-children" style={{ maxHeight: (collapsed || openSections.inventory) ? '600px' : '0', opacity: (collapsed || openSections.inventory) ? 1 : 0 }}>
              <NavItem to="/corporate-sims"    icon="sim"              label="Corporate SIMs" />
              <NavItem to="/inventory/laptop"      icon="laptop"           label="Laptop" />
              <NavItem to="/inventory/cpu"         icon="cpu"              label="CPU" />
              <NavItem to="/inventory/monitor"     icon="display"          label="Monitor" />
              <NavItem to="/inventory/printer"     icon="printer"          label="Printer" />
              <NavItem to="/inventory/phone"       icon="phone"            label="Phone" />
              <NavItem to="/inventory/server"      icon="hdd-rack"         label="Server" />
              <NavItem to="/inventory/mouse"       icon="mouse"            label="Mouse" />
              <NavItem to="/inventory/headphones"  icon="headphones"       label="Headphones" />
              <NavItem to="/inventory/hard-disk"   icon="device-hdd"       label="Hard Disk" />
              <NavItem to="/inventory/ups"         icon="lightning-charge" label="UPS" />
              <NavItem to="/inventory/laptop-bag"  icon="bag"              label="Laptop Bag" />
              <NavItem to="/inventory/other"       icon="three-dots"       label="Other" />
            </div>

            {canPerform('create') && (
              <>
                <Divider />
                <SectionHeader label="Lifecycle" section="lifecycle" />
                <div className="nav-children" style={{ maxHeight: (collapsed || openSections.lifecycle) ? '250px' : '0', opacity: (collapsed || openSections.lifecycle) ? 1 : 0 }}>
                  <NavItem to="/temporary-assignments" icon="arrow-repeat" label="Temp Assignments" exact />
                  <NavItem to="/asset-replacements" icon="arrow-left-right" label="Asset Replacements" exact />
                </div>
              </>
            )}

            <Divider />
            <SectionHeader label="Reports" section="reports" />
            <div className="nav-children" style={{ maxHeight: (collapsed || openSections.reports) ? '250px' : '0', opacity: (collapsed || openSections.reports) ? 1 : 0 }}>
              <NavItem to="/reports"  icon="bar-chart-line"     label="Reports" exact />
              <NavItem to="/warranty" icon="shield-exclamation" label="Warranty" exact />
              <NavItem to="/activity-history" icon="clock-history" label="Activity History" exact />
            </div>

            {canPerform('settings') && (
              <>
                <Divider />
                <SectionHeader label="Settings" section="settings" />
                <div className="nav-children" style={{ maxHeight: (collapsed || openSections.settings) ? '250px' : '0', opacity: (collapsed || openSections.settings) ? 1 : 0 }}>
                  <NavItem to="/employees"     icon="people"        label="Employees" exact />
                  <NavItem to="/onboarding"    icon="person-plus"   label="Onboarding" exact />
                  <NavItem to="/settings"      icon="gear"          label="User Management" exact />
                  <NavItem to="/email-config"  icon="envelope-gear" label="Email Config" />
                </div>
              </>
            )}
          </div>

          <div className="sidebar-footer">
            {!collapsed ? (
              <div className="dropdown">
                <div className="user-row dropdown-toggle" data-bs-toggle="dropdown" style={{ listStyle: 'none' }}>
                  <div className="user-avatar">{user.username[0].toUpperCase()}</div>
                  <div className="user-info">
                    <div className="user-name">{user.username}</div>
                    <div className="user-email">{userInfo?.roleLabel || user.role || 'User'}</div>
                  </div>
                  <i className="bi bi-dots-vertical ms-auto" style={{ color: 'var(--nav-section)', fontSize: '14px' }}></i>
                </div>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-left me-2"></i>Logout</button></li>
                </ul>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                <div className="user-avatar" title={user.username} style={{ cursor: 'pointer' }} onClick={handleLogout}>{user.username[0].toUpperCase()}</div>
              </div>
            )}
          </div>
        </div>

        <div className="layout-main">
          <div className="layout-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
              <GlobalSearch />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="dropdown">
                <button className="topbar-btn" data-bs-toggle="dropdown" title="Theme">
                  <i className={`bi bi-${theme === 'dark' ? 'moon-stars-fill' : 'sun-fill'}`}></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  {[['light','sun-fill','Light'],['dark','moon-stars-fill','Dark'],['system','circle-half','System']].map(([val,ico,lbl]) => (
                    <li key={val}><button className={`dropdown-item ${theme===val?'active':''}`} onClick={() => setTheme(val)}><i className={`bi bi-${ico} me-2`}></i>{lbl}</button></li>
                  ))}
                </ul>
              </div>
              <div className="dropdown">
                <button className="topbar-btn d-flex align-items-center gap-2" style={{ width: 'auto', padding: '0 10px', borderRadius: '8px' }} data-bs-toggle="dropdown">
                  <div className="user-avatar" style={{ width:'28px', height:'28px', fontSize:'12px' }}>{user.username[0].toUpperCase()}</div>
                  <span style={{ fontSize:'13px', fontWeight:'600', color:'#1f2937' }} className="d-none d-md-inline">{user.username}</span>
                  <i className="bi bi-chevron-down" style={{ fontSize:'11px', color:'#6b7280' }}></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><span className="dropdown-item-text" style={{ fontSize:'12px', color:'var(--nav-section)' }}>{user.email || 'admin@company.com'}</span></li>
                  <li><hr className="dropdown-divider" style={{ borderColor:'var(--nav-divider)', margin:'4px 0' }} /></li>
                  <li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-left me-2"></i>Logout</button></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="layout-content">{children || <Outlet />}</div>
        </div>
      </div>
    </>
  );
}

export default Layout;
