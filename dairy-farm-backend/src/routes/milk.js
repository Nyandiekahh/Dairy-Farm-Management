const express = require('express');
const router = express.Router();
const milkController = require('../controllers/milkController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireAnyRole } = require('../middleware/roleCheck');
const { validateMilkEntry, validateObjectId } = require('../middleware/validation');
const { body, query, param } = require('express-validator');

// All routes require authentication
router.use(authenticateToken);

// Get all milk records (with pagination and filtering)
router.get('/', [
  requireAnyRole,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('cowId').optional().isString(),
  query('farmLocation').optional().isString(),
  query('date').optional().isISO8601(),
  query('session').optional().isString(),
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly'])
], milkController.getAllMilkRecords);

// Get milk record by ID
router.get('/:id', [requireAnyRole, validateObjectId], milkController.getMilkRecordById);

// Create new milk record
router.post('/', [requireAnyRole, validateMilkEntry], milkController.createMilkRecord);

// Update milk record
router.put('/:id', [
  requireAnyRole,
  validateObjectId,
  body('quantity').optional().isFloat({ min: 0 }),
  body('session').optional().isString(),
  body('date').optional().isISO8601(),
  body('notes').optional().trim()
], milkController.updateMilkRecord);

// Delete milk record (admin only)
router.delete('/:id', [requireAdmin, validateObjectId], milkController.deleteMilkRecord);

// Get milk records by cow
router.get('/cow/:cowId', [
  requireAnyRole,
  param('cowId').isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('session').optional().isString()
], milkController.getMilkRecordsByCow);

// Get milk statistics
router.get('/stats/production', [
  requireAnyRole,
  query('farmLocation').optional().isString(),
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('cowId').optional().isString()
], milkController.getMilkStats);

// Get milk sales (admin only)
router.get('/sales/records', [
  requireAdmin,
  query('farmLocation').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], milkController.getMilkSales);

// Create milk sale record (admin only)
router.post('/sales', [
  requireAdmin,
  body('farmLocation').isString(),
  body('quantity').isFloat({ min: 0 }),
  body('pricePerLitre').isFloat({ min: 0 }),
  body('totalAmount').isFloat({ min: 0 }),
  body('date').isISO8601(),
  body('buyer').optional().trim(),
  body('notes').optional().trim()
], milkController.createMilkSale);

module.exports = router;