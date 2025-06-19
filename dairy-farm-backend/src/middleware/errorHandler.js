const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || ERROR_MESSAGES.INTERNAL_ERROR,
    status: err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR
  };

  // Firebase Auth errors
  if (err.code) {
    switch (err.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        error.message = 'Invalid credentials';
        error.status = HTTP_STATUS.UNAUTHORIZED;
        break;
      case 'auth/email-already-exists':
        error.message = ERROR_MESSAGES.EMAIL_EXISTS;
        error.status = HTTP_STATUS.CONFLICT;
        break;
      case 'auth/invalid-email':
        error.message = 'Invalid email format';
        error.status = HTTP_STATUS.BAD_REQUEST;
        break;
      case 'auth/weak-password':
        error.message = 'Password is too weak';
        error.status = HTTP_STATUS.BAD_REQUEST;
        break;
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = err.message;
    error.status = HTTP_STATUS.BAD_REQUEST;
  }

  res.status(error.status).json({
    success: false,
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;