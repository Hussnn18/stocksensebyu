import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { sendOtpEmail, sendWelcomeEmail } from '../config/mailer.js';

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_SECONDS = 60;
const MIN_PASSWORD_LENGTH = 8;
const isDev = process.env.NODE_ENV !== 'production';

// Frontend role values → users.role ENUM('manager','staff') in database/schema.sql
const ROLE_MAP = {
  manager: 'manager',
  inventory_manager: 'manager',
  staff: 'staff',
  warehouse_staff: 'staff',
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

function signLoginToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

/**
 * POST /api/auth/signup  { name, email, role, password }
 */
export async function handleSignUp(req, res) {
  try {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const role = ROLE_MAP[req.body.role];

    if (!name || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Enter your name and a valid email address.' });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ success: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    }
    if (!role) {
      return res.status(400).json({ success: false, message: 'Choose a role: Inventory Manager or Warehouse Staff.' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Log in or reset your password.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, role]
    );

    // The welcome email is a nice-to-have: signup still succeeds if it fails
    sendWelcomeEmail(email, name, role)
      .then(() => console.log(`✅ [Nodemailer] Welcome email sent to: ${email}`))
      .catch((err) => console.warn('⚠️ Could not send welcome email:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Account created. Log in with your email and password.',
      user: { id: result.insertId, name, email, role },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Log in or reset your password.' });
    }
    console.error('❌ Error in signup:', error);
    return res.status(500).json({ success: false, message: 'Could not create the account. Please try again.' });
  }
}

/**
 * POST /api/auth/login  { email, password }  →  { token, user }
 */
export async function handleSignIn(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, role, password_hash FROM users WHERE email = ?',
      [email]
    );
    const user = rows[0];
    const passwordOk = user ? await bcrypt.compare(password, user.password_hash) : false;

    // Same message for "no such user" and "wrong password" so emails can't be guessed
    if (!passwordOk) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token: signLoginToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error('❌ Error in login:', error);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
}

/**
 * GET /api/auth/me  (requires Bearer token)  →  { user }
 */
export async function handleGetMe(req, res) {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Your account no longer exists. Please sign up again.' });
    }
    return res.status(200).json({ success: true, user: publicUser(rows[0]) });
  } catch (error) {
    console.error('❌ Error loading profile:', error);
    return res.status(500).json({ success: false, message: 'Could not load your profile.' });
  }
}

/**
 * PUT /api/auth/me  { name }  (requires Bearer token)  →  { user }
 */
export async function handleUpdateMe(req, res) {
  try {
    const name = String(req.body.name || '').trim();
    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Enter your name (2 to 100 characters).',
        fields: { name: 'Use 2 to 100 characters.' },
      });
    }

    await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
    const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Your account no longer exists. Please sign up again.' });
    }
    return res.status(200).json({ success: true, message: 'Your name has been updated.', user: publicUser(rows[0]) });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    return res.status(500).json({ success: false, message: 'Could not update your profile. Please try again.' });
  }
}

/**
 * Password reset step 1 — POST /api/auth/send-otp  { email }
 * Emails a 6-digit code. The code is stored hashed in password_otps.
 */
export async function handleSendOtp(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    }

    // Same reply whether or not the account exists, so emails can't be guessed
    const genericMessage = `If an account exists for ${email}, a 6-digit code has been sent. Check your inbox and spam folder.`;

    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!users.length) {
      return res.status(200).json({ success: true, message: genericMessage });
    }
    const userId = users[0].id;

    const [[recent]] = await pool.query(
      'SELECT COUNT(*) AS n FROM password_otps WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)',
      [userId, OTP_RESEND_SECONDS]
    );
    if (recent.n > 0) {
      return res.status(429).json({ success: false, message: 'A code was just sent. Wait a minute before requesting another.' });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // Only the newest code works: retire any earlier unused ones
    await pool.query('UPDATE password_otps SET used = 1 WHERE user_id = ? AND used = 0', [userId]);
    await pool.query(
      'INSERT INTO password_otps (user_id, otp_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))',
      [userId, otpHash, OTP_EXPIRY_MINUTES]
    );

    const result = await sendOtpEmail(email, otp);
    if (isDev) console.log(`🔐 [dev] OTP for ${email}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: genericMessage,
      previewUrl: result.previewUrl || null,
      // Only when no real SMTP is configured in development, so the flow can be tested
      demoCode: isDev && !process.env.SMTP_USER ? otp : undefined,
    });
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return res.status(500).json({ success: false, message: 'Could not send the verification email. Please try again.' });
  }
}

/**
 * Password reset step 2 — POST /api/auth/verify-otp  { email, otp }  →  { resetToken }
 */
export async function handleVerifyOtp(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();

    if (!isValidEmail(email) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Enter your email and the 6-digit code.' });
    }

    const [rows] = await pool.query(
      `SELECT o.id, o.user_id, o.otp_hash, o.attempts
         FROM password_otps o
         JOIN users u ON u.id = o.user_id
        WHERE u.email = ? AND o.used = 0 AND o.expires_at > NOW()
        ORDER BY o.id DESC
        LIMIT 1`,
      [email]
    );
    const record = rows[0];

    if (!record) {
      return res.status(400).json({ success: false, message: 'This code has expired or was already used. Request a new code.' });
    }
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ success: false, message: 'Too many wrong attempts. Request a new code.' });
    }

    const otpOk = await bcrypt.compare(otp, record.otp_hash);
    if (!otpOk) {
      await pool.query('UPDATE password_otps SET attempts = attempts + 1 WHERE id = ?', [record.id]);
      const left = OTP_MAX_ATTEMPTS - record.attempts - 1;
      return res.status(400).json({
        success: false,
        message: left > 0 ? `Wrong code. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Too many wrong attempts. Request a new code.',
      });
    }

    // Short-lived token that only allows setting a new password (not logging in)
    const resetToken = jwt.sign(
      { sub: String(record.user_id), otpId: record.id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: `${OTP_EXPIRY_MINUTES}m` }
    );

    return res.status(200).json({ success: true, message: 'Code verified. Choose a new password.', resetToken });
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    return res.status(500).json({ success: false, message: 'Could not verify the code. Please try again.' });
  }
}

/**
 * Password reset step 3 — POST /api/auth/reset-password  { resetToken, password }
 */
export async function handleResetPassword(req, res) {
  const password = String(req.body.password || '');
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ success: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
  }

  let payload;
  try {
    payload = jwt.verify(String(req.body.resetToken || ''), process.env.JWT_SECRET);
  } catch {
    return res.status(400).json({ success: false, message: 'This reset session has expired. Request a new code.' });
  }
  if (payload.purpose !== 'password_reset') {
    return res.status(400).json({ success: false, message: 'Invalid reset request. Request a new code.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock the code row so it can only be used once, even with two clicks
    const [rows] = await conn.query(
      'SELECT id FROM password_otps WHERE id = ? AND user_id = ? AND used = 0 FOR UPDATE',
      [payload.otpId, payload.sub]
    );
    if (!rows.length) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'This code was already used. Request a new code.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await conn.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, payload.sub]);
    await conn.query('UPDATE password_otps SET used = 1 WHERE id = ?', [payload.otpId]);
    await conn.commit();

    return res.status(200).json({ success: true, message: 'Password updated. Log in with your new password.' });
  } catch (error) {
    await conn.rollback();
    console.error('❌ Error resetting password:', error);
    return res.status(500).json({ success: false, message: 'Could not update the password. Please try again.' });
  } finally {
    conn.release();
  }
}
