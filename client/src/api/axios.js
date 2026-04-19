import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 with token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  getMe: () => api.get('/auth/me'),
};

// ─── Leads API ────────────────────────────
export const leadsAPI = {
  getAll: (params) => api.get('/leads', { params }),
  getById: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
  assign: (id, agentId) => api.post(`/leads/${id}/assign`, { agentId }),
  importCSV: (formData) => api.post('/leads/import-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getActivities: (id) => api.get(`/leads/${id}/activities`),
  createFollowUp: (id, data) => api.post(`/leads/${id}/follow-ups`, data),
  bulkAssign: (data) => api.post('/leads/bulk-assign', data),
  bulkStatus: (data) => api.post('/leads/bulk-status', data),
};

// ─── Properties API ───────────────────────
export const propertiesAPI = {
  getAll: (params) => api.get('/properties', { params }),
  getById: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  uploadImages: (id, formData) => api.post(`/properties/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ─── Clients API ──────────────────────────
export const clientsAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  logInteraction: (id, data) => api.post(`/clients/${id}/interactions`, data),
  getInteractions: (id) => api.get(`/clients/${id}/interactions`),
  createFollowUp: (id, data) => api.post(`/clients/${id}/follow-ups`, data),
};

// ─── Deals API ────────────────────────────
export const dealsAPI = {
  getAll: (params) => api.get('/deals', { params }),
  getKanban: () => api.get('/deals/kanban'),
  getById: (id) => api.get(`/deals/${id}`),
  create: (data) => api.post('/deals', data),
  update: (id, data) => api.put(`/deals/${id}`, data),
  updateStage: (id, stage) => api.patch(`/deals/${id}/stage`, { stage }),
  uploadDocuments: (id, formData) => api.post(`/deals/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ─── Users API ────────────────────────────
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.patch(`/users/${id}/deactivate`),
  getStats: (id) => api.get(`/users/${id}/stats`),
  bulkReassign: (data) => api.post('/users/bulk-reassign', data),
};

// ─── Reports API ──────────────────────────
export const reportsAPI = {
  getDashboardStats: () => api.get('/reports/dashboard-stats'),
  getLeadsBySource: (year) => api.get('/reports/leads-by-source', { params: { year } }),
  getConversionFunnel: () => api.get('/reports/conversion-funnel'),
  getRevenueByMonth: (year) => api.get('/reports/revenue-by-month', { params: { year } }),
  getAgentLeaderboard: () => api.get('/reports/agent-leaderboard'),
  getTopProperties: () => api.get('/reports/top-properties'),
};

// ─── Settings API ─────────────────────────
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  uploadLogo: (formData) => api.post('/settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export default api;
