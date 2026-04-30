import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { showToast, formatCurrency } from '../utils/helpers';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [insights, setInsights] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [netWorth, setNetWorth] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const [summaryRes, anomaliesRes, insightsRes, budgetRes, forecastRes, netWorthRes] = await Promise.all([
        analyticsAPI.getDashboardSummary({ month: currentMonth }),
        analyticsAPI.getAnomalies(),
        analyticsAPI.getInsights({ month: currentMonth }),
        analyticsAPI.getBudgetStatus({ month: currentMonth }),
        analyticsAPI.getExpenseForecast({ days_ahead: 30 }),
        analyticsAPI.getNetWorth(),
      ]);

      setSummary(summaryRes.data);
      setAnomalies(anomaliesRes.data);
      setInsights(insightsRes.data);
      setBudgetStatus(budgetRes.data);
      setForecast(forecastRes.data);
      setNetWorth(netWorthRes.data);
    } catch (error) {
      showToast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading analytics...</div>;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Financial Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card bg-green-50 border-l-4 border-green-500">
          <h3 className="text-gray-600 text-sm font-semibold">Income</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary?.income || 0)}</p>
        </div>
        <div className="card bg-red-50 border-l-4 border-red-500">
          <h3 className="text-gray-600 text-sm font-semibold">Expense</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(summary?.expense || 0)}</p>
        </div>
        <div className="card bg-blue-50 border-l-4 border-blue-500">
          <h3 className="text-gray-600 text-sm font-semibold">Net</h3>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary?.net || 0)}</p>
        </div>
        <div className="card bg-purple-50 border-l-4 border-purple-500">
          <h3 className="text-gray-600 text-sm font-semibold">Savings Rate</h3>
          <p className="text-2xl font-bold text-purple-600">{summary?.savings_rate?.toFixed(1)}%</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Category Breakdown */}
        {summary?.category_breakdown && Object.keys(summary.category_breakdown).length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(summary.category_breakdown).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(summary.category_breakdown).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Net Worth */}
        {netWorth && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Net Worth</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <p className="text-gray-600 text-sm">Total Assets</p>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(netWorth.net_worth)}</p>
              </div>
              <div className="space-y-2">
                {netWorth.accounts?.map((acc) => (
                  <div key={acc.id} className="flex justify-between items-center p-2 border-b">
                    <span className="text-gray-700">{acc.name}</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(acc.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Budget Status */}
      {budgetStatus.length > 0 && (
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Budget Status</h3>
          <div className="space-y-3">
            {budgetStatus.map((budget, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">{budget.category}</span>
                  <span className="text-sm text-gray-600">{budget.percentage.toFixed(1)}%</span>
                </div>
                <div className={`w-full rounded-full h-2 ${
                  budget.status === 'danger' ? 'bg-red-200' : budget.status === 'warning' ? 'bg-yellow-200' : 'bg-green-200'
                }`}>
                  <div
                    className={`h-2 rounded-full ${
                      budget.status === 'danger' ? 'bg-red-500' : budget.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forecast */}
      {forecast && (
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Expense Forecast (30 Days)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <p className="text-gray-600 text-sm">Forecasted Total</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(forecast.forecast)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <p className="text-gray-600 text-sm">Daily Average</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(forecast.daily_average)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Unusual Spending Detected</h3>
          <div className="space-y-3">
            {anomalies.slice(0, 5).map((anomaly, idx) => (
              <div key={idx} className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{anomaly.description}</p>
                    <p className="text-sm text-gray-600">{anomaly.category} - {formatCurrency(anomaly.amount)}</p>
                    <p className="text-xs text-gray-600 mt-1">{anomaly.message}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-600">{(anomaly.anomaly_score * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 AI Insights</h3>
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                <p className="text-gray-800">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
