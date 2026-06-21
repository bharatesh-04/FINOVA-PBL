import React, { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '../services/api';
import { showToast, formatCurrency } from '../utils/helpers';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [insights, setInsights] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
  const [forecastDays, setForecastDays] = useState(30);

  const loadAnalytics = useCallback(async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const [summaryRes, anomaliesRes, insightsRes, budgetRes, forecastRes, netWorthRes] = await Promise.all([
        analyticsAPI.getDashboardSummary({ month: currentMonth }),
        analyticsAPI.getAnomalies(),
        analyticsAPI.getInsights({ month: currentMonth }),
        analyticsAPI.getBudgetStatus({ month: currentMonth }),
        analyticsAPI.getExpenseForecast({ days_ahead: forecastDays }),
        analyticsAPI.getNetWorth(),
      ]);

      setSummary(summaryRes.data || {});
      setAnomalies(Array.isArray(anomaliesRes.data) ? anomaliesRes.data : anomaliesRes.data?.anomalies || []);
      setInsights(Array.isArray(insightsRes.data) ? insightsRes.data : insightsRes.data?.insights || []);
      setBudgetStatus(Array.isArray(budgetRes.data) ? budgetRes.data : budgetRes.data?.budget_status || []);
      setForecast(forecastRes.data || {});
      setNetWorth(netWorthRes.data || {});
    } catch (error) {
      showToast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [forecastDays]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg)' }}>
      <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  return (
    <div className="w-full">
      <h1 style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text)', marginBottom: '32px' }}>Financial Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card" style={{ borderLeft: `4px solid var(--success)`, background: 'var(--success-bg)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Income</h3>
          <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)', marginTop: '8px' }}>{formatCurrency(summary?.income || 0)}</p>
        </div>
        <div className="card" style={{ borderLeft: `4px solid var(--danger)`, background: 'var(--danger-bg)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Expense</h3>
          <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--danger)', marginTop: '8px' }}>{formatCurrency(summary?.expense || 0)}</p>
        </div>
        <div className="card" style={{ borderLeft: `4px solid var(--primary)`, background: 'var(--primary-bg)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Net</h3>
          <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)', marginTop: '8px' }}>{formatCurrency(summary?.net || 0)}</p>
        </div>
        <div className="card" style={{ borderLeft: `4px solid var(--primary)`, background: 'var(--primary-bg)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Savings Rate</h3>
          <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)', marginTop: '8px' }}>{summary?.savings_rate?.toFixed(1)}%</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Category Breakdown */}
        {summary?.category_breakdown && Object.keys(summary.category_breakdown).length > 0 && (
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>Spending by Category</h3>
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
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>Net Worth</h3>
            <div className="space-y-4">
              <div style={{ padding: '16px', background: 'linear-gradient(135deg, var(--primary-bg), var(--bg))', borderRadius: '8px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Total Assets</p>
                <p style={{ fontSize: '32px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>{formatCurrency(netWorth.net_worth)}</p>
              </div>
              <div className="space-y-2">
                {netWorth.accounts?.map((acc) => (
                  <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: `1px solid var(--border)` }}>
                    <span style={{ color: 'var(--text)' }}>{acc.name}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{formatCurrency(acc.balance)}</span>
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
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>Budget Status</h3>
          <div className="space-y-3">
            {budgetStatus.map((budget, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text)' }}>{budget.category}</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{budget.percentage.toFixed(1)}%</span>
                </div>
                <div
                  style={{
                    width: '100%',
                    borderRadius: '9999px',
                    height: '8px',
                    background: budget.status === 'danger' ? 'var(--danger-light)' : budget.status === 'warning' ? 'var(--warning-light)' : 'var(--success-light)',
                  }}
                >
                  <div
                    style={{
                      height: '8px',
                      borderRadius: '9999px',
                      background: budget.status === 'danger' ? 'var(--danger)' : budget.status === 'warning' ? 'var(--warning)' : 'var(--success)',
                      width: `${Math.min(budget.percentage, 100)}%`,
                    }}
                  />
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
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
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>Expense Prediction</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>{forecast.message || 'Projected from recent spending patterns.'}</p>
            </div>
            <div style={{ display: 'flex', borderRadius: '8px', border: `1px solid var(--border)`, padding: '4px' }}>
              {[30, 60, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setForecastDays(days)}
                  style={{
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    background: forecastDays === days ? 'var(--primary)' : 'transparent',
                    color: forecastDays === days ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    transition: 'all 200ms',
                  }}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div style={{ padding: '16px', background: 'var(--primary-bg)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Forecasted Total</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>{formatCurrency(forecast.forecast)}</p>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Daily Average</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>{formatCurrency(forecast.daily_average)}</p>
            </div>
            <div style={{ padding: '16px', background: 'var(--primary-bg)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Weekly Pace</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>{formatCurrency(forecast.weekly_projection || 0)}</p>
            </div>
            <div style={{ padding: '16px', background: 'var(--success-bg)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Confidence</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)', marginTop: '4px' }}>{Math.round((forecast.confidence || 0) * 100)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div style={{ borderRadius: '8px', border: `1px solid var(--border)`, padding: '16px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Trend</p>
              <p style={{ marginTop: '4px', fontSize: '20px', fontWeight: 700, color: 'var(--text)', textTransform: 'capitalize' }}>{forecast.trend || 'stable'}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {Number(forecast.trend_percent || 0).toFixed(1)}% vs previous 30 days
              </p>
            </div>
            <div style={{ borderRadius: '8px', border: `1px solid var(--border)`, padding: '16px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Data Used</p>
              <p style={{ marginTop: '4px', fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>{forecast.transactions_analyzed || 0} transactions</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{forecast.history_days || 0} days of history</p>
            </div>
            <div style={{ borderRadius: '8px', border: `1px solid var(--border)`, padding: '16px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Highest Projection</p>
              <p style={{ marginTop: '4px', fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>{forecast.top_risk_category?.category || 'None yet'}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {forecast.top_risk_category ? formatCurrency(forecast.top_risk_category.projected_amount) : 'Add expenses to build this.'}
              </p>
            </div>
          </div>

          {forecast.projected_by_category?.length > 0 && (
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontWeight: 600, color: 'var(--text)' }}>Projected by Category</h4>
              {forecast.projected_by_category.map((item) => (
                <div key={item.category} style={{ borderRadius: '8px', border: `1px solid var(--border)`, padding: '12px' }}>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>{item.category}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(item.projected_amount)}</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '9999px', background: 'var(--bg)' }}>
                    <div
                      style={{
                        height: '8px',
                        borderRadius: '9999px',
                        background: 'var(--primary)',
                        width: `${Math.min(item.share_percent || 0, 100)}%`,
                      }}
                    />
                  </div>
                  <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>{item.share_percent}% of recent expenses</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="card mb-8">
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>Unusual Spending Detected</h3>
          <div className="space-y-3">
            {anomalies.slice(0, 5).map((anomaly, idx) => (
              <div key={idx} style={{ padding: '12px', background: 'var(--danger-bg)', borderLeft: `4px solid var(--danger)`, borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text)' }}>{anomaly.description}</p>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{anomaly.category} - {formatCurrency(anomaly.amount)}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{anomaly.message}</p>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--danger)' }}>{(anomaly.anomaly_score * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>💡 AI Insights</h3>
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <div key={idx} style={{ padding: '12px', background: 'var(--primary-bg)', borderRadius: '6px', borderLeft: `4px solid var(--primary)` }}>
                <p style={{ color: 'var(--text)' }}>{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
