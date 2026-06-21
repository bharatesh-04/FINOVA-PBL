import React, { useState, useEffect } from 'react';
import { transactionAPI, categoryAPI, accountAPI } from '../services/api';
import { showToast, formatCurrency, formatDate } from '../utils/helpers';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    account_id: '',
    category_id: '',
    amount: '',
    transaction_type: 'expense',
    merchant: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transRes, catRes, accRes] = await Promise.all([
        transactionAPI.getTransactions({}),
        categoryAPI.getCategories(),
        accountAPI.getAccounts(),
      ]);

      // Handle both array and object responses
      setTransactions(Array.isArray(transRes.data) ? transRes.data : transRes.data?.transactions || []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.categories || []);
      setAccounts(Array.isArray(accRes.data) ? accRes.data : accRes.data?.accounts || []);
    } catch (error) {
      showToast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await transactionAPI.updateTransaction(editingId, formData);
        showToast.success('Transaction updated');
        setEditingId(null);
      } else {
        await transactionAPI.createTransaction(formData);
        showToast.success('Transaction created');
      }
      setShowForm(false);
      setFormData({
        account_id: '',
        category_id: '',
        amount: '',
        transaction_type: 'expense',
        merchant: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      loadData();
    } catch (error) {
      showToast.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this transaction?')) {
      try {
        await transactionAPI.deleteTransaction(id);
        showToast.success('Transaction deleted');
        loadData();
      } catch (error) {
        showToast.error('Failed to delete');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg)' }}>
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Transactions</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus /> Add Transaction
        </button>
      </div>

      <div className="card mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={formData.transaction_type}
                onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                className="input-field"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>

              <select
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                required
                className="input-field"
              >
                <option value="">Select Account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>

              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
                className="input-field"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="input-field"
              />

              <input
                type="text"
                placeholder="Merchant"
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                className="input-field"
              />

              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-field"
              />

              <input
                type="text"
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Merchant</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((trans) => (
                  <tr key={trans.id}>
                    <td>{formatDate(trans.date)}</td>
                    <td>{trans.description}</td>
                    <td>
                      <span className="badge">
                        {categories.find((c) => c.id === trans.category_id)?.name || 'Other'}
                      </span>
                    </td>
                    <td>{trans.merchant || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      <span
                        style={{
                          color: trans.transaction_type === 'income' ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {trans.transaction_type === 'income' ? '+' : '-'} {formatCurrency(trans.amount)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => {
                          setEditingId(trans.id);
                          setFormData({
                            account_id: trans.account_id,
                            category_id: trans.category_id,
                            amount: trans.amount,
                            transaction_type: trans.transaction_type,
                            merchant: trans.merchant,
                            description: trans.description,
                            date: trans.date.split('T')[0],
                          });
                          setShowForm(true);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--primary)',
                          padding: '4px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderRadius: '4px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-light)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(trans.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--danger)',
                          padding: '4px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderRadius: '4px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--danger-light)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        <FiTrash2 size={16} />
                      </button>
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
    </div>
  );
}
