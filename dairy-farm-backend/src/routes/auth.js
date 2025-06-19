const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateUserCreation,
  handleValidationErrors 
} = require('../middleware/validation');
const { body } = require('express-validator');

// Public routes
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  handleValidationErrors
], authController.login);

router.post('/register', validateUserCreation, authController.register);

// Protected routes
router.get('/verify', authenticateToken, authController.verifyToken);
router.post('/logout', authenticateToken, authController.logout);

router.put('/change-password', [
  authenticateToken,
  body('currentPassword').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 6 }),
  handleValidationErrors
], authController.changePassword);

router.put('/profile', [
  authenticateToken,
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('phone').optional().trim(),
  handleValidationErrors
], authController.updateProfile);

module.exports = router;