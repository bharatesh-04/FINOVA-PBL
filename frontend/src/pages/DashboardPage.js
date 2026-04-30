import React, { useEffect, useState } from 'react';
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsAPI, transactionAPI } from '../services/api';
import { showToast, formatCurrency, getCategoryColor } from '../utils/helpers';
import { FiTrendingUp, FiAlertCircle } from 'react-icons/fi';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [summaryRes, anomaliesRes, insightsRes] = await Promise.all([
        analyticsAPI.getDashboardSummary(),
        analyticsAPI.getAnomalies(),
        analyticsAPI.getInsights(),
      ]);

      setSummary(summaryRes.data);
      setAnomalies(anomaliesRes.data || []);
      setInsights(insightsRes.data || []);
    } catch (error) {
      showToast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const categoryData = summary ? Object.entries(summary.category_breakdown).map(([name, amount]) => ({
    name,
    value: amount,
    fill: getCategoryColor(name),
  })) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-gray-600 mb-2">Income</p>
          <p className="text-2xl font-bold text-green-600">
            {summary && formatCurrency(summary.income)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-2">Expense</p>
          <p className="text-2xl font-bold text-red-600">
            {summary && formatCurrency(summary.expense)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-2">Net</p>
          <p className="text-2xl font-bold text-blue-600">
            {summary && formatCurrency(summary.net)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-2">Savings Rate</p>
          <p className="text-2xl font-bold text-indigo-600">
            {summary && `${summary.savings_rate.toFixed(1)}%`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Breakdown */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Spending by Category</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} label={{ dataKey: 'name' }} outerRadius={80} fill="#8884d8" dataKey="value" />
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>

        {/* Insights */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiTrendingUp /> AI Insights
          </h2>
          <div className="space-y-3">
            {insights.length > 0 ? (
              insights.map((insight, idx) => (
                <p key={idx} className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  💡 {insight}
                </p>
              ))
            ) : (
              <p className="text-gray-500">No insights available</p>
            )}
          </div>
        </div>
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiAlertCircle className="text-yellow-500" /> Unusual Spending Detected
          </h2>
          <div className="space-y-2">
            {anomalies.slice(0, 5).map((anomaly) => (
              <div key={anomaly.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded border border-yellow-200">
                <div>
                  <p className="font-medium text-gray-800">{anomaly.description}</p>
                  <p className="text-sm text-gray-600">{anomaly.message}</p>
                </div>
                <p className="text-lg font-bold text-red-600">{formatCurrency(anomaly.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
