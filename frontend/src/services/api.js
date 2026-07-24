// api.js – Axios API service for all backend calls
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.20.180:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 second timeout
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auto-logout on 401 and handle token refresh
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Handle 401 errors
    if (err.response?.status === 401) {
      // If this is already a retry, logout
      if (originalRequest._retry) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(err);
      }

      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        originalRequest._retry = true;
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          const { access_token, token } = response.data;
          const newToken = access_token || token;
          
          localStorage.setItem('token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Handle network errors
    if (!err.response) {
      console.error('Network error:', err.message);
      err.userMessage = 'Network error. Please check your connection and try again.';
    }

    return Promise.reject(err);
  }
);

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  me: () => api.get('/auth/me'),
};

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getActivity: () => api.get('/dashboard/activity'),
};

// ── ASSETS ────────────────────────────────────────────────────────────────────
export const assetAPI = {
  getAll: (params) => api.get('/assets', { params }),
  getById: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets', data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  delete: (id) => api.delete(`/assets/${id}`),
  getExpiring: (days) => api.get('/assets/warranty/expiring', { params: { days } }),
  getHistory: (id) => api.get(`/assets/${id}/history`),
  bulkUpdate: (ids, data) => api.put('/assets/bulk', { ids, ...data }),
};

// ── REPORTS ───────────────────────────────────────────────────────────────────
export const reportAPI = {
  exportCSV: () => api.get('/reports/export/csv', { responseType: 'blob' }),
  exportExcel: () => api.get('/reports/export/excel', { responseType: 'blob' }),
  getActivityLog: (params) => api.get('/reports/activity', { params }),
};

// ── ACKNOWLEDGMENT ───────────────────────────────────────────────────────────
export const ackAPI = {
  sendEmail: (assetId) => api.post(`/assets/${assetId}/send-ack-email`),
  getStatus: (assetId) => api.get(`/assets/${assetId}/ack-status`),
};

// ── EMAIL CONFIG ──────────────────────────────────────────────────────────────
export const emailConfigAPI = {
  get: () => api.get('/email-config'),
  save: (data) => api.post('/email-config', data),
  test: (data) => api.post('/email-config/test', data),
};

// ── EMPLOYEES ─────────────────────────────────────────────────────────────────
export const employeeAPI = {
  search: (q) => api.get('/employees', { params: { q } }),
  getById: (emp_id) => api.get(`/employees/${emp_id}`),
  createOrUpdate: (data) => api.post('/employees', data),
  getAssets: (emp_id) => api.get(`/employees/${emp_id}/assets`),
  processExit: (emp_id, data) => api.post(`/employees/${emp_id}/exit`, data),
};

// ── ADMIN PROFILE ─────────────────────────────────────────────────────────────
export const adminProfileAPI = {
  get: () => api.get('/admin-profile'),
  save: (data) => api.post('/admin-profile', data),
};

// ── ONBOARDING ────────────────────────────────────────────────────────────────
export const onboardingAPI = {
  getAll: (params) => api.get('/onboarding', { params }),
  getById: (id) => api.get(`/onboarding/${id}`),
  create: (data) => api.post('/onboarding', data),
  update: (id, data) => api.put(`/onboarding/${id}`, data),
  delete: (id) => api.delete(`/onboarding/${id}`),
  convertToEmployee: (id, data) => api.post(`/onboarding/${id}/convert`, data),
  getAvailableAssets: (params) => api.get('/onboarding/available-assets', { params }),
};

// ── USERS (Admin Management) ──────────────────────────────────────────────────
export const userAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;
