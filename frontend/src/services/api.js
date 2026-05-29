// api.js – Axios API service for all backend calls
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:  (username, password) => api.post('/auth/login', { username, password }),
  logout: ()                   => api.post('/auth/logout'),
};

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats:    () => api.get('/dashboard/stats'),
  getActivity: () => api.get('/dashboard/activity'),
};

// ── ASSETS ────────────────────────────────────────────────────────────────────
export const assetAPI = {
  getAll:    (params) => api.get('/assets', { params }),
  getById:   (id)     => api.get(`/assets/${id}`),
  create:    (data)   => api.post('/assets', data),
  update:    (id, data) => api.put(`/assets/${id}`, data),
  delete:    (id)     => api.delete(`/assets/${id}`),
  getExpiring: (days) => api.get('/assets/warranty/expiring', { params: { days } }),
};

// ── REPORTS ───────────────────────────────────────────────────────────────────
export const reportAPI = {
  exportCSV:      () => api.get('/reports/export/csv',   { responseType: 'blob' }),
  exportExcel:    () => api.get('/reports/export/excel', { responseType: 'blob' }),
  getActivityLog: (params) => api.get('/reports/activity', { params }),
};

export default api;
