import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import { checkDbConnection } from './config/db.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is missing in backend/.env. Generate one with:');
  console.error(`   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5001;

// CLIENT_URL can hold several comma-separated origins (e.g. local + deployed frontend)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);
if (allowedOrigins.includes('http://localhost:5173')) allowedOrigins.push('http://127.0.0.1:5173');

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'StockSense IMS API', timestamp: new Date().toISOString() });
});

// Unknown API route
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `No API route for ${req.method} ${req.originalUrl}` });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 StockSense IMS Backend running at http://localhost:${PORT}`);
  try {
    await checkDbConnection();
    console.log(`🗄️  Connected to MySQL database "${process.env.DB_NAME || 'stocksense'}"`);
  } catch (err) {
    console.error(`❌ Could not connect to MySQL: ${err.message}`);
    console.error('   Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in backend/.env and that database/schema.sql has been run.');
  }
});
