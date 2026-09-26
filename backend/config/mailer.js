import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object
let transporter;

const createTransporter = async () => {
  // If SMTP user is provided in .env, use standard SMTP transport
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('📧 Nodemailer: Configured with custom SMTP server.');
  } else {
    // Generate test SMTP service account from Ethereal for instant zero-config testing
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('📧 Nodemailer: Using Ethereal Test Account (Zero-config mode).');
      console.log(`📧 Test Account User: ${testAccount.user}`);
    } catch (err) {
      // Fallback in-memory logger transport
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      console.log('📧 Nodemailer: Initialized in JSON logger mode.');
    }
  }
};

// Start once at import; every send waits for the same setup instead of creating a second transporter
const transporterReady = createTransporter();
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 10;

/**
 * Send OTP Verification Email
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit OTP code
 */
export async function sendOtpEmail(to, otp) {
  await transporterReady;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"StockSense IMS" <no-reply@stocksense.app>',
    to: to,
    subject: `Your StockSense Verification Code: ${otp}`,
    text: `Your StockSense verification code is: ${otp}. This code is valid for ${OTP_EXPIRY_MINUTES} minutes.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
          .container { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #0f172a; padding: 32px 24px; text-align: center; }
          .logo-text { font-family: cursive, sans-serif; font-size: 26px; font-weight: bold; color: #ffffff; }
          .logo-accent { color: #3b82f6; }
          .body { padding: 36px 32px; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
          .text { font-size: 14px; line-height: 1.6; color: #64748b; margin-bottom: 24px; }
          .otp-box { background: #eff6ff; border: 2px dashed #93c5fd; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px; }
          .otp-code { font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; }
          .expiry { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 8px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-text">Stock<span class="logo-accent">Sense</span></div>
          </div>
          <div class="body">
            <div class="title">Verify Your Identity</div>
            <p class="text">
              We received a request to access your StockSense Modular Inventory System account. Use the one-time verification code below to proceed:
            </p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="expiry">Expires in ${OTP_EXPIRY_MINUTES} minutes • Do not share this code with anyone</div>
            </div>
            <p class="text" style="font-size: 12px; margin-bottom: 0;">
              If you didn't request this code, you can safely ignore this email. Your account remains secure.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} StockSense IMS. Modular Inventory & Warehouse Intelligence.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  
  // Log URL for ethereal preview if available
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`🔗 Ethereal Email Preview URL: ${previewUrl}`);
  }

  return { info, previewUrl };
}

/**
 * Send Welcome Email
 * @param {string} to - Recipient email
 * @param {string} name - User full name
 * @param {string} role - User role (inventory_manager | warehouse_staff)
 */
export async function sendWelcomeEmail(to, name, role) {
  await transporterReady;

  const roleTitle = role === 'manager' || role === 'inventory_manager' 
    ? 'Inventory Manager' 
    : 'Warehouse Floor Staff';

  const mailOptions = {
    from: process.env.SMTP_FROM || '"StockSense IMS" <no-reply@stocksense.app>',
    to: to,
    subject: `Welcome to StockSense IMS, ${name}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; background-color: #f8fafc; padding: 20px;">
        <div style="max-width: 500px; margin: auto; background: white; border-radius: 16px; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; margin-top: 0;">Welcome to StockSense, ${name}!</h2>
          <p style="color: #64748b; font-size: 14px;">Your account is ready as <strong>${roleTitle}</strong>.</p>
          <p style="color: #64748b; font-size: 14px;">You can now manage receipts, delivery dispatches, internal rack transfers, and real-time ledger accounting.</p>
          <div style="margin-top: 25px; text-align: center;">
            <a href="${(process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim()}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 13px;">Launch Inventory Dashboard</a>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return await transporter.sendMail(mailOptions);
}
