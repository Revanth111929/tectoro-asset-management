import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="lp-root">
      {/* ── Navbar ── */}
      <nav className="lp-nav">
        <div className="lp-brand">
          <div className="lp-logo-icon"><i className="bi bi-laptop"></i></div>
          <span className="lp-brand-name">Tectoro</span>
        </div>
        <div className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#features">About</a>
          <Link to="/login" className="lp-btn-signin">Sign In</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        {/* Left */}
        <div className="lp-hero-left">
          <div className="lp-badge">
            <span className="lp-badge-dot"></span>
            Smart Asset Management System
          </div>
          <h1 className="lp-title">
            Manage Every<br />
            <span className="lp-title-accent">Asset</span> With<br />
            Confidence
          </h1>
          <p className="lp-subtitle">
            Track, assign, and manage all your company assets in one place.
            Real-time dashboards, employee assignments, inventory alerts, and detailed reports.
          </p>
          <div className="lp-hero-actions">
            <Link to="/login" className="lp-btn-primary">
              <i className="bi bi-rocket-takeoff me-2"></i>Get Started
            </Link>
            <a href="#features" className="lp-btn-outline">
              <i className="bi bi-play-circle me-2"></i>Learn More
            </a>
          </div>

          {/* Stats */}
          <div className="lp-stats">
            {[['500+','Assets Tracked'],['100%','Uptime'],['50+','Employees'],['24/7','Monitoring']].map(([n,l]) => (
              <div key={l} className="lp-stat">
                <div className="lp-stat-num">{n}</div>
                <div className="lp-stat-lbl">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Illustration */}
        <div className="lp-hero-right">
          <div className="lp-illustration">
            {/* Main laptop card */}
            <div className="lp-device-card lp-laptop">
              <div className="lp-device-screen">
                <div className="lp-screen-bar"></div>
                <div className="lp-screen-content">
                  <div className="lp-mini-chart">
                    <div className="lp-donut">
                      <svg viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="28" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                        <circle cx="40" cy="40" r="28" fill="none" stroke="#2563eb" strokeWidth="12"
                          strokeDasharray="105 70" strokeLinecap="round" transform="rotate(-90 40 40)"/>
                        <circle cx="40" cy="40" r="28" fill="none" stroke="#16a34a" strokeWidth="12"
                          strokeDasharray="35 140" strokeDashoffset="-105" strokeLinecap="round" transform="rotate(-90 40 40)"/>
                      </svg>
                      <div className="lp-donut-label">Assets</div>
                    </div>
                    <div className="lp-bar-chart">
                      {[60,85,45,90,55,75].map((h,i) => (
                        <div key={i} className="lp-bar" style={{ height: `${h}%`, background: i%2===0 ? '#2563eb' : '#93c5fd' }}></div>
                      ))}
                    </div>
                  </div>
                  <div className="lp-screen-stats">
                    <div className="lp-ss-item"><span className="lp-ss-dot" style={{background:'#2563eb'}}></span>Assigned</div>
                    <div className="lp-ss-item"><span className="lp-ss-dot" style={{background:'#16a34a'}}></span>Available</div>
                  </div>
                </div>
              </div>
              <div className="lp-device-base"></div>
            </div>

            {/* Floating cards */}
            <div className="lp-float-card lp-fc1">
              <div className="lp-fc-icon" style={{background:'rgba(37,99,235,0.12)',color:'#2563eb'}}>
                <i className="bi bi-laptop"></i>
              </div>
              <div>
                <div className="lp-fc-num">34</div>
                <div className="lp-fc-lbl">Total Assets</div>
              </div>
            </div>

            <div className="lp-float-card lp-fc2">
              <div className="lp-fc-icon" style={{background:'rgba(22,163,74,0.12)',color:'#16a34a'}}>
                <i className="bi bi-check-circle"></i>
              </div>
              <div>
                <div className="lp-fc-num">28</div>
                <div className="lp-fc-lbl">Assigned</div>
              </div>
            </div>

            <div className="lp-float-card lp-fc3">
              <div className="lp-fc-icon" style={{background:'rgba(217,119,6,0.12)',color:'#d97706'}}>
                <i className="bi bi-shield-exclamation"></i>
              </div>
              <div>
                <div className="lp-fc-num">3</div>
                <div className="lp-fc-lbl">Warranty Alert</div>
              </div>
            </div>

            <div className="lp-float-card lp-fc4">
              <div className="lp-fc-icon" style={{background:'rgba(124,58,237,0.12)',color:'#7c3aed'}}>
                <i className="bi bi-people"></i>
              </div>
              <div>
                <div className="lp-fc-num">12</div>
                <div className="lp-fc-lbl">Employees</div>
              </div>
            </div>

            {/* BG blob */}
            <div className="lp-blob"></div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-features" id="features">
        <div className="lp-features-header">
          <h2>Everything You Need</h2>
          <p>A complete solution for modern IT asset management</p>
        </div>
        <div className="lp-features-grid">
          {[
            { icon:'speedometer2', color:'#2563eb', bg:'#dbeafe', title:'Real-time Dashboard', desc:'Live stats on total, assigned, and available assets with visual charts.' },
            { icon:'laptop',       color:'#16a34a', bg:'#dcfce7', title:'Asset Tracking',      desc:'Track every asset with serial numbers, warranty dates, and conditions.' },
            { icon:'people',       color:'#d97706', bg:'#fef3c7', title:'Employee Assignment', desc:'Assign and return assets to employees with full history tracking.' },
            { icon:'box-seam',     color:'#9333ea', bg:'#f3e8ff', title:'Inventory Control',   desc:'Monitor stock levels, get low-stock alerts, and manage vendors.' },
            { icon:'file-earmark-bar-graph', color:'#dc2626', bg:'#fee2e2', title:'Reports & Export', desc:'Export to CSV or PDF. Full activity logs and audit trails.' },
            { icon:'gear',         color:'#0284c7', bg:'#e0f2fe', title:'User Management',     desc:'Create admin and standard users with role-based access control.' },
          ].map(f => (
            <div key={f.title} className="lp-feature-card">
              <div className="lp-feature-icon" style={{ background: f.bg, color: f.color }}>
                <i className={`bi bi-${f.icon}`}></i>
              </div>
              <h5>{f.title}</h5>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="lp-features-cta">
          <Link to="/login" className="lp-btn-primary">
            <i className="bi bi-arrow-right-circle me-2"></i>Go to Dashboard
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <p>© 2025 Tectoro Asset Management. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
