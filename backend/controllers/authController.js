import { sendOtpEmail, sendWelcomeEmail } from '../config/mailer.js';

// In-Memory store for OTPs (with 10-minute expiration)
const otpStore = new Map();

/**
 * Send OTP for Login / Password Reset
 */
export async function handleSendOtp(req, res) {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address is required.' });
    }

    // Generate secure 6-digit random code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save to store
    otpStore.set(email.toLowerCase(), { otp, expiresAt });

    // Send email via Nodemailer
    const result = await sendOtpEmail(email, otp);

    console.log(`✅ [Nodemailer] OTP ${otp} generated and sent to: ${email}`);

    return res.status(200).json({
      success: true,
      message: `OTP verification code sent to ${email}`,
      previewUrl: result.previewUrl || null,
      demoCode: (!process.env.SMTP_USER && process.env.NODE_ENV === 'development') ? otp : undefined,
    });
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email. Please try again.',
      error: error.message,
    });
  }
}

/**
 * Verify Submitted OTP
 */
export async function handleVerifyOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
    }

    const record = otpStore.get(email.toLowerCase());

    if (!record) {
      return res.status(400).json({ success: false, message: 'No active OTP found. Please request a new code.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid verification code. Please check and try again.' });
    }

    // Mark as verified
    otpStore.delete(email.toLowerCase());

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
    });
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    return res.status(500).json({ success: false, message: 'Verification error.', error: error.message });
  }
}

/**
 * User Sign Up + Welcome Email
 */
export async function handleSignUp(req, res) {
  try {
    const { name, email, role, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Send Welcome Email asynchronously via Nodemailer
    try {
      await sendWelcomeEmail(email, name || 'Team Member', role || 'manager');
      console.log(`✅ [Nodemailer] Welcome email sent to: ${email}`);
    } catch (mailErr) {
      console.warn('⚠️ Could not send welcome email:', mailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: 'u-' + Date.now(),
        name: name || 'Warehouse Lead',
        email,
        role: role || 'inventory_manager',
      },
    });
  } catch (error) {
    console.error('❌ Error in signup:', error);
    return res.status(500).json({ success: false, message: 'Signup failed.', error: error.message });
  }
}
