require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const { testEmailConnection } = require('/emailService');
const { setupCronJobs } = require('/cronJobs');

// Import routes
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 5000;

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