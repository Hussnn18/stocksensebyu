import express from 'express';
import {
  handleListLocations,
  handleCreateLocation,
  handleUpdateLocation,
} from '../controllers/locationsController.js';
import { requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = express.Router();

router.get('/', asyncHandler(handleListLocations));
router.post('/', requireRole('manager'), asyncHandler(handleCreateLocation));
router.put('/:id', requireRole('manager'), asyncHandler(handleUpdateLocation));

export default router;
