import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsAPI, transactionAPI, categoryAPI, accountAPI } from '../services/api';
import { showToast, formatCurrency, formatDate, getCategoryColor, extractErrorMessage } from '../utils/helpers';
import { FiTrendingUp, FiAlertCircle, FiPlus, FiTrash2, FiCamera, FiUpload } from 'react-icons/fi';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [insights, setInsights] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    account_id: '',
    category_id: '',
    amount: '',
    merchant: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

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
        transactionAPI.getTransactions({ limit: 8 }),
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const categoryData = summary ? Object.entries(summary.category_breakdown || {}).map(([name, amount]) => ({
    name,
    value: amount,
    fill: getCategoryColor(name),
  })) : [];

  const recentExpenses = transactions.filter((item) => item.transaction_type === 'expense').slice(0, 6);

  const handleAddExpense = async (e) => {
    e.preventDefault();

    if (!expenseForm.account_id || !expenseForm.category_id || !expenseForm.amount) {
      showToast.error('Please select an account, category, and amount.');
      return;
    }

    try {
      setIsSavingExpense(true);
      await transactionAPI.createTransaction({
        ...expenseForm,
        amount: Number(expenseForm.amount),
        transaction_type: 'expense',
      });
      showToast.success('Expense added successfully');
      setExpenseForm({
        account_id: '',
        category_id: '',
        amount: '',
        merchant: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      await loadDashboardData();
    } catch (error) {
      showToast.error(extractErrorMessage(error));
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await transactionAPI.deleteTransaction(id);
      showToast.success('Expense deleted');
      await loadDashboardData();
    } catch (error) {
      showToast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
      <p className="text-gray-600 mb-8">Manage expenses, review visual reports, unlock AI insights, and scan bills from one place.</p>

      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm">
        <p className="text-sm font-semibold">Useful tip</p>
        <p className="text-sm">Your dashboard now highlights savings progress and unusual spending alerts so you can act faster.</p>
      </div>

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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Add Expense */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><FiPlus className="text-green-500" /> Add Expense</h2>
          <form onSubmit={handleAddExpense} className="space-y-3">
            <select value={expenseForm.account_id} onChange={(e) => setExpenseForm({ ...expenseForm, account_id: e.target.value })} className="input-field" required>
              <option value="">Select account</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
            <select value={expenseForm.category_id} onChange={(e) => setExpenseForm({ ...expenseForm, category_id: e.target.value })} className="input-field" required>
              <option value="">Select category</option>
              {categories.filter((cat) => cat.category_type === 'expense').map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <input type="number" step="0.01" placeholder="Amount" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="input-field" required />
            <input type="text" placeholder="Merchant" value={expenseForm.merchant} onChange={(e) => setExpenseForm({ ...expenseForm, merchant: e.target.value })} className="input-field" />
            <input type="text" placeholder="Description" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} className="input-field" />
            <input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} className="input-field" />
            <button type="submit" disabled={isSavingExpense} className="btn-primary w-full disabled:opacity-60">{isSavingExpense ? 'Saving...' : 'Save Expense'}</button>
          </form>
        </div>

        {/* Visual Reports */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Visual Reports</h2>
          <p className="text-sm text-gray-500 mb-4">Live category distribution and spending overview.</p>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} label={({ name }) => name} outerRadius={75} fill="#8884d8" dataKey="value" />
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">No report data available</p>
          )}
        </div>

        {/* Bill Scan & Upload */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><FiCamera className="text-purple-500" /> Bill Scan & Upload</h2>
          <p className="text-sm text-gray-600 mb-4">Scan receipts, upload bills, and verify extracted details in one step.</p>
          <Link to="/bills" className="btn-primary inline-flex items-center gap-2 mb-3"><FiUpload /> Open Bill Scanner</Link>
          <p className="text-xs text-gray-500">Use the bill page for camera capture, file upload, and OCR verification.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Delete Expense */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><FiTrash2 className="text-red-500" /> Delete Expense</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentExpenses.length > 0 ? recentExpenses.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded border border-red-100 bg-red-50 p-3">
                <div>
                  <p className="font-semibold text-gray-800">{item.merchant || 'Expense'}</p>
                  <p className="text-xs text-gray-500">{formatDate(item.date)} • {item.description || 'No description'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{formatCurrency(item.amount)}</p>
                  <button onClick={() => handleDeleteExpense(item.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                </div>
              </div>
            )) : <p className="text-gray-500">No recent expense entries to delete.</p>}
          </div>
        </div>

        {/* AI Insights */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><FiTrendingUp /> AI Insights</h2>
          <div className="space-y-3">
            {insights.length > 0 ? (
              insights.map((insight, idx) => (
                <p key={idx} className="text-sm text-gray-600 bg-blue-50 p-3 rounded">💡 {insight}</p>
              ))
            ) : (
              <p className="text-gray-500">No insights available</p>
            )}
          </div>
        </div>
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><FiAlertCircle className="text-yellow-500" /> Unusual Spending Detected</h2>
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
