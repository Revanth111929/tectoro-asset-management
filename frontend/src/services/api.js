// api.js – Axios API service for all backend calls
import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  `${window.location.protocol}//${window.location.host}/api`;

console.log('[API Service] Initialized with base URL:', API_BASE_URL);

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
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, config.data ? config.data : '');
  } else {
    console.warn('[API] No token found in localStorage');
  }
  return config;
}, (error) => {
  console.error('[API] Request interceptor error:', error);
  return Promise.reject(error);
});

// Auto-logout on 401 and handle token refresh
api.interceptors.response.use(
  (res) => {
    console.log(`[API] Response: ${res.status} ${res.config.method.toUpperCase()} ${res.config.url}`);
    return res;
  },
  async (err) => {
    console.error('[API] Response error:', err);
    const originalRequest = err.config;

    // Handle 401 errors
    if (err.response?.status === 401) {
      console.warn('[API] 401 Unauthorized - attempting token refresh');
      // If this is already a retry, logout
      if (originalRequest._retry) {
        console.error('[API] Token refresh failed, logging out');
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
          
          console.log('[API] Token refreshed successfully');
          localStorage.setItem('token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          return api(originalRequest);
        } catch (refreshError) {
          console.error('[API] Token refresh error:', refreshError);
          // Refresh failed, logout
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        console.warn('[API] No refresh token available, logging out');
        // No refresh token, logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Handle network errors
    if (!err.response) {
      console.error('[API] Network error:', err.message);
      err.userMessage = 'Network error. Please check your connection and try again.';
    } else {
      console.error(`[API] Error ${err.response.status}:`, err.response.data);
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
  getAll: (params) => {
    console.log('[assetAPI] getAll called with params:', params);
    return api.get('/assets', { params });
  },
  getById: (id) => {
    console.log('[assetAPI] getById called for ID:', id);
    return api.get(`/assets/${id}`);
  },
  create: (data) => {
    console.log('[assetAPI] create called with data:', data);
    return api.post('/assets', data);
  },
  update: (id, data) => {
    console.log('[assetAPI] update called for ID:', id, 'with data:', data);
    return api.put(`/assets/${id}`, data);
  },
  delete: (id) => {
    console.log('[assetAPI] delete called for ID:', id);
    console.log('[assetAPI] DELETE URL:', `/assets/${id}`);
    return api.delete(`/assets/${id}`);
  },
  getExpiring: (days) => api.get('/assets/warranty/expiring', { params: { days } }),
  getHistory: (id) => api.get(`/assets/${id}/history`),
  bulkUpdate: (ids, data) => api.put('/assets/bulk', { ids, ...data }),
  // Phase 3: Validation endpoints
  validateSerialNumber: (data) => {
    console.log('[assetAPI] validateSerialNumber called with:', data);
    return api.post('/assets/validate/serial-number', data);
  },
  validateAssignment: (data) => {
    console.log('[assetAPI] validateAssignment called with:', data);
    return api.post('/assets/validate/assignment', data);
  },
  validateAvailability: (assetId) => {
    console.log('[assetAPI] validateAvailability called for asset:', assetId);
    return api.get(`/assets/validate/availability/${assetId}`);
  },
  getStatusInfo: () => {
    console.log('[assetAPI] getStatusInfo called');
    return api.get('/assets/status-info');
  },
  // Phase 4.1: Operations Engine
  getAvailableOperations: (assetId) => {
    console.log('[assetAPI] getAvailableOperations called for asset:', assetId);
    return api.get(`/operations/available/${assetId}`);
  },
  assignAsset: (data) => {
    console.log('[assetAPI] assignAsset called with:', data);
    return api.post('/operations/assign', data);
  },
  returnAsset: (data) => {
    console.log('[assetAPI] returnAsset called with:', data);
    return api.post('/operations/return', data);
  },
  // Phase 4.2: Transfer Asset
  transferAsset: (data) => {
    console.log('[assetAPI] transferAsset called with:', data);
    return api.post('/operations/transfer', data);
  },
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
  // Phase 1: New methods
  create: (data) => api.post('/employees', data),
  update: (emp_id, data) => api.put(`/employees/${emp_id}`, data),
  disable: (emp_id) => api.post(`/employees/${emp_id}/disable`),
  bulkImport: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/employees/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  downloadTemplate: () => api.get('/employees/template', { responseType: 'blob' }),
  // Existing methods
  getAssets: (emp_id) => api.get(`/employees/${emp_id}/assets`),
  getAssetHistory: (emp_id) => api.get(`/employees/${emp_id}/asset-history`),
  processExit: (emp_id, data) => api.post(`/employees/${emp_id}/exit`, data),
  // Phase 3: Validation endpoint
  validate: (emp_id) => {
    console.log('[employeeAPI] validate called for employee:', emp_id);
    return api.get(`/employees/validate/${emp_id}`);
  },
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

// ── CORPORATE SIMS ────────────────────────────────────────────────────────────
export const corporateSimAPI = {
  getAll: (params) => api.get('/corporate-sims', { params }),
  getById: (id) => api.get(`/corporate-sims/${id}`),
  create: (data) => api.post('/corporate-sims', data),
  update: (id, data) => api.put(`/corporate-sims/${id}`, data),
  delete: (id) => api.delete(`/corporate-sims/${id}`),
  assign: (id, data) => api.post(`/corporate-sims/${id}/assign`, data),
  return: (id, data) => api.post(`/corporate-sims/${id}/return`, data),
  getStats: () => api.get('/corporate-sims/stats'),
};

// ── INVOICE ATTACHMENT ────────────────────────────────────────────────────────
export const invoiceAPI = {
  upload: (assetId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/assets/${assetId}/invoice/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getInfo: (assetId) => api.get(`/assets/${assetId}/invoice`),
  download: (assetId) => {
    return api.get(`/assets/${assetId}/invoice/download`, {
      responseType: 'blob',
    });
  },
  view: (assetId) => {
    // Returns the file URL for inline viewing
    return `${API_BASE_URL}/assets/${assetId}/invoice/view`;
  },
};

// ── GLOBAL SEARCH ─────────────────────────────────────────────────────────────
export const searchAPI = {
  global: (query, type = 'all', limit = 10) => api.get('/search/global', {
    params: { q: query, type, limit }
  }),
};

export default api;
