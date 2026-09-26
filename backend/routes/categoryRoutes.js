import express from 'express';
import {
  handleListCategories,
  handleCreateCategory,
  handleUpdateCategory,
  handleDeleteCategory,
} from '../controllers/categoriesController.js';
import { requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = express.Router();

router.get('/', asyncHandler(handleListCategories));
router.post('/', requireRole('manager'), asyncHandler(handleCreateCategory));
router.put('/:id', requireRole('manager'), asyncHandler(handleUpdateCategory));
router.delete('/:id', requireRole('manager'), asyncHandler(handleDeleteCategory));

export default router;
