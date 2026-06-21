import React, { useState, useEffect, useCallback } from 'react';
import { budgetAPI, categoryAPI } from '../services/api';
import { showToast, formatCurrency } from '../utils/helpers';
import { FiPlus, FiTrash2, FiEdit2, FiZap, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [smartPlan, setSmartPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplyingSmartBudget, setIsApplyingSmartBudget] = useState(false);
  const [currentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [generatorSettings, setGeneratorSettings] = useState({
    lookback_months: 3,
    savings_target_percent: 20,
    buffer_percent: 10,
    overwrite: true,
  });
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

  const loadSmartBudget = async () => {
    try {
      setIsGenerating(true);
      const response = await budgetAPI.getSmartRecommendations({
        month: currentMonth,
        ...generatorSettings,
      });
      setSmartPlan(response.data || null);
      if (!response.data?.recommendations?.length) {
        showToast.warning('Add a few expense transactions before generating smart budgets.');
      }
    } catch (error) {
      showToast.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplySmartBudget = async () => {
    if (!smartPlan?.recommendations?.length) {
      showToast.warning('Generate a smart budget first.');
      return;
    }

    try {
      setIsApplyingSmartBudget(true);
      const response = await budgetAPI.applySmartBudget({
        month: currentMonth,
        ...generatorSettings,
      });
      showToast.success(`${response.data?.applied_count || 0} smart budgets applied`);
      await loadData();
      await loadSmartBudget();
    } catch (error) {
      showToast.error(error);
    } finally {
      setIsApplyingSmartBudget(false);
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

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg)' }}>
      <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Monthly Budget</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{currentMonth}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadSmartBudget}
            disabled={isGenerating}
            className="btn-secondary flex items-center gap-2 disabled:opacity-60"
          >
            <FiZap /> {isGenerating ? 'Generating...' : 'Smart Generator'}
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); }}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus /> Add Budget
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>
              {editingId ? 'Edit Budget' : 'New Budget'}
            </h3>
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
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
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

      <div className="card mb-8">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiZap style={{ color: 'var(--warning)' }} /> Smart Budget Generator
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>Generate category limits from your recent spending and savings target.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadSmartBudget}
              disabled={isGenerating}
              className="btn-secondary inline-flex items-center gap-2 disabled:opacity-60"
            >
              <FiRefreshCw /> {isGenerating ? 'Generating...' : 'Generate'}
            </button>
            <button
              type="button"
              onClick={handleApplySmartBudget}
              disabled={isApplyingSmartBudget || !smartPlan?.recommendations?.length}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
            >
              <FiCheckCircle /> {isApplyingSmartBudget ? 'Applying...' : 'Apply Plan'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <label className="block">
            <span style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Lookback</span>
            <select
              value={generatorSettings.lookback_months}
              onChange={(e) => setGeneratorSettings({ ...generatorSettings, lookback_months: Number(e.target.value) })}
              className="input-field"
            >
              <option value={1}>1 month</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
          </label>
          <label className="block">
            <span style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Savings target</span>
            <input
              type="number"
              min="0"
              max="90"
              value={generatorSettings.savings_target_percent}
              onChange={(e) => setGeneratorSettings({ ...generatorSettings, savings_target_percent: Number(e.target.value) })}
              className="input-field"
            />
          </label>
          <label className="block">
            <span style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Buffer</span>
            <input
              type="number"
              min="0"
              max="50"
              value={generatorSettings.buffer_percent}
              onChange={(e) => setGeneratorSettings({ ...generatorSettings, buffer_percent: Number(e.target.value) })}
              className="input-field"
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '8px', border: `1px solid var(--border)`, padding: '12px 16px' }}>
            <input
              type="checkbox"
              checked={generatorSettings.overwrite}
              onChange={(e) => setGeneratorSettings({ ...generatorSettings, overwrite: e.target.checked })}
            />
            <span style={{ fontSize: '14px', color: 'var(--text)' }}>Update existing budgets</span>
          </label>
        </div>

        {smartPlan ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div style={{ borderRadius: '8px', border: `1px solid var(--border)`, padding: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Monthly income</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>{formatCurrency(smartPlan.monthly_income || 0)}</p>
              </div>
              <div style={{ borderRadius: '8px', border: `1px solid var(--border)`, padding: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Spending cap</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>
                  {smartPlan.spending_cap ? formatCurrency(smartPlan.spending_cap) : 'No income data'}
                </p>
              </div>
              <div style={{ borderRadius: '8px', border: `1px solid var(--border)`, padding: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Recommended total</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>{formatCurrency(smartPlan.total_recommended || 0)}</p>
              </div>
              <div style={{ borderRadius: '8px', border: `1px solid var(--border)`, padding: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Confidence</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success)', marginTop: '4px' }}>{Math.round((smartPlan.confidence || 0) * 100)}%</p>
              </div>
            </div>

            {smartPlan.recommendations?.length > 0 ? (
              <div className="space-y-3">
                {smartPlan.recommendations.map((item) => (
                  <div key={item.category_id} style={{ borderRadius: '8px', border: `1px solid var(--border)`, padding: '16px' }}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.category_color || 'var(--primary)' }}
                        />
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--text)' }}>{item.category_name}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.reason}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm md:text-right">
                        <div>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Average</p>
                          <p style={{ fontWeight: 600, color: 'var(--text)' }}>{formatCurrency(item.average_monthly)}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Suggested</p>
                          <p style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(item.recommended_limit)}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Current</p>
                          <p style={{ fontWeight: 600, color: 'var(--text)' }}>
                            {item.existing_limit ? formatCurrency(item.existing_limit) : 'None'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ borderRadius: '8px', border: `1px dashed var(--border)`, padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No recommendations yet. Add expense transactions, then generate again.
              </div>
            )}
          </div>
        ) : (
          <div style={{ borderRadius: '8px', border: `1px dashed var(--border)`, padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Generate a smart plan to preview recommended limits for {currentMonth}.
          </div>
        )}
      </div>

      <div className="space-y-4">
        {budgets.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 16px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>No budgets for this month</p>
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
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>{budget.category?.name}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{budget.month}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(budget)}
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
                      onClick={() => handleDelete(budget.id)}
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

                <div className="mb-4">
                  <div
                    style={{
                      width: '100%',
                      borderRadius: '9999px',
                      height: '12px',
                      background: isOverBudget ? 'var(--danger-light)' : isNearLimit ? 'var(--warning-light)' : 'var(--bg)',
                    }}
                  >
                    <div
                      style={{
                        height: '12px',
                        borderRadius: '9999px',
                        transition: 'all 200ms ease',
                        width: `${Math.min(spendPercentage, 100)}%`,
                        background: isOverBudget ? 'var(--danger)' : isNearLimit ? 'var(--warning)' : 'var(--success)',
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Spent</p>
                    <p style={{ fontWeight: 600, color: 'var(--text)' }}>{formatCurrency(budget.spent_amount)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Limit</p>
                    <p style={{ fontWeight: 600, color: 'var(--text)' }}>{formatCurrency(budget.limit_amount)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status</p>
                    <p
                      style={{
                        fontWeight: 600,
                        color: isOverBudget ? 'var(--danger)' : isNearLimit ? 'var(--warning)' : 'var(--success)',
                      }}
                    >
                      {isOverBudget 
                        ? `Over by ${formatCurrency(budget.spent_amount - budget.limit_amount)}`
                        : `${formatCurrency(budget.limit_amount - budget.spent_amount)} left`
                      }
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
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
