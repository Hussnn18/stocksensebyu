import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import operationRoutes from './routes/operationRoutes.js';
import adjustmentRoutes from './routes/adjustmentRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import reorderRuleRoutes from './routes/reorderRuleRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import moveRoutes from './routes/moveRoutes.js';
import warehouseRoutes from './routes/warehouseRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import { requireAuth } from './middleware/auth.js';
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

// Everything below needs a login token; manager-only writes are marked in each routes file
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/operations', requireAuth, operationRoutes);
app.use('/api/adjustments', requireAuth, adjustmentRoutes);
app.use('/api/products', requireAuth, productRoutes);
app.use('/api/categories', requireAuth, categoryRoutes);
app.use('/api/reorder-rules', requireAuth, reorderRuleRoutes);
app.use('/api/alerts', requireAuth, alertRoutes);
app.use('/api/moves', requireAuth, moveRoutes);
app.use('/api/warehouses', requireAuth, warehouseRoutes);
app.use('/api/locations', requireAuth, locationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'StockSense IMS API', timestamp: new Date().toISOString() });
});

// Unknown API route
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `No API route for ${req.method} ${req.originalUrl}` });
});

// Errors raised before a route runs (e.g. a malformed JSON body) still answer in JSON
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'The request body is not valid JSON.' });
  }
  console.error('❌ Unhandled error:', err);
  const status = err.status >= 400 && err.status < 500 ? err.status : 500;
  res.status(status).json({ success: false, message: status === 500 ? 'Something went wrong on the server. Please try again.' : err.message });
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
