import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor: attach JWT token ────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cloudshaw_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor: handle expired tokens ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear auth and redirect to login
      localStorage.removeItem('cloudshaw_token');
      localStorage.removeItem('cloudshaw_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  checkEmail: (email) => api.post('/auth/check-email', { email }),
  me: () => api.get('/auth/me'),
};

// ── Folder API ───────────────────────────────────────────────────────────────
export const folderApi = {
  getAll: () => api.get('/folders'),
  getById: (id) => api.get(`/folders/${id}`),
  create: (data) => api.post('/folders', data),
  update: (id, data) => api.put(`/folders/${id}`, data),
  delete: (id) => api.delete(`/folders/${id}`),
};

// ── Media API ────────────────────────────────────────────────────────────────
export const mediaApi = {
  upload: (folderId, formData, onProgress) =>
    api.post(`/media/${folderId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),

  getByFolder: (folderId, params = {}) => api.get(`/media/${folderId}`, { params }),

  getById: (id) => api.get(`/media/item/${id}`),

  update: (id, data) => api.put(`/media/item/${id}`, data),

  toggleStatus: (id, status) => api.patch(`/media/item/${id}/status`, { status }),

  bulk: (ids, action, status) => api.patch('/media/bulk', { ids, action, status }),

  delete: (id) => api.delete(`/media/item/${id}`),
};

// ── Analytics API ────────────────────────────────────────────────────────────
export const analyticsApi = {
  overview: () => api.get('/analytics/overview'),
  platformBreakdown: () => api.get('/analytics/platform-breakdown'),
  activity: () => api.get('/analytics/activity'),
};

// ── Search API ───────────────────────────────────────────────────────────────
export const searchApi = {
  global: (q) => api.get('/search', { params: { q } }),
};

export default api;
