import React, { useEffect, useState } from 'react';
import { forecastingAPI } from '../services/advancedAPI';
import { showToast } from '../utils/helpers';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiTrendingUp, FiAlertCircle } from 'react-icons/fi';

export default function ExpenseForecastingPage() {
  const [forecast, setForecast] = useState([]);
  const [trends, setTrends] = useState({});
  const [anomalies, setAnomalies] = useState([]);
  const [savings, setSavings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('forecast');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [forecastRes, trendsRes, anomaliesRes, savingsRes] = await Promise.all([
        forecastingAPI.getMonthlyForecast(3),
        forecastingAPI.getCategoryTrends(6),
        forecastingAPI.getAnomalies(),
        forecastingAPI.getSavingsProjection(12),
      ]);
      
      setForecast(forecastRes.data?.forecast || []);
      setTrends(trendsRes.data || {});
      setAnomalies(anomaliesRes.data || []);
      setSavings(savingsRes.data || {});
    } catch (error) {
      showToast.error('Failed to load forecasting data');
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

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Expense Forecasting 📊</h1>
        <p className="text-gray-500">AI-powered predictions for your future expenses</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        {['forecast', 'trends', 'anomalies', 'savings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'forecast' && '📈 Forecast'}
            {tab === 'trends' && '📉 Trends'}
            {tab === 'anomalies' && '⚠️ Anomalies'}
            {tab === 'savings' && '💰 Savings'}
          </button>
        ))}
      </div>

      {/* Forecast Tab */}
      {activeTab === 'forecast' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {forecast.map((item) => (
              <div key={item.month} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
                <p className="text-sm text-gray-500">{item.month}</p>
                <p className="text-2xl font-bold">₹{item.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
          
          {forecast.length > 0 && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
              <h3 className="font-semibold mb-4">3-Month Expense Forecast</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                  <Bar dataKey="total" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {Object.entries(trends).map(([catId, data]) => (
            <div key={catId} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
              <h3 className="font-semibold mb-4">Category {catId}</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-xl font-bold">₹{data.total?.toFixed(2) || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Average</p>
                  <p className="text-xl font-bold">₹{data.average?.toFixed(2) || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Months</p>
                  <p className="text-xl font-bold">{Object.keys(data.months || {}).length}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Anomalies Tab */}
      {activeTab === 'anomalies' && (
        <div className="space-y-3">
          {anomalies.length > 0 ? (
            anomalies.map((anomaly) => (
              <div key={anomaly.id} className="p-4 rounded-lg bg-red-50 border-l-4 border-red-400">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <FiAlertCircle /> {anomaly.description}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Amount: ₹{anomaly.amount.toFixed(2)} ({anomaly.deviation}% above average)
                    </p>
                    <p className="text-xs text-gray-500">{new Date(anomaly.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">No spending anomalies detected ✓</p>
          )}
        </div>
      )}

      {/* Savings Tab */}
      {activeTab === 'savings' && savings?.monthly_savings !== undefined && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
              <p className="text-sm text-gray-500">Monthly Income</p>
              <p className="text-2xl font-bold">₹{savings.monthly_income?.toFixed(2) || 0}</p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
              <p className="text-sm text-gray-500">Monthly Expense</p>
              <p className="text-2xl font-bold">₹{savings.monthly_expense?.toFixed(2) || 0}</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50">
              <p className="text-sm text-green-600 font-semibold">Monthly Savings</p>
              <p className="text-2xl font-bold text-green-600">₹{savings.monthly_savings?.toFixed(2) || 0}</p>
            </div>
          </div>

          {savings.projection && savings.projection.length > 0 && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
              <h3 className="font-semibold mb-4">12-Month Savings Projection</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={savings.projection}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottomRight', offset: -5 }} />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="cumulative_savings" stroke="#10b981" name="Cumulative Savings" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
