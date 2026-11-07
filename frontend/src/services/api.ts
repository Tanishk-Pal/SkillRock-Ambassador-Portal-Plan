import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

export const getUploadUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
    : '';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if trying to login
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = currentPath.startsWith('/admin') ? '/admin/login' : '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  adminLogin: (data: { email: string; password: string }) => api.post('/auth/admin/login', data),
  forgotPassword: (data: { email: string }) => api.post('/auth/forgot-password', data),
  resetPassword: (data: { token: string; newPassword: string }) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
};

export const ambassadorAPI = {
  getDashboard: () => api.get('/ambassador/dashboard'),
  getPoints: () => api.get('/ambassador/points'),
  getSales: () => api.get('/ambassador/sales'),
  updateProfile: (data: any) => api.put('/ambassador/profile', data),
};

export const taskAPI = {
  getTasks: () => api.get('/tasks'),
  getTaskDetail: (taskId: string) => api.get(`/tasks/${taskId}`),
  submitTask: (taskId: string, formData: FormData) =>
    api.post(`/tasks/${taskId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const leaderboardAPI = {
  getLeaderboard: (search?: string) =>
    api.get('/leaderboard', { params: search ? { search } : {} }),
};

export const rewardsAPI = {
  getRewards: () => api.get('/rewards'),
};

export const salesAPI = {
  validateSRID: (srid: string) => api.get(`/sales/validate-srid/${srid}`),
  recordSale: (data: any) => api.post('/sales/record-sale', data),
};

export const adminAPI = {
  getStats: () => api.get('/admin/dashboard'),
  getAmbassadors: (params?: any) => api.get('/admin/ambassadors', { params }),
  createAmbassador: (data: any) => api.post('/admin/ambassadors', data),
  updateAmbassador: (id: string, data: any) => api.put(`/admin/ambassadors/${id}`, data),
  deleteAmbassador: (id: string) => api.delete(`/admin/ambassadors/${id}`),
  adjustPoints: (data: any) => api.post('/admin/points/adjust', data),
  getApplicants: () => api.get('/admin/applicants'),
  convertApplicant: (applicantId: string) => api.post(`/admin/applicants/${applicantId}/convert`),
  getTasks: () => api.get('/admin/tasks'),
  createTask: (data: any) => api.post('/admin/tasks', data),
  updateTask: (id: string, data: any) => api.put(`/admin/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete(`/admin/tasks/${id}`),
  getSubmissions: (params?: any) => api.get('/admin/submissions', { params }),
  reviewSubmission: (id: string, data: any) => api.post(`/admin/submissions/${id}/review`, data),
  getSales: (params?: any) => api.get('/admin/sales', { params }),
  updateSaleCommission: (id: string, data: any) => api.put(`/admin/sales/${id}/commission`, data),
  getCommissionSettings: () => api.get('/admin/settings/commission'),
  updateCommissionSettings: (data: any) => api.put('/admin/settings/commission', data),
  getRewards: () => api.get('/admin/rewards'),
  updateRewardTier: (id: string, data: any) => api.put(`/admin/rewards/${id}`, data),
};

export default api;
