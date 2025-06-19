const USER_ROLES = {
  ADMIN: 'admin',
  FARMER: 'farmer'
};

const FARM_LOCATIONS = {
  NAKURU: 'nakuru',
  KISII: 'kisii'
};

const COW_STAGES = {
  DRY_PERIOD: 'dry_period',
  HEAT: 'heat',
  PREGNANT: 'pregnant',
  LACTATING: 'lactating',
  SICK: 'sick'
};

const MILKING_SESSIONS = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening'
};

const FEED_TYPES = {
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

const COLLECTIONS = {
  USERS: 'users',
  FARMS: 'farms',
  COWS: 'cows',
  CHICKEN_BATCHES: 'chicken_batches',
  MILK_RECORDS: 'milk_records',
  FEED_RECORDS: 'feed_records',
  HEALTH_RECORDS: 'health_records',
  EGG_RECORDS: 'egg_records',
  SYSTEM_SETTINGS: 'system_settings',
  FEED_INVENTORY: 'feed_inventory'
};

const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+254|0)[17]\d{8}$/,
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 500
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Insufficient permissions',
  USER_NOT_FOUND: 'User not found',
  COW_NOT_FOUND: 'Cow not found',
  FARM_NOT_FOUND: 'Farm not found',
  INVALID_INPUT: 'Invalid input data',
  EMAIL_EXISTS: 'Email already exists',
  INTERNAL_ERROR: 'Internal server error'
};

module.exports = {
  USER_ROLES,
  FARM_LOCATIONS,
  COW_STAGES,
  MILKING_SESSIONS,
  FEED_TYPES,
  COLLECTIONS,
  VALIDATION_RULES,
  HTTP_STATUS,
  ERROR_MESSAGES
};