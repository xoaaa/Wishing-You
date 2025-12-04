require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const { testEmailConnection } = require('./utils/emailService');
const { setupCronJobs } = require('./utils/cronJobs');

// Impor routes
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const birthdayRoutes = require('./routes/birthdays');
const commentRoutes = require('./routes/comments');

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'dev-secret-please-change';
  console.warn('Warning: JWT_SECRET is not set. Using a temporary development secret.\n  Set JWT_SECRET in your .env for production.');
}

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    return res.sendStatus(200);
  }
  next();
});

connectDB();
testEmailConnection();
setupCronJobs();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static files frontend
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/birthdays', birthdayRoutes);
app.use('/api/comments', commentRoutes);

// Root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Wishing You API is running',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`
    Server started
    Server: http://localhost:${PORT}
    Status: Running
  `);
});