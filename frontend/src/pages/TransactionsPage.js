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
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Transactions</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus /> Add Transaction
        </button>
      </div>

      {showForm && (
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

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Description</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Merchant</th>
              <th className="text-right p-4">Amount</th>
              <th className="text-center p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((trans) => (
              <tr key={trans.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{formatDate(trans.date)}</td>
                <td className="p-4">{trans.description}</td>
                <td className="p-4">{categories.find((c) => c.id === trans.category_id)?.name}</td>
                <td className="p-4">{trans.merchant}</td>
                <td className={`p-4 text-right font-bold ${trans.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {trans.transaction_type === 'income' ? '+' : '-'} {formatCurrency(trans.amount)}
                </td>
                <td className="p-4 text-center space-x-2">
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
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FiEdit2 />
                  </button>
                  <button onClick={() => handleDelete(trans.id)} className="text-red-600 hover:text-red-800">
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
