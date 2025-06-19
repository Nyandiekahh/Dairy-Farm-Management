const express = require('express');
const router = express.Router();
const cowController = require('../controllers/cowController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireAnyRole } = require('../middleware/roleCheck');
const { validateCowCreation, validateObjectId } = require('../middleware/validation');
const { body, query, param } = require('express-validator');

// All routes require authentication
router.use(authenticateToken);

// Get all cows (with pagination and filtering)
router.get('/', [
  requireAnyRole,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('farm').optional().isString(),
  query('breed').optional().isString(),
  query('stage').optional().isString()
], cowController.getAllCows);

// Get cow by ID
router.get('/:id', [requireAnyRole, validateObjectId], cowController.getCowById);

// Create new cow (admin only)
router.post('/', [requireAdmin, validateCowCreation], cowController.createCow);

// Update cow (admin only)
router.put('/:id', [
  requireAdmin,
  validateObjectId,
  body('name').optional().trim().isLength({ min: 1, max: 50 }),
  body('breed').optional().trim().isLength({ min: 1 }),
  body('dateOfBirth').optional().isISO8601(),
  body('farmLocation').optional().isString(),
  body('motherId').optional().isString(),
  body('fatherId').optional().isString(),
  body('description').optional().trim(),
  body('currentStage').optional().isString(),
  body('imageUrl').optional().isURL(),
  body('earTagNumber').optional().trim(),
  body('purchaseDate').optional().isISO8601(),
  body('purchasePrice').optional().isFloat({ min: 0 }),
  body('vendor').optional().trim()
], cowController.updateCow);

// Delete cow (admin only)
router.delete('/:id', [requireAdmin, validateObjectId], cowController.deleteCow);

// Update pregnancy status (admin only)
router.put('/:id/pregnancy', [
  requireAdmin,
  validateObjectId,
  body('isPregnant').isBoolean(),
  body('dateOfAI').optional().isISO8601(),
  body('expectedCalvingDate').optional().isISO8601(),
  body('actualCalvingDate').optional().isISO8601()
], cowController.updatePregnancyStatus);

// Get cows by farm
router.get('/farm/:farmLocation', [
  requireAnyRole,
  param('farmLocation').isString(),
  query('stage').optional().isString(),
  query('breed').optional().isString()
], cowController.getCowsByFarm);

module.exports = router;