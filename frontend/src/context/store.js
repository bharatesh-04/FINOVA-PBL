import create from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  setUser: (user, token) => set({ user, token }),
  clearAuth: () => set({ user: null, token: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export const useTransactionStore = create((set) => ({
  transactions: [],
  filters: {},
  setTransactions: (transactions) => set({ transactions }),
  setFilters: (filters) => set({ filters }),
}));

export const useDashboardStore = create((set) => ({
  summary: null,
  anomalies: [],
  insights: [],
  setSummary: (summary) => set({ summary }),
  setAnomalies: (anomalies) => set({ anomalies }),
  setInsights: (insights) => set({ insights }),
}));
