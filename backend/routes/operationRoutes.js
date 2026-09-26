import express from 'express';
import {
  handleListOperations,
  handleGetOperation,
  handleCreateOperation,
  handleUpdateOperation,
  handleConfirmOperation,
  handleCheckOperation,
  handlePickOperation,
  handlePackOperation,
  handleValidateOperation,
  handleCancelOperation,
} from '../controllers/operationsController.js';
import { asyncHandler } from '../utils/http.js';

const router = express.Router();

// Receipts, deliveries and transfers are daily work: open to managers and staff
router.get('/', asyncHandler(handleListOperations));
router.get('/:id', asyncHandler(handleGetOperation));
router.post('/', asyncHandler(handleCreateOperation));
router.put('/:id', asyncHandler(handleUpdateOperation));

// Status steps: draft → (waiting) → ready → [pick → pack] → done, or canceled
router.post('/:id/confirm', asyncHandler(handleConfirmOperation));
router.post('/:id/check', asyncHandler(handleCheckOperation));
router.post('/:id/pick', asyncHandler(handlePickOperation));
router.post('/:id/pack', asyncHandler(handlePackOperation));
router.post('/:id/validate', asyncHandler(handleValidateOperation));
router.post('/:id/cancel', asyncHandler(handleCancelOperation));

export default router;
