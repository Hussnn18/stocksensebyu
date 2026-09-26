import express from 'express';
import { handleCreateAdjustment } from '../controllers/adjustmentsController.js';
import { asyncHandler } from '../utils/http.js';

const router = express.Router();

// Stock counts are done by warehouse staff too
router.post('/', asyncHandler(handleCreateAdjustment));

export default router;
