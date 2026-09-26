import express from 'express';
import {
  handleSendOtp,
  handleVerifyOtp,
  handleResetPassword,
  handleSignUp,
  handleSignIn,
  handleGetMe,
  handleUpdateMe,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Account
router.post('/signup', handleSignUp);
router.post('/login', handleSignIn);
router.get('/me', requireAuth, handleGetMe);
router.put('/me', requireAuth, handleUpdateMe);

// OTP password reset: send code → verify code → set new password
router.post('/send-otp', handleSendOtp);
router.post('/verify-otp', handleVerifyOtp);
router.post('/reset-password', handleResetPassword);

export default router;
