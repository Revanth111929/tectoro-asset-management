// InactivityContext.js - 30-minute inactivity auto-logout
import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const InactivityContext = createContext();

export const useInactivity = () => {
  const context = useContext(InactivityContext);
  if (!context) throw new Error('useInactivity must be used within InactivityProvider');
  return context;
};

// Inactivity timeout: 30 minutes (in milliseconds)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Storage key for last activity timestamp
const LAST_ACTIVITY_KEY = 'lastActivityTimestamp';

export const InactivityProvider = ({ children, isAuthenticated }) => {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Logout function - clears all auth state
  const performLogout = useCallback(() => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem(LAST_ACTIVITY_KEY);

    // Show toast notification
    toast.error('Session expired due to inactivity.');

    // Redirect to login
    navigate('/login', { replace: true });

    // Force reload to clear any app state
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  }, [navigate]);

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    if (!isAuthenticated) return;

    const now = Date.now();
    lastActivityRef.current = now;

    // Store in localStorage for cross-tab sync and refresh persistence
    localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());

    // Reset the inactivity timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      performLogout();
    }, INACTIVITY_TIMEOUT);
  }, [isAuthenticated, performLogout]);

  // Check if session has expired (for page refresh)
  const checkSessionExpiry = useCallback(() => {
    if (!isAuthenticated) return;

    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!lastActivity) {
      // No activity recorded, start fresh
      updateActivity();
      return;
    }

    const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);

    if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
      // Session expired during refresh
      performLogout();
    } else {
      // Session still valid, set remaining time
      const remainingTime = INACTIVITY_TIMEOUT - timeSinceLastActivity;
      updateActivity(); // This will set full 30 min, which is fine for user activity on page load

      // Set timer for remaining time only
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        performLogout();
      }, remainingTime);
    }
  }, [isAuthenticated, performLogout, updateActivity]);

  // Setup activity listeners
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear timer if not authenticated
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Check session on mount (handles page refresh)
    checkSessionExpiry();

    // User activity events to track
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'wheel'
    ];

    // Throttle activity updates to avoid excessive calls
    let throttleTimer = null;
    const throttledUpdateActivity = () => {
      if (!throttleTimer) {
        updateActivity();
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
        }, 1000); // Throttle to once per second
      }
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, throttledUpdateActivity, true);
    });

    // Listen for storage changes (cross-tab logout)
    const handleStorageChange = (e) => {
      if (e.key === 'token' && !e.newValue) {
        // Token was removed in another tab, logout this tab too
        performLogout();
      }
      if (e.key === LAST_ACTIVITY_KEY && e.newValue) {
        // Activity in another tab, update local reference
        lastActivityRef.current = parseInt(e.newValue, 10);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledUpdateActivity, true);
      });
      window.removeEventListener('storage', handleStorageChange);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [isAuthenticated, updateActivity, checkSessionExpiry, performLogout]);

  return (
    <InactivityContext.Provider value={{ updateActivity }}>
      {children}
    </InactivityContext.Provider>
  );
};
