import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS } from '../utils/constants';
import { getFromStorage, removeFromStorage } from '../utils/helpers';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getFromStorage(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored auth data and redirect to login
      removeFromStorage(STORAGE_KEYS.AUTH_TOKEN);
      removeFromStorage(STORAGE_KEYS.USER_DATA);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verify: () => api.get('/auth/verify'),
  logout: () => api.post('/auth/logout'),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  getByFarm: (farmLocation, params) => api.get(`/users/farm/${farmLocation}`, { params }),
  updatePermissions: (id, permissions) => api.put(`/users/${id}/permissions`, { permissions }),
};

// Farms API
export const farmsAPI = {
  getAll: () => api.get('/farms'),
  getById: (id) => api.get(`/farms/${id}`),
  create: (farmData) => api.post('/farms', farmData),
  update: (id, farmData) => api.put(`/farms/${id}`, farmData),
  delete: (id) => api.delete(`/farms/${id}`),
  getSettings: (farmLocation) => api.get(`/farms/${farmLocation}/settings`),
  updateSettings: (farmLocation, settings) => api.put(`/farms/${farmLocation}/settings`, { settings }),
  getSummary: (farmLocation, params) => api.get(`/farms/${farmLocation}/summary`, { params }),
  initialize: (farmLocation) => api.post(`/farms/${farmLocation}/initialize`),
};

// Cows API
export const cowsAPI = {
  getAll: (params) => api.get('/cows', { params }),
  getById: (id) => api.get(`/cows/${id}`),
  create: (cowData) => api.post('/cows', cowData),
  update: (id, cowData) => api.put(`/cows/${id}`, cowData),
  delete: (id) => api.delete(`/cows/${id}`),
  updatePregnancy: (id, pregnancyData) => api.put(`/cows/${id}/pregnancy`, pregnancyData),
  getByFarm: (farmLocation, params) => api.get(`/cows/farm/${farmLocation}`, { params }),
};

// Milk API
export const milkAPI = {
  getAll: (params) => api.get('/milk', { params }),
  getById: (id) => api.get(`/milk/${id}`),
  create: (milkData) => api.post('/milk', milkData),
  update: (id, milkData) => api.put(`/milk/${id}`, milkData),
  delete: (id) => api.delete(`/milk/${id}`),
  getByCow: (cowId, params) => api.get(`/milk/cow/${cowId}`, { params }),
  getStats: (params) => api.get('/milk/stats/production', { params }),
  getSales: (params) => api.get('/milk/sales/records', { params }),
  createSale: (saleData) => api.post('/milk/sales', saleData),
};

// Feed API
export const feedAPI = {
  getAll: (params) => api.get('/feeds', { params }),
  getById: (id) => api.get(`/feeds/${id}`),
  create: (feedData) => api.post('/feeds', feedData),
  createBulk: (feedData) => api.post('/feeds/bulk', feedData),
  update: (id, feedData) => api.put(`/feeds/${id}`, feedData),
  delete: (id) => api.delete(`/feeds/${id}`),
  getByCow: (cowId, params) => api.get(`/feeds/cow/${cowId}`, { params }),
  getStats: (params) => api.get('/feeds/stats/consumption', { params }),
  getInventory: (params) => api.get('/feeds/inventory', { params }),
  createInventory: (inventoryData) => api.post('/feeds/inventory', inventoryData),
  updateInventory: (id, inventoryData) => api.put(`/feeds/inventory/${id}`, inventoryData),
  markForRestock: (id) => api.put(`/feeds/inventory/${id}/restock`),
};

// Health API
export const healthAPI = {
  getAll: (params) => api.get('/health', { params }),
  getById: (id) => api.get(`/health/${id}`),
  create: (healthData) => api.post('/health', healthData),
  update: (id, healthData) => api.put(`/health/${id}`, healthData),
  delete: (id) => api.delete(`/health/${id}`),
  getByCow: (cowId, params) => api.get(`/health/cow/${cowId}`, { params }),
  getStats: (params) => api.get('/health/stats/overview', { params }),
  getVetStats: (params) => api.get('/health/stats/veterinarians', { params }),
  scheduleFollowUp: (id, followUpData) => api.put(`/health/${id}/follow-up`, followUpData),
};

// Chicken API
export const chickenAPI = {
  // Batches
  getAllBatches: (params) => api.get('/chicken/batches', { params }),
  getBatchById: (id) => api.get(`/chicken/batches/${id}`),
  createBatch: (batchData) => api.post('/chicken/batches', batchData),
  updateBatch: (id, batchData) => api.put(`/chicken/batches/${id}`, batchData),
  deleteBatch: (id) => api.delete(`/chicken/batches/${id}`),
  updateCount: (id, countData) => api.put(`/chicken/batches/${id}/count`, countData),
  
  // Eggs
  getAllEggs: (params) => api.get('/chicken/eggs', { params }),
  createEgg: (eggData) => api.post('/chicken/eggs', eggData),
  updateEgg: (id, eggData) => api.put(`/chicken/eggs/${id}`, eggData),
  deleteEgg: (id) => api.delete(`/chicken/eggs/${id}`),
  getEggStats: (params) => api.get('/chicken/eggs/stats', { params }),
  
  // Feed
  getFeed: (params) => api.get('/chicken/feed', { params }),
  createFeed: (feedData) => api.post('/chicken/feed', feedData),
};

// Stats API
export const statsAPI = {
  getDashboard: (params) => api.get('/stats/dashboard', { params }),
  getProduction: (params) => api.get('/stats/production', { params }),
  getFinancial: (params) => api.get('/stats/financial', { params }),
  getPerformance: (params) => api.get('/stats/performance', { params }),
  getComparison: (params) => api.get('/stats/comparison', { params }),
  getCustomReport: (reportData) => api.post('/stats/custom-report', reportData),
};

// Health check
export const healthCheck = () => axios.get(`${API_BASE_URL.replace('/api', '')}/health`);

// Generic API methods
export const apiService = {
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),
  patch: (url, data, config) => api.patch(url, data, config),
};

export default api;