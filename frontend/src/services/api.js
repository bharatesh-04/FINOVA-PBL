import axios from 'axios';

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const DEFAULT_API_URL = isLocalhost
  ? 'http://localhost:8000/api'
  : 'https://finova-fpr3.onrender.com/api';

// Use environment variable if set, otherwise use default
const API_BASE_URL = process.env.REACT_APP_API_URL || DEFAULT_API_URL;

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const normalizeParams = (params, key) => (
  params && typeof params === 'object' ? params : { [key]: params }
);

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
};

export const transactionAPI = {
  createTransaction: (data) => api.post('/transactions', data),
  getTransactions: (params) => api.get('/transactions', { params }),
  updateTransaction: (id, data) => api.put(`/transactions/${id}`, data),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
};

export const accountAPI = {
  createAccount: (data) => api.post('/accounts', data),
  getAccounts: () => api.get('/accounts'),
  updateAccount: (id, data) => api.put(`/accounts/${id}`, data),
  deleteAccount: (id) => api.delete(`/accounts/${id}`),
};

export const categoryAPI = {
  initDefaults: () => api.post('/categories/init-defaults'),
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

export const budgetAPI = {
  createBudget: (data) => api.post('/budgets', data),
  getBudgets: (params) => api.get('/budgets', { params: normalizeParams(params, 'month') }),
  updateBudget: (id, data) => api.put(`/budgets/${id}`, data),
  deleteBudget: (id) => api.delete(`/budgets/${id}`),
};

export const goalAPI = {
  createGoal: (data) => api.post('/goals', data),
  getGoals: (status) => api.get('/goals', { params: { status_filter: status } }),
  updateGoal: (id, data) => api.put(`/goals/${id}`, data),
  deleteGoal: (id) => api.delete(`/goals/${id}`),
  contributeToGoal: (id, amount) => api.post(`/goals/${id}/contribute`, { amount }),
};

export const analyticsAPI = {
  getDashboardSummary: (params) => api.get('/analytics/dashboard/summary', { params: normalizeParams(params, 'month') }),
  getCategoryTrends: (categoryId, params) => api.get(`/analytics/category/${categoryId}/trends`, { params: normalizeParams(params, 'months') }),
  getAnomalies: () => api.get('/analytics/anomalies'),
  getInsights: (params) => api.get('/analytics/insights', { params: normalizeParams(params, 'month') }),
  getBudgetStatus: (params) => api.get('/analytics/budget/status', { params: normalizeParams(params, 'month') }),
  forecastExpenses: (params) => api.get('/analytics/forecast', { params: normalizeParams(params, 'days_ahead') }),
  getExpenseForecast: (params) => api.get('/analytics/forecast', { params: normalizeParams(params, 'days_ahead') }),
  getNetWorth: () => api.get('/analytics/net-worth'),
};

export const billAPI = {
  uploadReceipt: (fileOrFormData) => {
    const formData = fileOrFormData instanceof FormData ? fileOrFormData : new FormData();
    if (!(fileOrFormData instanceof FormData)) {
      formData.append('file', fileOrFormData);
    }
    return api.post('/bills/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getReceipts: (status) => api.get('/bills', { params: { status } }),
  getBills: (status) => api.get('/bills', { params: { status } }),
  updateReceipt: (id, data) => api.put(`/bills/${id}`, data),
  updateBill: (id, data) => api.put(`/bills/${id}`, data),
  deleteReceipt: (id) => api.delete(`/bills/${id}`),
  deleteBill: (id) => api.delete(`/bills/${id}`),
};

export default api;
