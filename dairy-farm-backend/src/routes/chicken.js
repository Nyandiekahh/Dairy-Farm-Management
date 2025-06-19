const express = require('express');
const router = express.Router();
const chickenController = require('../controllers/chickenController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireAnyRole } = require('../middleware/roleCheck');
const { validateChickenBatch, validateEggEntry, validateObjectId } = require('../middleware/validation');
const { body, query, param } = require('express-validator');

// All routes require authentication
router.use(authenticateToken);

// Chicken batch routes
router.get('/batches', [
  requireAnyRole,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('farmLocation').optional().isString(),
  query('isActive').optional().isBoolean()
], chickenController.getAllBatches);

router.get('/batches/:id', [
  requireAnyRole,
  validateObjectId
], chickenController.getBatchById);

router.post('/batches', [
  requireAdmin,
  validateChickenBatch
], chickenController.createBatch);

router.put('/batches/:id', [
  requireAdmin,
  validateObjectId,
  body('batchId').optional().trim().isLength({ min: 1 }),
  body('initialCount').optional().isInt({ min: 1 }),
  body('currentCount').optional().isInt({ min: 0 }),
  body('dateAcquired').optional().isISO8601(),
  body('farmLocation').optional().isString(),
  body('breed').optional().trim(),
  body('cost').optional().isFloat({ min: 0 }),
  body('supplier').optional().trim(),
  body('description').optional().trim(),
  body('expectedEggProductionAge').optional().isInt({ min: 1 }),
  body('expectedLifespan').optional().isInt({ min: 1 })
], chickenController.updateBatch);

router.delete('/batches/:id', [
  requireAdmin,
  validateObjectId
], chickenController.deleteBatch);

// Update chicken count (deaths/hatched)
router.put('/batches/:id/count', [
  requireAnyRole,
  validateObjectId,
  body('operation').isIn(['decrease', 'increase']),
  body('count').isInt({ min: 1 }),
  body('reason').optional().trim(),
  body('date').optional().isISO8601(),
  body('notes').optional().trim()
], chickenController.updateChickenCount);

// Egg record routes
router.get('/eggs', [
  requireAnyRole,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('batchId').optional().isString(),
  query('farmLocation').optional().isString(),
  query('date').optional().isISO8601()
], chickenController.getAllEggRecords);

router.post('/eggs', [
  requireAnyRole,
  validateEggEntry
], chickenController.createEggRecord);

router.put('/eggs/:id', [
  requireAnyRole,
  validateObjectId,
  body('quantity').optional().isInt({ min: 0 }),
  body('date').optional().isISO8601(),
  body('notes').optional().trim()
], chickenController.updateEggRecord);

router.delete('/eggs/:id', [
  requireAdmin,
  validateObjectId
], chickenController.deleteEggRecord);

// Get egg statistics
router.get('/eggs/stats', [
  requireAnyRole,
  query('farmLocation').optional().isString(),
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('batchId').optional().isString()
], chickenController.getEggStats);

// Chicken feed routes
router.get('/feed', [
  requireAnyRole,
  query('batchId').isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], chickenController.getChickenFeedRecords);

router.post('/feed', [
  requireAnyRole,
  body('batchId').isString(),
  body('quantity').isFloat({ min: 0 }),
  body('feedType').optional().isString(),
  body('cost').optional().isFloat({ min: 0 }),
  body('date').isISO8601(),
  body('supplier').optional().trim(),
  body('notes').optional().trim()
], chickenController.createChickenFeedRecord);

module.exports = router;