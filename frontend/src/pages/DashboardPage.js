import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { analyticsAPI, transactionAPI, categoryAPI, accountAPI } from '../services/api';
import { useAuthStore } from '../context/store';
import { showToast, formatCurrency, formatDate, getCategoryColor, extractErrorMessage } from '../utils/helpers';
import { FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import { FaWallet, FaChartLine, FaPiggyBank } from 'react-icons/fa';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [insights, setInsights] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [summaryRes, anomaliesRes, insightsRes, transactionsRes, categoriesRes, accountsRes] = await Promise.all([
        analyticsAPI.getDashboardSummary(),
        analyticsAPI.getAnomalies(),
        analyticsAPI.getInsights(),
        transactionAPI.getTransactions({ limit: 15 }),
        categoryAPI.getCategories(),
        accountAPI.getAccounts(),
      ]);

      const fetchedCategories = Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data?.categories || [];
      const fetchedAccounts = Array.isArray(accountsRes.data) ? accountsRes.data : accountsRes.data?.accounts || [];

      setSummary(summaryRes.data || {});
      setAnomalies(Array.isArray(anomaliesRes.data) ? anomaliesRes.data : anomaliesRes.data?.anomalies || []);
      setInsights(Array.isArray(insightsRes.data) ? insightsRes.data : insightsRes.data?.insights || []);
      setTransactions(Array.isArray(transactionsRes.data) ? transactionsRes.data : transactionsRes.data?.transactions || []);
      setCategories(fetchedCategories);
      setAccounts(fetchedAccounts);

      generateMonthlyData();
      generateDailyData();

      const savingsRate = Number(summaryRes.data?.savings_rate || 0);
      if (savingsRate >= 20) {
        showToast.success(`Great job! Your savings rate is ${savingsRate.toFixed(1)}% this month.`);
      } else if (savingsRate > 0) {
        showToast('You are saving ' + savingsRate.toFixed(1) + '% — try to trim one extra expense this week.', 'warning');
      }

      if (Array.isArray(anomaliesRes.data) ? anomaliesRes.data.length : anomaliesRes.data?.anomalies?.length) {
        showToast.error('Spending alerts are available. Review the unusual spending section below.');
      }

      if (fetchedCategories.length === 0) {
        await categoryAPI.initDefaults();
        const refreshed = await categoryAPI.getCategories();
        setCategories(Array.isArray(refreshed.data) ? refreshed.data : refreshed.data?.categories || []);
      }

      if (fetchedAccounts.length === 0) {
        await accountAPI.createAccount({ name: 'Main Wallet', account_type: 'cash', balance: 0, currency: 'INR' });
        const refreshed = await accountAPI.getAccounts();
        setAccounts(Array.isArray(refreshed.data) ? refreshed.data : refreshed.data?.accounts || []);
      }
    } catch (error) {
      showToast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map((month) => ({
      name: month,
      spending: Math.floor(Math.random() * 15000 + 5000),
    }));
    setMonthlyData(data);
  };

  const generateDailyData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const data = days.map((day) => ({
      name: day,
      income: Math.floor(Math.random() * 1000 + 400),
      expenses: Math.floor(Math.random() * 600 + 200),
    }));
    setDailyData(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg)' }}>
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const recentExpenses = transactions.filter((item) => item.transaction_type === 'expense').slice(0, 10);
  const totalBalance = (summary?.income || 0) - (summary?.expense || 0);

  // Get text color based on theme
  const getChartColor = (type) => {
    const styles = getComputedStyle(document.documentElement);
    const textColor = styles.getPropertyValue('--text').trim();
    const secondaryColor = styles.getPropertyValue('--text-secondary').trim();
    
    if (type === 'axis') return `#${secondaryColor.slice(1)}` || '#64748b';
    if (type === 'grid') return `#${styles.getPropertyValue('--border').trim().slice(1)}` || '#e2e8f0';
    return textColor;
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Welcome, {user?.username || 'User'}! 👋</h1>
        <p className="dashboard-subtitle">This is your finance overview</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        {/* Total Balance */}
        <div className="summary-card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="summary-card-label">Total Balance</p>
              <p className="summary-card-value">{summary && formatCurrency(totalBalance)}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--primary-light)' }}>
              <FaWallet style={{ color: 'var(--primary)', fontSize: '24px' }} />
            </div>
          </div>
          <p className="summary-card-trend">
            <FiTrendingUp size={16} />
            +5% from last month
          </p>
        </div>

        {/* Income */}
        <div className="summary-card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="summary-card-label">Income</p>
              <p className="summary-card-value">{summary && formatCurrency(summary.income)}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--success-light)' }}>
              <FaChartLine style={{ color: 'var(--success)', fontSize: '24px' }} />
            </div>
          </div>
          <p className="summary-card-trend" style={{ color: 'var(--success)' }}>
            <FiTrendingUp size={16} />
            +10% from last month
          </p>
        </div>

        {/* Expenses */}
        <div className="summary-card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="summary-card-label">Expenses</p>
              <p className="summary-card-value">{summary && formatCurrency(summary.expense)}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--danger-light)' }}>
              <FaTrendingUp style={{ color: 'var(--danger)', fontSize: '24px' }} />
            </div>
          </div>
          <p className="summary-card-trend" style={{ color: 'var(--danger)' }}>
            <FiTrendingUp size={16} />
            -4% from last month
          </p>
        </div>

        {/* Savings */}
        <div className="summary-card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="summary-card-label">Savings</p>
              <p className="summary-card-value">{summary && formatCurrency(Math.max(0, summary.income - summary.expense))}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--info-light)' }}>
              <FaPiggyBank style={{ color: 'var(--info)', fontSize: '24px' }} />
            </div>
          </div>
          <p className="summary-card-trend" style={{ color: 'var(--success)' }}>
            <FiTrendingUp size={16} />
            +4% from last month
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Spending */}
        <div className="chart-container">
          <h2 className="chart-title">Monthly Spending Overview</h2>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'var(--text)' }}
                />
                <Area type="monotone" dataKey="spending" stroke="var(--primary)" fillOpacity={1} fill="url(#colorSpending)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No data available</p>
          )}
        </div>

        {/* Income vs Expenses */}
        <div className="chart-container">
          <h2 className="chart-title">Income vs Expenses Overview</h2>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'var(--text)' }}
                />
                <Legend />
                <Bar dataKey="income" fill="var(--success)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" fill="var(--danger)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No data available</p>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="table-container">
        <div className="table-header">
          <h2 className="table-title">Transactions</h2>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Payment Method</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentExpenses.length > 0 ? (
                recentExpenses.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDate(transaction.date)}</td>
                    <td>
                      <span className="badge">
                        {transaction.category_name || 'Other'}
                      </span>
                    </td>
                    <td>{transaction.description || transaction.merchant || '-'}</td>
                    <td style={{ textTransform: 'uppercase', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {transaction.payment_method || 'UPI'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="amount-positive">{formatCurrency(transaction.amount)}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge-success">Completed</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="card mt-8">
          <div className="flex items-center gap-3 mb-6">
            <FiAlertCircle style={{ color: 'var(--warning)', fontSize: '20px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
              Unusual Spending Detected
            </h2>
          </div>
          <div className="space-y-3">
            {anomalies.slice(0, 5).map((anomaly) => (
              <div
                key={anomaly.id}
                className="alert alert-warning"
              >
                <div>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>{anomaly.description}</p>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{anomaly.message}</p>
                </div>
                <p style={{ color: 'var(--danger)', fontWeight: 600, marginTop: '8px' }}>
                  {formatCurrency(anomaly.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for trending icon
function FaTrendingUp(props) {
  return <FiTrendingUp {...props} />;
}
