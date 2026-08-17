// LoginPage.js - Login page component
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import tectoroLoginLogo from '../assets/tectoro-login-logo.png';
import loginBackground from '../assets/login-bg.png';
import { useTheme } from '../context/ThemeContext';

function LoginPage({ setAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  // Background overlay based on theme
  const overlayColor = theme === 'dark' 
    ? 'rgba(10, 18, 28, 0.12)' 
    : 'rgba(255, 255, 255, 0.06)';
  
  const backgroundStyle = {
    backgroundImage: `linear-gradient(${overlayColor}, ${overlayColor}), url(${loginBackground})`
  };

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
    <div className="login-page" style={backgroundStyle}>
      {/* Left Side - Branding */}
      <div className="login-branding">
        <div className="brand-header">
          <div className="brand-logo">
            <img 
              src={tectoroLoginLogo} 
              alt="Tectoro Logo" 
              className="brand-logo-img"
              onError={(e) => {
                console.error('Login logo failed to load');
                e.target.style.display = 'none';
              }}
            />
            <div className="brand-text">
              <div className="brand-name">Tectoro</div>
              <div className="brand-tagline">ASSET MANAGEMENT</div>
            </div>
          </div>
        </div>

        <div className="brand-hero">
          <h1 className="hero-title">
            Smart Assets,<br />
            <span className="hero-accent">Stronger</span> Business
          </h1>
          <p className="hero-subtitle">Track. Manage. Optimize.</p>
        </div>
      </div>

      {/* Right Side - Login Panel */}
      <div className="login-panel-container">
        <div className="login-panel">
          <div className="panel-header">
            <h2>Login</h2>
            <p>Welcome back! Please sign in to continue</p>
          </div>

          {error && (
            <div className="login-error">
              <i className="bi bi-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {/* USERNAME INPUT - Proper structure with separate icon area */}
            <div className="login-field">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <i className="bi bi-person"></i>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* PASSWORD INPUT - Proper structure with separate icon and toggle areas */}
            <div className="login-field">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper password-wrapper">
                <div className="input-icon">
                  <i className="bi bi-lock"></i>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex="-1"
                >
                  <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>

            <div className="form-footer">
              <label className="checkbox-label">
                <input type="checkbox" id="remember" />
                <span>Remember me</span>
              </label>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Logging in...</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
