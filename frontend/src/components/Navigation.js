import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { FiHome, FiList, FiPieChart, FiTarget, FiFileText, FiLogOut, FiMenu, FiX, FiSliders, FiTrendingUp, FiBarChart2, FiRefreshCcw, FiZap } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { useState } from 'react';

export default function Navigation({ theme, themeOptions, onThemeChange }) {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearAuth();
    navigate('/login');
  };

  const navItems = [
    { icon: FiHome, label: 'Dashboard', path: '/dashboard' },
    { icon: FiList, label: 'Transactions', path: '/transactions' },
    { icon: FiPieChart, label: 'Budgets', path: '/budgets' },
    { icon: FiTarget, label: 'Goals', path: '/goals' },
    { icon: FiBarChart2, label: 'Reports', path: '/analytics' },
    { icon: FiTrendingUp, label: 'Insights', path: '/analytics' },
    { icon: FaRupeeSign, label: 'Accounts', path: '/accounts' },
    { icon: FiFileText, label: 'Bills & Receipts', path: '/bills' },
    { icon: FiRefreshCcw, label: 'Subscriptions', path: '/subscriptions' },
    { icon: FiZap, label: 'Forecasting', path: '/forecasting' },
  ];

  return (
    <>
      {/* Sidebar */}
      <aside className="sidebar fixed left-0 top-0 h-screen w-64 text-white shadow-lg flex flex-col z-50 md:z-40">
        {/* Logo */}
        <div className="sidebar-header">
          <Link to="/dashboard" className="text-white no-underline">
            FINNOVA
          </Link>
          {user?.username && (
            <p className="mt-2 text-sm text-gray-200">Hello, {user.username}</p>
          )}
        </div>

        {/* Nav Items */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="sidebar-nav-item group"
              onClick={() => setIsOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Theme & Logout */}
        <div className="sidebar-footer">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <FiSliders size={16} />
            <select
              value={theme}
              onChange={(event) => onThemeChange(event.target.value)}
              className="theme-select flex-1"
              aria-label="Choose theme"
            >
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-2.5 w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-300 text-sm font-medium"
          >
            <FiLogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg transition-colors hover:bg-slate-700"
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
