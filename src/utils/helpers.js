import { format, parseISO, isValid, differenceInDays, differenceInYears } from 'date-fns';
import { DATE_FORMATS, STORAGE_KEYS } from './constants';

// Date Helpers
export const formatDate = (date, formatString = DATE_FORMATS.DISPLAY) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, formatString) : '';
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

export const formatDateForInput = (date) => {
  return formatDate(date, DATE_FORMATS.INPUT);
};

export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 0;
  
  try {
    const birthDate = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
    return differenceInYears(new Date(), birthDate);
  } catch (error) {
    console.error('Age calculation error:', error);
    return 0;
  }
};

export const calculateDaysSince = (date) => {
  if (!date) return 0;
  
  try {
    const targetDate = typeof date === 'string' ? parseISO(date) : date;
    return differenceInDays(new Date(), targetDate);
  } catch (error) {
    console.error('Days calculation error:', error);
    return 0;
  }
};

// Number Formatters
export const formatNumber = (number, decimals = 2) => {
  if (typeof number !== 'number') return '0';
  return number.toFixed(decimals);
};

export const formatCurrency = (amount, currency = 'KES') => {
  if (typeof amount !== 'number') return `${currency} 0.00`;
  
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatPercentage = (value, decimals = 1) => {
  if (typeof value !== 'number') return '0%';
  return `${value.toFixed(decimals)}%`;
};

// String Helpers
export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const titleCase = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => capitalizeFirst(word))
    .join(' ');
};

export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Array Helpers
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (direction === 'desc') {
      return bVal > aVal ? 1 : -1;
    }
    return aVal > bVal ? 1 : -1;
  });
};

export const filterBy = (array, filters) => {
  return array.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      
      const itemValue = item[key];
      if (typeof itemValue === 'string') {
        return itemValue.toLowerCase().includes(value.toLowerCase());
      }
      return itemValue === value;
    });
  });
};

// Object Helpers
export const pick = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

export const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

export const isEmpty = (value) => {
  if (value == null) return true;
  if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Local Storage Helpers
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error writing to localStorage:', error);
    return false;
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};

// URL Helpers
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  });
  
  return searchParams.toString();
};


export const parseQueryString = (queryString) => {
  const params = new URLSearchParams(queryString);
  const result = {};
  
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  
  return result;
};

// Validation Helpers
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^(\+254|0)[17]\d{8}$/;
  return phoneRegex.test(phone);
};

export const isValidDate = (date) => {
  if (!date) return false;
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
};

// File Helpers
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Color Helpers
export const getStatusColor = (status) => {
  const colors = {
    success: 'text-green-600 bg-green-50',
    warning: 'text-yellow-600 bg-yellow-50',
    error: 'text-red-600 bg-red-50',
    info: 'text-blue-600 bg-blue-50'
  };
  return colors[status] || colors.info;
};

export const getHealthStatusColor = (status) => {
  const colors = {
    healthy: 'text-green-600 bg-green-50',
    sick: 'text-red-600 bg-red-50',
    recovering: 'text-yellow-600 bg-yellow-50'
  };
  return colors[status] || colors.healthy;
};

// Random Helpers
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Download Helpers
export const downloadAsCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header]).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Chart Helpers
export const generateChartData = (data, xKey, yKey) => {
  return data.map(item => ({
    name: item[xKey],
    value: item[yKey]
  }));
};

export const calculateTrend = (data, key) => {
  if (!data || data.length < 2) return { direction: 'stable', percentage: 0 };
  
  const values = data.map(item => item[key]).filter(val => typeof val === 'number');
  if (values.length < 2) return { direction: 'stable', percentage: 0 };
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  if (firstAvg === 0) return { direction: 'stable', percentage: 0 };
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  return {
    direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
    percentage: Math.abs(Math.round(change))
  };
};

// Error Helpers
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message) return error.message;
  return 'An unexpected error occurred';
};

export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error?.response?.status === 401) {
    // Handle unauthorized access
    removeFromStorage(STORAGE_KEYS.AUTH_TOKEN);
    removeFromStorage(STORAGE_KEYS.USER_DATA);
    window.location.href = '/login';
    return 'Session expired. Please login again.';
  }
  
  return getErrorMessage(error);
};