import express from 'express';
import {
  handleListWarehouses,
  handleCreateWarehouse,
  handleUpdateWarehouse,
} from '../controllers/warehousesController.js';
import { requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = express.Router();

router.get('/', asyncHandler(handleListWarehouses));
router.post('/', requireRole('manager'), asyncHandler(handleCreateWarehouse));
router.put('/:id', requireRole('manager'), asyncHandler(handleUpdateWarehouse));

export default router;
