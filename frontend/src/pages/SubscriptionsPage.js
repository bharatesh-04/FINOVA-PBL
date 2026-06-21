import React, { useEffect, useState } from 'react';
import { subscriptionAPI } from '../services/advancedAPI';
import { showToast, formatCurrency } from '../utils/helpers';
import { FiPlus, FiEdit2, FiTrash2, FiCalendar, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [upcomingRenewals, setUpcomingRenewals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Services',
    cost: '',
    frequency: 'monthly',
    renewal_date: '',
    start_date: new Date().toISOString().split('T')[0],
    is_used: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [subRes, statsRes, upcomingRes] = await Promise.all([
        subscriptionAPI.getSubscriptions(),
        subscriptionAPI.getStats(),
        subscriptionAPI.getUpcomingRenewals(30),
      ]);
      
      setSubscriptions(subRes.data);
      setStats(statsRes.data);
      setUpcomingRenewals(upcomingRes.data);
    } catch (error) {
      showToast.error('Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await subscriptionAPI.updateSubscription(editingId, formData);
        showToast.success('Subscription updated!');
      } else {
        await subscriptionAPI.createSubscription(formData);
        showToast.success('Subscription created!');
      }
      setFormData({
        name: '',
        category: 'Services',
        cost: '',
        frequency: 'monthly',
        renewal_date: '',
        start_date: new Date().toISOString().split('T')[0],
        is_used: true,
      });
      setShowForm(false);
      setEditingId(null);
      loadData();
    } catch (error) {
      showToast.error('Failed to save subscription');
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Cancel this subscription?')) {
      try {
        await subscriptionAPI.cancelSubscription(id);
        showToast.success('Subscription cancelled');
        loadData();
      } catch (error) {
        showToast.error('Failed to cancel subscription');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this subscription?')) {
      try {
        await subscriptionAPI.deleteSubscription(id);
        showToast.success('Subscription deleted');
        loadData();
      } catch (error) {
        showToast.error('Failed to delete subscription');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Subscription Tracker 🔄</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <FiPlus size={20} />
            Add Subscription
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold">{stats.active_subscriptions}</p>
              <p className="text-xs text-gray-400">₹{stats.monthly_spending.toFixed(2)}/mo</p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
              <p className="text-sm text-gray-500">Monthly Spending</p>
              <p className="text-2xl font-bold">₹{stats.monthly_spending.toFixed(2)}</p>
              <p className="text-xs text-gray-400">₹{stats.yearly_spending.toFixed(2)}/yr</p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
              <p className="text-sm text-gray-500">Unused</p>
              <p className="text-2xl font-bold text-orange-500">{stats.unused_subscriptions}</p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
              <p className="text-sm text-gray-500">Cancelled</p>
              <p className="text-2xl font-bold">{stats.cancelled_subscriptions}</p>
            </div>
          </div>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Subscription name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="p-2 border rounded-lg"
                required
              />
              <input
                type="number"
                placeholder="Cost"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="p-2 border rounded-lg"
                required
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="p-2 border rounded-lg"
              >
                <option>Services</option>
                <option>Entertainment</option>
                <option>Utilities</option>
                <option>Software</option>
                <option>Other</option>
              </select>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="p-2 border rounded-lg"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 w-full"
            >
              {editingId ? 'Update' : 'Create'} Subscription
            </button>
          </form>
        </div>
      )}

      {/* Upcoming Renewals */}
      {upcomingRenewals.length > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-400 rounded">
          <p className="font-semibold flex items-center gap-2">
            <FiAlertCircle />
            Upcoming Renewals (Next 30 days)
          </p>
          <div className="mt-2 space-y-2">
            {upcomingRenewals.map((sub) => (
              <p key={sub.id} className="text-sm text-gray-700">
                {sub.name} - {new Date(sub.next_billing_date).toLocaleDateString()} (₹{sub.cost})
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Subscriptions List */}
      <div className="space-y-4">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="p-4 rounded-lg border-l-4" style={{ backgroundColor: 'var(--surface)', borderColor: sub.status === 'active' ? '#10b981' : '#ef4444' }}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{sub.name}</h3>
                <p className="text-sm text-gray-500">{sub.category}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1">
                    <FiDollarSign size={16} /> ₹{sub.cost}/{sub.frequency}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiCalendar size={16} /> {new Date(sub.next_billing_date).toLocaleDateString()}
                  </span>
                  {sub.is_used === false && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">
                      Not In Use
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFormData(sub);
                    setEditingId(sub.id);
                    setShowForm(true);
                  }}
                  className="p-2 hover:bg-blue-100 rounded-lg text-blue-500"
                >
                  <FiEdit2 />
                </button>
                <button
                  onClick={() => handleCancel(sub.id)}
                  className="p-2 hover:bg-orange-100 rounded-lg text-orange-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(sub.id)}
                  className="p-2 hover:bg-red-100 rounded-lg text-red-500"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {subscriptions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No subscriptions tracked yet. Add one to get started!</p>
        </div>
      )}
    </div>
  );
}
