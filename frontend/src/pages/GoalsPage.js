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
    try {
      await goalAPI.contributeToGoal(contributeId, { amount: parseFloat(contributeAmount) });
      showToast.success('Contribution added');
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

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Financial Goals</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus /> Add Goal
        </button>
      </div>

      {showForm && (
        <div className="card mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Goal' : 'New Goal'}</h3>
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
                  <h3 className="text-lg font-semibold text-gray-800">{goal.name}</h3>
                  <p className="text-sm text-gray-600">{goal.category}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              {goal.description && <p className="text-sm text-gray-600 mb-3">{goal.description}</p>}

              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className="h-3 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

              <div className="text-sm text-gray-600 mb-4">
                <p>{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</p>
                <p>{progress.toFixed(1)}% complete</p>
                {goal.deadline && <p className="text-xs">Deadline: {formatDate(goal.deadline)}</p>}
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
