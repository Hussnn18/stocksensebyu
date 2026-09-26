import express from 'express';
import { handleListReorderRules, handleSaveReorderRule } from '../controllers/reorderRulesController.js';
import { requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = express.Router();

router.get('/', asyncHandler(handleListReorderRules));
router.put('/:productId', requireRole('manager'), asyncHandler(handleSaveReorderRule));

export default router;
