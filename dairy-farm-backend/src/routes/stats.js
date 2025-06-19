const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireAnyRole } = require('../middleware/roleCheck');
const { body, query } = require('express-validator');

// All routes require authentication
router.use(authenticateToken);

// Dashboard statistics
router.get('/dashboard', [
  requireAnyRole,
  query('farmLocation').optional().isString(),
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly'])
], statsController.getDashboardStats);

// Production statistics
router.get('/production', [
  requireAnyRole,
  query('farmLocation').optional().isString(),
  query('startDate').isISO8601(),
  query('endDate').isISO8601(),
  query('type').optional().isIn(['milk', 'eggs'])
], statsController.getProductionStats);

// Financial statistics (admin only)
router.get('/financial', [
  requireAdmin,
  query('farmLocation').optional().isString(),
  query('startDate').isISO8601(),
  query('endDate').isISO8601()
], statsController.getFinancialStats);

// Performance statistics
router.get('/performance', [
  requireAnyRole,
  query('farmLocation').optional().isString(),
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly'])
], statsController.getPerformanceStats);

// Comparison statistics
router.get('/comparison', [
  requireAnyRole,
  query('period1Start').isISO8601(),
  query('period1End').isISO8601(),
  query('period2Start').isISO8601(),
  query('period2End').isISO8601(),
  query('farmLocation').optional().isString()
], statsController.getComparisonStats);

// Custom report generation
router.post('/custom-report', [
  requireAnyRole,
  body('farmLocation').optional().isString(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('includeTypes').isArray(),
  body('includeTypes.*').isIn(['livestock', 'production', 'health', 'feed', 'financial'])
], statsController.getCustomReport);

module.exports = router;