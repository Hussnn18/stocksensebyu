import express from 'express';
import { handleSendOtp, handleVerifyOtp, handleSignUp } from '../controllers/authController.js';

const router = express.Router();

// Routes
router.post('/send-otp', handleSendOtp);
router.post('/verify-otp', handleVerifyOtp);
router.post('/signup', handleSignUp);

export default router;
