import React, { useState, useEffect } from 'react';
import { goalAPI } from '../services/api';
import { showToast, formatCurrency, formatDate } from '../utils/helpers';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [contributeId, setContributeId] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_amount: '',
    category: '',
    priority: 'medium',
    deadline: '',
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const res = await goalAPI.getGoals();
      setGoals(Array.isArray(res.data) ? res.data : res.data?.goals || []);
    } catch (error) {
      showToast.error('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await goalAPI.updateGoal(editingId, formData);
        showToast.success('Goal updated');
        setEditingId(null);
      } else {
        await goalAPI.createGoal(formData);
        showToast.success('Goal created');
      }
      setShowForm(false);
      setFormData({ name: '', description: '', target_amount: '', category: '', priority: 'medium', deadline: '' });
      loadGoals();
    } catch (error) {
      showToast.error(error);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    const amount = parseFloat(contributeAmount);
    if (!amount || amount <= 0) {
      showToast.error('Enter a valid contribution amount.');
      return;
    }

    try {
      await goalAPI.contributeToGoal(contributeId, { amount });
      const goal = goals.find((item) => item.id === contributeId);
      const nextProgress = ((goal.current_amount + amount) / goal.target_amount) * 100;

      if (nextProgress >= 100) {
        showToast.success(`Amazing! You hit your ${goal.name} goal.`);
      } else if (nextProgress >= 80) {
        showToast.success(`You are ${nextProgress.toFixed(1)}% toward ${goal.name}. Keep going!`);
      } else {
        showToast.success(`Added ${formatCurrency(amount)} to ${goal.name}.`);
      }

      setContributeId(null);
      setContributeAmount('');
      loadGoals();
    } catch (error) {
      showToast.error('Failed to contribute');
    }
  };

  const handleEdit = (goal) => {
    setFormData(goal);
    setEditingId(goal.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this goal?')) {
      try {
        await goalAPI.deleteGoal(id);
        showToast.success('Goal deleted');
        loadGoals();
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
      <div className="flex justify-between items-center mb-8">
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Financial Goals</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus /> Add Goal
        </button>
      </div>

      <div style={{ marginBottom: '24px', borderRadius: '12px', border: `1px solid var(--info-light)`, background: 'var(--info-bg)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--info)', margin: 0 }}>Goal reminder</p>
        <p style={{ fontSize: '14px', color: 'var(--info)', marginTop: '4px', margin: 0 }}>Add contributions to keep your progress visible and celebrate milestones as soon as you reach them.</p>
      </div>

      {showForm && (
        <div className="card mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>
              {editingId ? 'Edit Goal' : 'New Goal'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Goal Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="input-field"
              />
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Target Amount"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                required
                className="input-field"
              />
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input-field"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="input-field"
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field md:col-span-2"
                rows="2"
              />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const progress = (goal.current_amount / goal.target_amount) * 100;
          return (
            <div key={goal.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>{goal.name}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{goal.category}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(goal)}
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
                    onClick={() => handleDelete(goal.id)}
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

              {goal.description && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{goal.description}</p>}

              <div style={{ width: '100%', background: 'var(--bg)', borderRadius: '9999px', height: '12px', marginBottom: '8px' }}>
                <div
                  style={{
                    height: '12px',
                    borderRadius: '9999px',
                    background: 'var(--primary)',
                    transition: 'all 200ms ease',
                    width: `${Math.min(progress, 100)}%`,
                  }}
                />
              </div>

              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                <p style={{ margin: '4px 0' }}>{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</p>
                <p style={{ margin: '4px 0' }}>{progress.toFixed(1)}% complete</p>
                {goal.deadline && <p style={{ fontSize: '12px', margin: '4px 0' }}>Deadline: {formatDate(goal.deadline)}</p>}
              </div>

              {contributeId === goal.id ? (
                <form onSubmit={handleContribute} className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={contributeAmount}
                    onChange={(e) => setContributeAmount(e.target.value)}
                    required
                    className="input-field flex-1"
                  />
                  <button type="submit" className="btn-primary">Add</button>
                  <button
                    type="button"
                    onClick={() => { setContributeId(null); setContributeAmount(''); }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setContributeId(goal.id)}
                  className="w-full btn-primary"
                >
                  + Contribute
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
