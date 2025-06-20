const express = require('express');
const router = express.Router();
const farmController = require('../controllers/farmController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireAnyRole } = require('../middleware/roleCheck');
const { validateObjectId } = require('../middleware/validation');
const { body, query, param } = require('express-validator');

// All routes require authentication
router.use(authenticateToken);

// Get all farms
router.get('/', requireAnyRole, farmController.getAllFarms);

// Get farm by ID
router.get('/:id', [requireAnyRole, validateObjectId], farmController.getFarmById);

// Create new farm (admin only)
router.post('/', [
  requireAdmin,
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('location').trim().isLength({ min: 1, max: 50 }),
  body('address').optional().trim(),
  body('contactPhone').optional().trim(),
  body('contactEmail').optional().isEmail(),
  body('manager').optional().trim(),
  body('description').optional().trim(),
  body('establishedDate').optional().isISO8601(),
  body('size').optional().isFloat({ min: 0 }),
  body('specialization').optional().isArray()
], farmController.createFarm);

// Update farm (admin only)
router.put('/:id', [
  requireAdmin,
  validateObjectId,
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('address').optional().trim(),
  body('contactPhone').optional().trim(),
  body('contactEmail').optional().isEmail(),
  body('manager').optional().trim(),
  body('description').optional().trim(),
  body('establishedDate').optional().isISO8601(),
  body('size').optional().isFloat({ min: 0 }),
  body('specialization').optional().isArray()
], farmController.updateFarm);

// Delete farm (admin only)
router.delete('/:id', [requireAdmin, validateObjectId], farmController.deleteFarm);

// Get farm settings - FIXED ROUTE
router.get('/:farmLocation/settings', [
  requireAnyRole,
  param('farmLocation').notEmpty().isString()
], farmController.getFarmSettings);

// Update farm settings (admin only) - FIXED ROUTE
router.put('/:farmLocation/settings', [
  requireAdmin,
  param('farmLocation').notEmpty().isString(),
  body('settings').isObject()
], farmController.updateFarmSettings);

// Get farm summary - FIXED ROUTE
router.get('/:farmLocation/summary', [
  requireAnyRole,
  param('farmLocation').notEmpty().isString(),
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly'])
], farmController.getFarmSummary);

// Initialize farm data (admin only) - FIXED ROUTE
router.post('/:farmLocation/initialize', [
  requireAdmin,
  param('farmLocation').notEmpty().isString()
], farmController.initializeFarmData);

module.exports = router;