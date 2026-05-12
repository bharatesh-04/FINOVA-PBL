import axios from 'axios';

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const DEFAULT_API_URL = isLocalhost
  ? 'http://localhost:8000/api'
  : 'https://finova-qvey.onrender.com/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || DEFAULT_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
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
  getBudgets: (month) => api.get('/budgets', { params: { month } }),
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
  getDashboardSummary: (month) => api.get('/analytics/dashboard/summary', { params: { month } }),
  getCategoryTrends: (categoryId, months) => api.get(`/analytics/category/${categoryId}/trends`, { params: { months } }),
  getAnomalies: () => api.get('/analytics/anomalies'),
  getInsights: (month) => api.get('/analytics/insights', { params: { month } }),
  getBudgetStatus: (month) => api.get('/analytics/budget/status', { params: { month } }),
  forecastExpenses: (daysAhead) => api.get('/analytics/forecast', { params: { days_ahead: daysAhead } }),
  getNetWorth: () => api.get('/analytics/net-worth'),
};

export const billAPI = {
  uploadReceipt: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/bills/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getReceipts: (status) => api.get('/bills', { params: { status } }),
  updateReceipt: (id, data) => api.put(`/bills/${id}`, data),
  deleteReceipt: (id) => api.delete(`/bills/${id}`),
};

export default api;
