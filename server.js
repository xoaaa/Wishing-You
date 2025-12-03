require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const { testEmailConnection } = require('./utils/emailService');
const { setupCronJobs } = require('./utils/cronJobs');

// Import routes
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure JWT secret exists in development; warn if missing
if (!process.env.JWT_SECRET) {
  // For development convenience create a temporary secret and warn the developer
  process.env.JWT_SECRET = 'dev-secret-please-change';
  console.warn('⚠️  Warning: JWT_SECRET is not set. Using a temporary development secret.\n⚠️  Set JWT_SECRET in your .env for production.');
}

// Simple CORS middleware to allow cross-origin requests during development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    return res.sendStatus(200);
  }
  next();
});

// Connect to Database
connectDB();

// Test Email Connection
testEmailConnection();

// Setup Cron Jobs (Birthday Email Scheduler)
setupCronJobs();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (Frontend)
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Wishing You API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║                                        ║
║     🎂 WISHING YOU SERVER STARTED 🎂   ║
║                                        ║
║     Server: http://localhost:${PORT}      ║
║     Status: ✅ Running                  ║
║                                        ║
╚════════════════════════════════════════╝
  `);
});