import toast from 'react-hot-toast';

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

// Extract error message from various error formats
export const extractErrorMessage = (error) => {
  // If it's a string, return as is
  if (typeof error === 'string') {
    return error;
  }

  // Check if it's an axios error
  if (error?.response?.data) {
    const data = error.response.data;
    
    // If it has a detail field (FastAPI standard error)
    if (typeof data?.detail === 'string') {
      return data.detail;
    }

    // If detail is an array (validation errors)
    if (Array.isArray(data?.detail)) {
      return data.detail.map(err => {
        if (typeof err === 'string') return err;
        if (err?.msg) return `${err.loc?.[1] || err.loc?.[0]}: ${err.msg}`;
        return 'Validation error';
      }).join(', ');
    }

    // If there's a message field
    if (typeof data?.message === 'string') {
      return data.message;
    }

    // If it's directly an error object with msg field
    if (typeof data?.msg === 'string') {
      return data.msg;
    }
  }

  // Fallback
  return error?.message || 'An error occurred';
};

export const showToast = {
  success: (message) => toast.success(message),
  error: (error) => {
    const message = extractErrorMessage(error);
    toast.error(message);
  },
  warning: (message) => toast(message, {
    icon: '⚠️',
    style: {
      borderRadius: '10px',
      background: '#fff7ed',
      color: '#9a5b00',
      border: '1px solid #fed7aa',
    },
  }),
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
