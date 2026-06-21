import axios from 'axios';

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const DEFAULT_API_URL = isLocalhost
  ? 'http://localhost:8000/api'
  : 'https://your-backend-url.onrender.com/api';

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

export const subscriptionAPI = {
  // Create subscription
  createSubscription: (data) => api.post('/subscriptions', data),
  
  // Get all subscriptions
  getSubscriptions: (status) => api.get('/subscriptions', { params: { status } }),
  
  // Get subscription by ID
  getSubscription: (id) => api.get(`/subscriptions/${id}`),
  
  // Update subscription
  updateSubscription: (id, data) => api.put(`/subscriptions/${id}`, data),
  
  // Cancel subscription
  cancelSubscription: (id) => api.delete(`/subscriptions/${id}/cancel`),
  
  // Delete subscription
  deleteSubscription: (id) => api.delete(`/subscriptions/${id}/delete`),
  
  // Get stats
  getStats: () => api.get('/subscriptions/stats'),
  
  // Get upcoming renewals
  getUpcomingRenewals: (days) => api.get('/subscriptions/upcoming', { params: { days } }),
};

export const forecastingAPI = {
  // Get monthly forecast
  getMonthlyForecast: (months) => api.get('/forecasting/monthly-forecast', { params: { months } }),
  
  // Get category trends
  getCategoryTrends: (months) => api.get('/forecasting/category-trends', { params: { months } }),
  
  // Get anomalies
  getAnomalies: (threshold) => api.get('/forecasting/anomalies', { params: { threshold } }),
  
  // Get savings projection
  getSavingsProjection: (months) => api.get('/forecasting/savings-projection', { params: { months } }),
};
