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
    currency: 'USD',
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await accountAPI.getAccounts();
      setAccounts(res.data);
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
      setFormData({ name: '', account_type: 'bank', balance: '', currency: 'USD' });
      loadAccounts();
    } catch (error) {
      showToast.error(error.response?.data?.detail || 'Operation failed');
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

  if (isLoading) return <div className="p-6">Loading...</div>;

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Accounts</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus /> Add Account
        </button>
      </div>

      <div className="card mb-8 bg-blue-50 border-l-4 border-blue-500">
        <h2 className="text-xl font-semibold text-gray-800">Total Balance</h2>
        <p className="text-3xl font-bold text-blue-600 mt-2">{formatCurrency(totalBalance)}</p>
      </div>

      {showForm && (
        <div className="card mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Account' : 'New Account'}</h3>
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
                <option value="USD">USD</option>
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
                <h3 className="text-lg font-semibold text-gray-800">{account.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{account.account_type}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(account)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <FiEdit2 />
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600">Balance</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(account.balance)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
