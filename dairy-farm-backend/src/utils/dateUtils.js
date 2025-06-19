const moment = require('moment');

const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

const getStartOfWeek = (date = new Date()) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getEndOfWeek = (date = new Date()) => {
  const end = new Date(date);
  const day = end.getDay();
  const diff = end.getDate() - day + (day === 0 ? 0 : 7);
  end.setDate(diff);
  end.setHours(23, 59, 59, 999);
  return end;
};

const getStartOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const getEndOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

const getStartOfYear = (date = new Date()) => {
  return new Date(date.getFullYear(), 0, 1);
};

const getEndOfYear = (date = new Date()) => {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
};

const getDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const formatDateForDisplay = (date, format = 'YYYY-MM-DD') => {
  return moment(date).format(format);
};

const isValidDate = (dateString) => {
  return moment(dateString).isValid();
};

const getWeekNumber = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const getDateRanges = (period, date = new Date()) => {
  const ranges = {};
  
  switch (period) {
    case 'daily':
      ranges.start = new Date(date);
      ranges.start.setHours(0, 0, 0, 0);
      ranges.end = new Date(date);
      ranges.end.setHours(23, 59, 59, 999);
      break;
      
    case 'weekly':
      ranges.start = getStartOfWeek(date);
      ranges.end = getEndOfWeek(date);
      break;
      
    case 'monthly':
      ranges.start = getStartOfMonth(date);
      ranges.end = getEndOfMonth(date);
      break;
      
    case 'yearly':
      ranges.start = getStartOfYear(date);
      ranges.end = getEndOfYear(date);
      break;
      
    default:
      ranges.start = getStartOfMonth(date);
      ranges.end = getEndOfMonth(date);
  }
  
  return ranges;
};

module.exports = {
  getToday,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
  getDaysBetween,
  addDays,
  addMonths,
  formatDateForDisplay,
  isValidDate,
  getWeekNumber,
  getDateRanges
};