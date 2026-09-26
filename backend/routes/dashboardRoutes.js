import express from 'express';
import { handleGetKpis, handleGetCalendar } from '../controllers/dashboardController.js';
import { asyncHandler } from '../utils/http.js';

const router = express.Router();

router.get('/kpis', asyncHandler(handleGetKpis));
router.get('/calendar', asyncHandler(handleGetCalendar));

export default router;
