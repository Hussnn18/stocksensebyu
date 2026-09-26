import express from 'express';
import { handleSendOtp, handleVerifyOtp, handleSignUp, handleSignIn } from '../controllers/authController.js';

const router = express.Router();

// Routes
router.post('/send-otp', handleSendOtp);
router.post('/verify-otp', handleVerifyOtp);
router.post('/signup', handleSignUp);
router.post('/login', handleSignIn);

export default router;
