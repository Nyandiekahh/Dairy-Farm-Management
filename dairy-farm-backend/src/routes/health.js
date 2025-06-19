const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');
const { validateHealthRecord, validateObjectId } = require('../middleware/validation');
const { body, query, param } = require('express-validator');

// All health routes require admin access
router.use(authenticateToken, requireAdmin);

// Get all health records (with pagination and filtering)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('cowId').optional().isString(),
  query('farmLocation').optional().isString(),
  query('disease').optional().isString(),
  query('vetName').optional().isString()
], healthController.getAllHealthRecords);

// Get health record by ID
router.get('/:id', validateObjectId, healthController.getHealthRecordById);

// Create new health record
router.post('/', validateHealthRecord, healthController.createHealthRecord);

// Update health record
router.put('/:id', [
  validateObjectId,
  body('disease').optional().isString(),
  body('symptoms').optional().trim(),
  body('treatment').optional().isString(),
  body('medicineUsed').optional().isString(),
  body('dosage').optional().trim(),
  body('cost').optional().isFloat({ min: 0 }),
  body('vetName').optional().isString(),
  body('vetContact').optional().isString(),
  body('dateOfTreatment').optional().isISO8601(),
  body('followUpDate').optional().isISO8601(),
  body('notes').optional().trim(),
  body('isResolved').optional().isBoolean()
], healthController.updateHealthRecord);

// Delete health record
router.delete('/:id', validateObjectId, healthController.deleteHealthRecord);

// Get health records by cow
router.get('/cow/:cowId', [
  param('cowId').isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('isResolved').optional().isBoolean()
], healthController.getHealthRecordsByCow);

// Get health statistics
router.get('/stats/overview', [
  query('farmLocation').optional().isString(),
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], healthController.getHealthStats);

// Get veterinarian statistics
router.get('/stats/veterinarians', [
  query('farmLocation').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], healthController.getVeterinarianStats);

// Schedule follow-up
router.put('/:id/follow-up', [
  validateObjectId,
  body('followUpDate').isISO8601(),
  body('notes').optional().trim()
], healthController.scheduleFollowUp);

module.exports = router;