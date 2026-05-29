import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { FiHome, FiList, FiPieChart, FiTarget, FiFileText, FiLogOut, FiMenu, FiX, FiSliders } from 'react-icons/fi';
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
    { icon: FaRupeeSign, label: 'Accounts', path: '/accounts' },
    { icon: FiPieChart, label: 'Budgets', path: '/budgets' },
    { icon: FiTarget, label: 'Goals', path: '/goals' },
    { icon: FiFileText, label: 'Analytics', path: '/analytics' },
    { icon: FiList, label: 'Bills', path: '/bills' },
  ];

  return (
    <nav className="app-header text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center min-h-16 py-3 gap-3">
          <Link to="/dashboard" className="font-bold text-xl whitespace-nowrap">
            FINNOVA
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <label className="theme-picker hidden sm:flex items-center gap-2">
              <FiSliders size={16} />
              <select
                value={theme}
                onChange={(event) => onThemeChange(event.target.value)}
                className="theme-select"
                aria-label="Choose theme"
              >
                {themeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <span className="hidden lg:inline text-sm">{user?.username}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              <FiLogOut /> <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden"
            >
              {isOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <label className="theme-picker flex items-center gap-2 px-3 py-2">
              <FiSliders size={16} />
              <select
                value={theme}
                onChange={(event) => onThemeChange(event.target.value)}
                className="theme-select"
                aria-label="Choose theme"
              >
                {themeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
