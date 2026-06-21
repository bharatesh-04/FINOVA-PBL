import React, { useState, useEffect } from 'react';
import { accountAPI } from '../services/api';
import { showToast, formatCurrency } from '../utils/helpers';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    account_type: 'bank',
    balance: '',
    currency: 'INR',
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await accountAPI.getAccounts();
      // Handle both array and object responses
      setAccounts(Array.isArray(res.data) ? res.data : res.data?.accounts || []);
    } catch (error) {
      showToast.error('Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await accountAPI.updateAccount(editingId, formData);
        showToast.success('Account updated');
        setEditingId(null);
      } else {
        await accountAPI.createAccount(formData);
        showToast.success('Account created');
      }
      setShowForm(false);
      setFormData({ name: '', account_type: 'bank', balance: '', currency: 'INR' });
      loadAccounts();
    } catch (error) {
      showToast.error(error);
    }
  };

  const handleEdit = (account) => {
    setFormData(account);
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this account?')) {
      try {
        await accountAPI.deleteAccount(id);
        showToast.success('Account deleted');
        loadAccounts();
      } catch (error) {
        showToast.error('Failed to delete');
      }
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg)' }}>
      <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Accounts</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus /> Add Account
        </button>
      </div>

      <div className="card mb-8" style={{ borderLeft: `4px solid var(--primary)`, background: 'var(--primary-bg)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>Total Balance</h2>
        <p style={{ fontSize: '32px', fontWeight: 700, color: 'var(--primary)', marginTop: '8px' }}>{formatCurrency(totalBalance)}</p>
      </div>

      {showForm && (
        <div className="card mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>
              {editingId ? 'Edit Account' : 'New Account'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Account Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="input-field"
              />
              <select
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                className="input-field"
              >
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="upi">UPI</option>
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Balance"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                required
                className="input-field"
              />
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="input-field"
              >
                <option value="INR">INR</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div key={account.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>{account.name}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{account.account_type}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(account)}
                  style={{
                    padding: '8px',
                    color: 'var(--primary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-light)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <FiEdit2 />
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  style={{
                    padding: '8px',
                    color: 'var(--danger)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--danger-light)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
            <div style={{ borderTop: `1px solid var(--border)`, paddingTop: '16px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Balance</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)', marginTop: '4px' }}>{formatCurrency(account.balance)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
