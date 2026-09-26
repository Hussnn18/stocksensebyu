import express from 'express';
import {
  handleListProducts,
  handleGetProduct,
  handleCreateProduct,
  handleUpdateProduct,
} from '../controllers/productsController.js';
import { requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = express.Router();

// Everyone can look products up; only managers change the catalogue
router.get('/', asyncHandler(handleListProducts));
router.get('/:id', asyncHandler(handleGetProduct));
router.post('/', requireRole('manager'), asyncHandler(handleCreateProduct));
router.put('/:id', requireRole('manager'), asyncHandler(handleUpdateProduct));

export default router;
