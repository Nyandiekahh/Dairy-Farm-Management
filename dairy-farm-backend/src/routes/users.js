const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireAnyRole } = require('../middleware/roleCheck');
const { validateUserCreation, validateObjectId } = require('../middleware/validation');
const { body, query, param } = require('express-validator');

// All routes require authentication and admin role
router.use(authenticateToken);

// Get all users (with pagination and filtering) - Admin only
router.get('/', [
  requireAdmin,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('farm').optional().isString(),
  query('role').optional().isIn(['admin', 'farmer'])
], userController.getAllUsers);

// Get user by ID - Admin only
router.get('/:id', [
  requireAdmin, 
  validateObjectId
], userController.getUserById);

// Create new user - Admin only
router.post('/', [
  requireAdmin, 
  validateUserCreation
], userController.createUser);

// Update user - Admin only
router.put('/:id', [
  requireAdmin,
  validateObjectId,
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('role').optional().isIn(['admin', 'farmer']),
  body('assignedFarm').optional().isString(),
  body('phone').optional().trim(),
  body('permissions').optional().isObject(),
  body('isActive').optional().isBoolean()
], userController.updateUser);

// Delete user - Admin only
router.delete('/:id', [
  requireAdmin, 
  validateObjectId
], userController.deleteUser);

// Get users by farm - Admin only
router.get('/farm/:farmLocation', [
  requireAdmin,
  param('farmLocation').isString(),
  query('role').optional().isIn(['admin', 'farmer'])
], userController.getUsersByFarm);

// Update user permissions - Admin only
router.put('/:id/permissions', [
  requireAdmin,
  validateObjectId,
  body('permissions').isObject()
], userController.updateUserPermissions);

module.exports = router;