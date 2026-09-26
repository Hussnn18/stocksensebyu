import express from 'express';
import { handleLowStock } from '../controllers/alertsController.js';
import { asyncHandler } from '../utils/http.js';

const router = express.Router();

router.get('/low-stock', asyncHandler(handleLowStock));

export default router;
