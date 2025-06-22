// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
export const API_TIMEOUT = process.env.REACT_APP_API_TIMEOUT || 10000;

// App Configuration
export const APP_NAME = process.env.REACT_APP_NAME || 'Dairy Farm Management';
export const APP_VERSION = process.env.REACT_APP_VERSION || '1.0.0';
export const ENVIRONMENT = process.env.REACT_APP_ENVIRONMENT || 'development';

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  FARMER: 'farmer'
};

// Farm Locations
export const FARM_LOCATIONS = {
  NAKURU: 'nakuru',
  KISII: 'kisii'
};

// Farm Display Names
export const FARM_DISPLAY_NAMES = {
  [FARM_LOCATIONS.NAKURU]: 'Nakuru Farm',
  [FARM_LOCATIONS.KISII]: 'Kisii Farm'
};

// Milking Sessions
export const MILKING_SESSIONS = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening'
};

// Session Display Names
export const SESSION_DISPLAY_NAMES = {
  [MILKING_SESSIONS.MORNING]: 'Morning',
  [MILKING_SESSIONS.AFTERNOON]: 'Afternoon',
  [MILKING_SESSIONS.EVENING]: 'Evening'
};

// Cow Stages
export const COW_STAGES = {
  DRY_PERIOD: 'dry_period',
  HEAT: 'heat',
  PREGNANT: 'pregnant',
  LACTATING: 'lactating',
  SICK: 'sick',
  ACTIVE: 'active'
};

// Stage Display Names
export const STAGE_DISPLAY_NAMES = {
  [COW_STAGES.DRY_PERIOD]: 'Dry Period',
  [COW_STAGES.HEAT]: 'In Heat',
  [COW_STAGES.PREGNANT]: 'Pregnant',
  [COW_STAGES.LACTATING]: 'Lactating',
  [COW_STAGES.SICK]: 'Sick',
  [COW_STAGES.ACTIVE]: 'Active'
};

// Feed Types
export const FEED_TYPES = {
  CONCENTRATES: {
    DAIRY_MEAL: 'dairy_meal',
    MAIZE_JAM: 'maize_jam'
  },
  MINERALS: {
    MACLIC_SUPA: 'maclic_supa',
    MACLIC_PLUS: 'maclic_plus'
  },
  ROUGHAGE: {
    NAPIER: 'napier',
    HAY: 'hay',
    SILAGE: 'silage'
  }
};

// Feed Display Names
export const FEED_DISPLAY_NAMES = {
  dairy_meal: 'Dairy Meal',
  maize_jam: 'Maize Jam',
  maclic_supa: 'Maclic Supa',
  maclic_plus: 'Maclic Plus',
  napier: 'Napier Grass',
  hay: 'Hay',
  silage: 'Silage'
};

// Periods for Statistics
export const STAT_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

// Period Display Names
export const PERIOD_DISPLAY_NAMES = {
  [STAT_PERIODS.DAILY]: 'Daily',
  [STAT_PERIODS.WEEKLY]: 'Weekly',
  [STAT_PERIODS.MONTHLY]: 'Monthly',
  [STAT_PERIODS.YEARLY]: 'Yearly'
};

// Pagination
export const DEFAULT_PAGE_SIZE = parseInt(process.env.REACT_APP_DEFAULT_PAGINATION_LIMIT) || 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// Status Types
export const STATUS_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info'
};

// Alert Types
export const ALERT_TYPES = {
  LOW_MILK_PRODUCTION: 'low_milk_production',
  HEALTH_ISSUES: 'health_issues',
  FEED_RESTOCK: 'feed_restock',
  AGING_CHICKENS: 'aging_chickens'
};

// Health Status
export const HEALTH_STATUS = {
  HEALTHY: 'healthy',
  SICK: 'sick',
  RECOVERING: 'recovering'
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'MMM dd, yyyy HH:mm',
  TIME: 'HH:mm'
};

// Navigation Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  COWS: '/cows',
  MILK: '/milk',
  FEED: '/feed',
  HEALTH: '/health',
  CHICKEN: '/chicken',
  STATS: '/stats',
  USERS: '/users',
  SETTINGS: '/settings'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'dairy_farm_auth_token',
  USER_DATA: 'dairy_farm_user_data',
  SELECTED_FARM: 'dairy_farm_selected_farm',
  THEME: 'dairy_farm_theme'
};

// Theme Configuration
export const THEME = {
  PRIMARY_COLOR: process.env.REACT_APP_PRIMARY_COLOR || '#059669',
  SECONDARY_COLOR: process.env.REACT_APP_SECONDARY_COLOR || '#10b981',
  ACCENT_COLOR: process.env.REACT_APP_ACCENT_COLOR || '#34d399'
};

// Feature Flags
export const FEATURES = {
  OFFLINE_MODE: process.env.REACT_APP_ENABLE_OFFLINE_MODE === 'true',
  PUSH_NOTIFICATIONS: process.env.REACT_APP_ENABLE_PUSH_NOTIFICATIONS === 'true'
};

// Validation Rules
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 500,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^(\+254|0)[17]\d{8}$/
};

// Units
export const UNITS = {
  WEIGHT: 'kg',
  VOLUME: 'litres',
  CURRENCY: 'KES'
};

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#059669',
  SECONDARY: '#10b981',
  ACCENT: '#34d399',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6'
};