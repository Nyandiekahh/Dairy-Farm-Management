import { VALIDATION } from './constants';

// Basic Validators
export const isRequired = (value, message = 'This field is required') => {
  if (value === null || value === undefined) return message;
  if (typeof value === 'string' && value.trim() === '') return message;
  if (Array.isArray(value) && value.length === 0) return message;
  return null;
};

export const minLength = (value, min, message) => {
  if (!value) return null;
  if (value.length < min) {
    return message || `Must be at least ${min} characters`;
  }
  return null;
};

export const maxLength = (value, max, message) => {
  if (!value) return null;
  if (value.length > max) {
    return message || `Must be no more than ${max} characters`;
  }
  return null;
};

export const isEmail = (value, message = 'Invalid email address') => {
  if (!value) return null;
  if (!VALIDATION.EMAIL_REGEX.test(value)) return message;
  return null;
};

export const isPhone = (value, message = 'Invalid phone number') => {
  if (!value) return null;
  if (!VALIDATION.PHONE_REGEX.test(value)) return message;
  return null;
};

export const isNumber = (value, message = 'Must be a valid number') => {
  if (value === null || value === undefined || value === '') return null;
  if (isNaN(Number(value))) return message;
  return null;
};

export const isPositive = (value, message = 'Must be a positive number') => {
  if (!value && value !== 0) return null;
  if (Number(value) < 0) return message;
  return null;
};

export const isInteger = (value, message = 'Must be a whole number') => {
  if (!value && value !== 0) return null;
  if (!Number.isInteger(Number(value))) return message;
  return null;
};

export const isDate = (value, message = 'Invalid date') => {
  if (!value) return null;
  if (isNaN(Date.parse(value))) return message;
  return null;
};

export const isFutureDate = (value, message = 'Date must be in the future') => {
  if (!value) return null;
  const date = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date <= today) return message;
  return null;
};

export const isPastDate = (value, message = 'Date must be in the past') => {
  if (!value) return null;
  const date = new Date(value);
  const today = new Date();
  if (date > today) return message;
  return null;
};

// Composite Validators
export const validateRequired = (message) => (value) => isRequired(value, message);

export const validateEmail = (required = false) => (value) => {
  if (required) {
    const requiredError = isRequired(value);
    if (requiredError) return requiredError;
  }
  return isEmail(value);
};

export const validatePhone = (required = false) => (value) => {
  if (required) {
    const requiredError = isRequired(value);
    if (requiredError) return requiredError;
  }
  return isPhone(value);
};

export const validatePassword = (value) => {
  const requiredError = isRequired(value, 'Password is required');
  if (requiredError) return requiredError;
  
  const lengthError = minLength(value, VALIDATION.MIN_PASSWORD_LENGTH, 
    `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`);
  if (lengthError) return lengthError;
  
  return null;
};

export const validateName = (required = true) => (value) => {
  if (required) {
    const requiredError = isRequired(value, 'Name is required');
    if (requiredError) return requiredError;
  }
  
  const lengthError = maxLength(value, VALIDATION.MAX_NAME_LENGTH);
  if (lengthError) return lengthError;
  
  return null;
};

export const validateDescription = (value) => {
  const lengthError = maxLength(value, VALIDATION.MAX_DESCRIPTION_LENGTH);
  if (lengthError) return lengthError;
  return null;
};

export const validateQuantity = (required = true) => (value) => {
  if (required) {
    const requiredError = isRequired(value, 'Quantity is required');
    if (requiredError) return requiredError;
  }
  
  const numberError = isNumber(value);
  if (numberError) return numberError;
  
  const positiveError = isPositive(value);
  if (positiveError) return positiveError;
  
  return null;
};

export const validatePrice = (required = false) => (value) => {
  if (required) {
    const requiredError = isRequired(value, 'Price is required');
    if (requiredError) return requiredError;
  }
  
  if (value !== null && value !== undefined && value !== '') {
    const numberError = isNumber(value);
    if (numberError) return numberError;
    
    const positiveError = isPositive(value);
    if (positiveError) return positiveError;
  }
  
  return null;
};

