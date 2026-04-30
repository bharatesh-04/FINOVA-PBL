import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { FiHome, FiList, FiDollarSign, FiPieChart, FiTarget, FiFileText, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useState } from 'react';

export default function Navigation() {
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
    { icon: FiDollarSign, label: 'Accounts', path: '/accounts' },
    { icon: FiPieChart, label: 'Budgets', path: '/budgets' },
    { icon: FiTarget, label: 'Goals', path: '/goals' },
    { icon: FiFileText, label: 'Analytics', path: '/analytics' },
    { icon: FiList, label: 'Bills', path: '/bills' },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="font-bold text-xl">
            💰 Finance Tracker
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

          <div className="flex items-center gap-4">
            <span className="text-sm">{user?.username}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              <FiLogOut /> Logout
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
