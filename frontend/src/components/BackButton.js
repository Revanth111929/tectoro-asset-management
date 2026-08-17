// BackButton.js - Reusable back navigation button component
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * BackButton - A consistent back navigation button across the application
 * Uses browser history navigate(-1) with safe fallback to dashboard
 * 
 * @param {string} fallbackRoute - Optional fallback route (default: '/dashboard')
 * @param {string} className - Additional CSS classes
 * @param {boolean} showText - Show "Back" text (default: true)
 * @param {object} style - Inline styles
 */
function BackButton({ 
  fallbackRoute = '/dashboard', 
  className = '', 
  showText = true,
  style = {} 
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Check if there's a previous page in history
    // window.history.length > 1 means there's history, but we can't reliably check
    // if it's within our app, so we use navigate(-1) and let the browser handle it
    
    // If we came from a specific returnTo state, use that
    if (location.state?.returnTo) {
      navigate(location.state.returnTo);
      return;
    }

    // Check if we have navigation history within the app
    // This is a heuristic - if window.history.length > 2, likely came from within app
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // Direct URL access - go to fallback
      navigate(fallbackRoute);
    }
  };

  return (
    <button 
      type="button"
      onClick={handleBack}
      className={`btn btn-outline-primary btn-sm ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        ...style
      }}
      title="Go back"
    >
      <i className="bi bi-arrow-left"></i>
      {showText && <span>Back</span>}
    </button>
  );
}

export default BackButton;
