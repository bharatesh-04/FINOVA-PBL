import React from 'react';
import toast from 'react-hot-toast';

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US');
};

export const showToast = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  loading: (message) => toast.loading(message),
};

export const getCategoryColor = (categoryName) => {
  const colors = {
    'Food': '#FF6B6B',
    'Travel': '#4ECDC4',
    'Entertainment': '#95E1D3',
    'Shopping': '#FFB3B3',
    'Health': '#A8D8EA',
    'Education': '#AA96DA',
    'Utilities': '#FCBAD3',
    'Income': '#52B788',
  };
  return colors[categoryName] || '#C3B1E1';
};

export const truncateText = (text, maxLength = 50) => {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};
