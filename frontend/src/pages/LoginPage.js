// LoginPage.js - Login page component
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import tectoroLoginLogo from '../assets/tectoro-login-logo.png';

function LoginPage({ setAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

 const API_BASE_URL = '/api';

try {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username,
      password
    })
  });

  const data = await response.json();
      
      if (response.ok && data.success) {
        // Store JWT tokens (support both old and new format)
        const token = data.access_token || data.token;
        const refreshToken = data.refresh_token;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
        
        // Set token expiry (use expires_in from response or default to 1 hour)
        const expiresIn = data.expires_in || 3600;
        const expiry = new Date().getTime() + (expiresIn * 1000);
        localStorage.setItem('tokenExpiry', expiry.toString());
        
        setAuth(true);
        navigate('/dashboard');
      } else {
        setError(data.error || data.message || 'Invalid username or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left Panel - Login Form */}
      <div className="login-panel">
        <div className="login-logo">
          <div className="logo-icon">
            <img 
              src={tectoroLoginLogo} 
              alt="Tectoro Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                console.error('Login logo failed to load');
                e.target.style.display = 'none';
              }}
            />
          </div>
          <span>Tectoro</span>
        </div>

        <h2 className="login-title">Welcome back</h2>
        <p className="login-sub">Sign in to your account to continue</p>

        {error && (
          <div className="alert alert-danger py-2 mb-3">
            <i className="bi bi-exclamation-circle me-2"></i>{error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-person"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-lock"></i>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
              </button>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="remember" />
              <label className="form-check-label text-muted small" htmlFor="remember">
                Remember me
              </label>
            </div>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Logging in...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2"></i>LOGIN
              </>
            )}
          </button>
        </form>

        <div className="dots">
          <div className="dot active"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>

      {/* Right Panel - Hero */}
      <div className="hero-panel">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>

        <div className="float-card c1">
          <i className="bi bi-laptop"></i> 10 Assets Tracked
        </div>
        <div className="float-card c2">
          <i className="bi bi-people"></i> 5 Employees
        </div>
        <div className="float-card c3">
          <i className="bi bi-graph-up-arrow"></i> Reports Ready
        </div>
        <div className="float-card c4">
          <i className="bi bi-shield-check"></i> Secure &amp; Fast
        </div>

        <div className="hero-text">
          <h1>Welcome.</h1>
          <p>Your complete asset management solution. Track everything, lose nothing.</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