export const validateDate = (required = true) => (value) => {
  if (required) {
    const requiredError = isRequired(value, 'Date is required');
    if (requiredError) return requiredError;
  }
  
  return isDate(value);
};

export const validateFutureDate = (required = true) => (value) => {
  if (required) {
    const requiredError = isRequired(value, 'Date is required');
    if (requiredError) return requiredError;
  }
  
  const dateError = isDate(value);
  if (dateError) return dateError;
  
  return isFutureDate(value);
};

export const validatePastDate = (required = true) => (value) => {
  if (required) {
    const requiredError = isRequired(value, 'Date is required');
    if (requiredError) return requiredError;
  }
  
  const dateError = isDate(value);
  if (dateError) return dateError;
  
  return isPastDate(value);
};

// Form-specific Validators
export const validateCowForm = {
  name: validateName(true),
  breed: validateRequired('Breed is required'),
  dateOfBirth: validatePastDate(true),
  farmLocation: validateRequired('Farm location is required'),
  earTagNumber: (value) => {
    if (value && value.length > 20) {
      return 'Ear tag number must be less than 20 characters';
    }
    return null;
  },
  purchasePrice: validatePrice(false),
  description: validateDescription
};

export const validateMilkForm = {
  cowId: validateRequired('Cow is required'),
  quantity: validateQuantity(true),
  session: validateRequired('Session is required'),
  date: validatePastDate(true)
};

export const validateFeedForm = {
  cowId: validateRequired('Cow is required'),
  feedType: validateRequired('Feed type is required'),
  quantity: validateQuantity(true),
  date: validatePastDate(true)
};

export const validateHealthForm = {
  cowId: validateRequired('Cow is required'),
  disease: validateRequired('Disease is required'),
  treatment: validateRequired('Treatment is required'),
  medicineUsed: validateRequired('Medicine is required'),
  cost: validatePrice(true),
  vetName: validateRequired('Veterinarian name is required'),
  vetContact: validateRequired('Veterinarian contact is required'),
  dateOfIllness: validatePastDate(true)
};

export const validateChickenBatchForm = {
  batchId: validateRequired('Batch ID is required'),
  initialCount: (value) => {
    const requiredError = isRequired(value, 'Initial count is required');
    if (requiredError) return requiredError;
    
    const numberError = isNumber(value);
    if (numberError) return numberError;
    
    const integerError = isInteger(value);
    if (integerError) return integerError;
    
    const positiveError = isPositive(value);
    if (positiveError) return positiveError;
    
    return null;
  },
  dateAcquired: validatePastDate(true),
  farmLocation: validateRequired('Farm location is required'),
  cost: validatePrice(false)
};

export const validateEggForm = {
  batchId: validateRequired('Batch is required'),
  quantity: (value) => {
    const requiredError = isRequired(value, 'Quantity is required');
    if (requiredError) return requiredError;
    
    const numberError = isNumber(value);
    if (numberError) return numberError;
    
    const integerError = isInteger(value);
    if (integerError) return integerError;
    
    const positiveError = isPositive(value);
    if (positiveError) return positiveError;
    
    return null;
  },
  date: validatePastDate(true)
};

export const validateUserForm = {
  email: validateEmail(true),
  firstName: validateName(true),
  lastName: validateName(true),
  role: validateRequired('Role is required'),
  phone: validatePhone(false)
};

export const validateLoginForm = {
  email: validateEmail(true),
  password: validateRequired('Password is required')
};

// Utility function to validate an entire form
export const validateForm = (values, validators) => {
  const errors = {};
  
  Object.keys(validators).forEach(field => {
    const validator = validators[field];
    const error = validator(values[field]);
    if (error) {
      errors[field] = error;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Utility function for async validation
export const validateFormAsync = async (values, validators) => {
  const errors = {};
  const promises = [];
  
  Object.keys(validators).forEach(field => {
    const validator = validators[field];
    const result = validator(values[field]);
    
    if (result instanceof Promise) {
      promises.push(
        result.then(error => {
          if (error) errors[field] = error;
        }).catch(error => {
          errors[field] = 'Validation error';
        })
      );
    } else if (result) {
      errors[field] = result;
    }
  });
  
  await Promise.all(promises);
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};