const { body, param, query, validationResult } = require('express-validator');
const { HTTP_STATUS, VALIDATION_RULES, FARM_LOCATIONS, USER_ROLES } = require('../utils/constants');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User validation
const validateUserCreation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: VALIDATION_RULES.MIN_PASSWORD_LENGTH })
    .withMessage(`Password must be at least ${VALIDATION_RULES.MIN_PASSWORD_LENGTH} characters`),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: VALIDATION_RULES.MAX_NAME_LENGTH })
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: VALIDATION_RULES.MAX_NAME_LENGTH })
    .withMessage('Last name is required'),
  body('role')
    .isIn(Object.values(USER_ROLES))
    .withMessage('Valid role is required'),
  body('assignedFarm')
    .optional()
    .isIn(Object.values(FARM_LOCATIONS))
    .withMessage('Valid farm location is required'),
  handleValidationErrors
];

// Cow validation
const validateCowCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: VALIDATION_RULES.MAX_NAME_LENGTH })
    .withMessage('Cow name is required'),
  body('breed')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Breed is required'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Valid date of birth is required'),
  body('farmLocation')
    .isIn(Object.values(FARM_LOCATIONS))
    .withMessage('Valid farm location is required'),
  body('motherId')
    .optional()
    .isString(),
  body('description')
    .optional()
    .isLength({ max: VALIDATION_RULES.MAX_DESCRIPTION_LENGTH }),
  handleValidationErrors
];

// Milk entry validation
const validateMilkEntry = [
  body('cowId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Cow ID is required'),
  body('quantity')
    .isFloat({ min: 0 })
    .withMessage('Valid milk quantity is required'),
  body('session')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Milking session is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  handleValidationErrors
];

// Feed entry validation
const validateFeedEntry = [
  body('cowId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Cow ID is required'),
  body('feedType')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Feed type is required'),
  body('quantity')
    .isFloat({ min: 0 })
    .withMessage('Valid quantity is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  handleValidationErrors
];

// Health record validation
const validateHealthRecord = [
  body('cowId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Cow ID is required'),
  body('dateOfIllness')
    .isISO8601()
    .withMessage('Valid illness date is required'),
  body('disease')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Disease name is required'),
  body('treatment')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Treatment is required'),
  body('medicineUsed')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Medicine used is required'),
  body('cost')
    .isFloat({ min: 0 })
    .withMessage('Valid cost is required'),
  body('vetName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Veterinarian name is required'),
  body('vetContact')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Veterinarian contact is required'),
  handleValidationErrors
];

// Chicken batch validation
const validateChickenBatch = [
  body('batchId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Batch ID is required'),
  body('initialCount')
    .isInt({ min: 1 })
    .withMessage('Valid initial count is required'),
  body('dateAcquired')
    .isISO8601()
    .withMessage('Valid acquisition date is required'),
  body('farmLocation')
    .isIn(Object.values(FARM_LOCATIONS))
    .withMessage('Valid farm location is required'),
  body('breed')
    .optional()
    .trim(),
  body('cost')
    .optional()
    .isFloat({ min: 0 }),
  handleValidationErrors
];

// Egg entry validation
const validateEggEntry = [
  body('batchId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Batch ID is required'),
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Valid egg quantity is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  handleValidationErrors
];

// Parameter validation - FIXED: More specific validation functions
const validateObjectId = [
  param('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Valid ID is required'),
  handleValidationErrors
];

const validateCowId = [
  param('cowId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Valid cow ID is required'),
  handleValidationErrors
];

const validateFarmLocation = [
  param('farmLocation')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Valid farm location is required'),
  handleValidationErrors
];

// Generic parameter validator factory
const validateParam = (paramName, message = 'Valid parameter is required') => [
  param(paramName)
    .isString()
    .isLength({ min: 1 })
    .withMessage(message),
  handleValidationErrors
];

module.exports = {
  validateUserCreation,
  validateCowCreation,
  validateMilkEntry,
  validateFeedEntry,
  validateHealthRecord,
  validateChickenBatch,
  validateEggEntry,
  validateObjectId,
  validateCowId,
  validateFarmLocation,
  validateParam,
  handleValidationErrors
};