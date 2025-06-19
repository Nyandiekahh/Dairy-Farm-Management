const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireAnyRole } = require('../middleware/roleCheck');
const { validateFeedEntry, validateObjectId } = require('../middleware/validation');
const { body, query, param } = require('express-validator');

// All routes require authentication
router.use(authenticateToken);

// Get all feed records (with pagination and filtering)
router.get('/', [
  requireAnyRole,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('cowId').optional().isString(),
  query('farmLocation').optional().isString(),
  query('feedType').optional().isString(),
  query('date').optional().isISO8601()
], feedController.getAllFeedRecords);

// Get feed record by ID
router.get('/:id', [requireAnyRole, validateObjectId], feedController.getFeedRecordById);

// Create new feed record
router.post('/', [requireAnyRole, validateFeedEntry], feedController.createFeedRecord);

// Create bulk feed records for multiple cows
router.post('/bulk', [
  requireAnyRole,
  body('cowIds').isArray({ min: 1 }),
  body('cowIds.*').isString(),
  body('feedType').isString(),
  body('subType').optional().isString(),
  body('quantity').isFloat({ min: 0 }),
  body('unit').optional().isString(),
  body('date').isISO8601(),
  body('notes').optional().trim()
], feedController.createBulkFeedRecord);

// Update feed record
router.put('/:id', [
  requireAnyRole,
  validateObjectId,
  body('feedType').optional().isString(),
  body('subType').optional().isString(),
  body('quantity').optional().isFloat({ min: 0 }),
  body('unit').optional().isString(),
  body('date').optional().isISO8601(),
  body('notes').optional().trim()
], feedController.updateFeedRecord);

// Delete feed record (admin only)
router.delete('/:id', [requireAdmin, validateObjectId], feedController.deleteFeedRecord);

// Get feed records by cow
router.get('/cow/:cowId', [
  requireAnyRole,
  param('cowId').isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('feedType').optional().isString()
], feedController.getFeedRecordsByCow);

// Get feed statistics
router.get('/stats/consumption', [
  requireAnyRole,
  query('farmLocation').optional().isString(),
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('feedType').optional().isString()
], feedController.getFeedStats);

// Feed inventory routes (admin only)
router.get('/inventory', [
  requireAdmin,
  query('farmLocation').optional().isString()
], feedController.getFeedInventory);

router.post('/inventory', [
  requireAdmin,
  body('farmLocation').isString(),
  body('feedType').isString(),
  body('subType').optional().isString(),
  body('quantity').isFloat({ min: 0 }),
  body('unit').optional().isString(),
  body('purchaseDate').isISO8601(),
  body('purchasePrice').isFloat({ min: 0 }),
  body('supplier').optional().trim(),
  body('transportCost').optional().isFloat({ min: 0 }),
  body('expiryDate').optional().isISO8601(),
  body('notes').optional().trim()
], feedController.createFeedInventory);

router.put('/inventory/:id', [
  requireAdmin,
  validateObjectId,
  body('quantity').optional().isFloat({ min: 0 }),
  body('purchasePrice').optional().isFloat({ min: 0 }),
  body('supplier').optional().trim(),
  body('transportCost').optional().isFloat({ min: 0 }),
  body('expiryDate').optional().isISO8601(),
  body('notes').optional().trim(),
  body('needsRestock').optional().isBoolean(),
  body('isActive').optional().isBoolean()
], feedController.updateFeedInventory);

// Mark feed item for restock
router.put('/inventory/:id/restock', [
  requireAdmin,
  validateObjectId
], feedController.markForRestock);

module.exports = router;