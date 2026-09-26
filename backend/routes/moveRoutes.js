import express from 'express';
import { handleListMoves } from '../controllers/movesController.js';
import { asyncHandler } from '../utils/http.js';

const router = express.Router();

// The ledger is read-only: moves are only written by validate, adjustments and initial stock
router.get('/', asyncHandler(handleListMoves));

export default router;
