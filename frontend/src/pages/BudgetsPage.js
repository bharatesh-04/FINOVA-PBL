import React, { useState, useEffect, useCallback } from 'react';
import { budgetAPI, categoryAPI } from '../services/api';
import { showToast, formatCurrency } from '../utils/helpers';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [formData, setFormData] = useState({
    category_id: '',
    limit_amount: '',
    alert_threshold: 0.8,
    month: currentMonth,
  });

  const loadData = useCallback(async () => {
    try {
      const [budRes, catRes] = await Promise.all([
        budgetAPI.getBudgets({ month: currentMonth }),
        categoryAPI.getCategories(),
      ]);
      setBudgets(Array.isArray(budRes.data) ? budRes.data : budRes.data?.budgets || []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.categories || []);
    } catch (error) {
      showToast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        limit_amount: parseFloat(formData.limit_amount),
        alert_threshold: parseFloat(formData.alert_threshold),
      };

      if (editingId) {
        await budgetAPI.updateBudget(editingId, data);
        showToast.success('Budget updated');
        setEditingId(null);
      } else {
        await budgetAPI.createBudget(data);
        showToast.success('Budget created');
      }
      setShowForm(false);
      setFormData({
        category_id: '',
        limit_amount: '',
        alert_threshold: 0.8,
        month: currentMonth,
      });
      loadData();
    } catch (error) {
      showToast.error(error);
    }
  };

  const handleEdit = (budget) => {
    setFormData(budget);
    setEditingId(budget.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this budget?')) {
      try {
        await budgetAPI.deleteBudget(id);
        showToast.success('Budget deleted');
        loadData();
      } catch (error) {
        showToast.error('Failed to delete');
      }
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Monthly Budget</h1>
          <p className="text-gray-600">{currentMonth}</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus /> Add Budget
        </button>
      </div>

      {showForm && (
        <div className="card mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Budget' : 'New Budget'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="Budget Limit"
                value={formData.limit_amount}
                onChange={(e) => setFormData({ ...formData, limit_amount: e.target.value })}
                required
                className="input-field"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Threshold: {(formData.alert_threshold * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.05"
                  value={formData.alert_threshold}
                  onChange={(e) => setFormData({ ...formData, alert_threshold: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
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

      <div className="space-y-4">
        {budgets.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 text-lg">No budgets for this month</p>
          </div>
        ) : (
          budgets.map((budget) => {
            const spendPercentage = (budget.spent_amount / budget.limit_amount) * 100;
            const isOverBudget = budget.spent_amount > budget.limit_amount;
            const isNearLimit = spendPercentage >= budget.alert_threshold * 100;
            
            return (
              <div key={budget.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{budget.category?.name}</h3>
                    <p className="text-sm text-gray-600">{budget.month}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(budget)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className={`w-full rounded-full h-3 ${
                    isOverBudget ? 'bg-red-200' : isNearLimit ? 'bg-yellow-200' : 'bg-gray-200'
                  }`}>
                    <div
                      className={`h-3 rounded-full transition-all ${
                        isOverBudget ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(spendPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Spent</p>
                    <p className="font-semibold text-gray-800">{formatCurrency(budget.spent_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Limit</p>
                    <p className="font-semibold text-gray-800">{formatCurrency(budget.limit_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Status</p>
                    <p className={`font-semibold ${
                      isOverBudget ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {isOverBudget 
                        ? `Over by ${formatCurrency(budget.spent_amount - budget.limit_amount)}`
                        : `${formatCurrency(budget.limit_amount - budget.spent_amount)} left`
                      }
                    </p>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-600">
                  {spendPercentage.toFixed(1)}% of budget used
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
