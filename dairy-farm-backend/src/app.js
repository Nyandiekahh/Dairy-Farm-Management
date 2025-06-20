const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const farmRoutes = require('./routes/farms');
const cowRoutes = require('./routes/cows');
const milkRoutes = require('./routes/milk');
const feedRoutes = require('./routes/feeds');
const healthRoutes = require('./routes/health');
const chickenRoutes = require('./routes/chicken');
const statsRoutes = require('./routes/stats');

// Debug: Check which routes are undefined
console.log('authRoutes:', authRoutes);
console.log('userRoutes:', userRoutes);
console.log('farmRoutes:', farmRoutes);
console.log('cowRoutes:', cowRoutes);
console.log('milkRoutes:', milkRoutes);
console.log('feedRoutes:', feedRoutes);
console.log('healthRoutes:', healthRoutes);
console.log('chickenRoutes:', chickenRoutes);
console.log('statsRoutes:', statsRoutes);

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Compression
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dairy Farm Management API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes with debugging - Register one by one to find the problematic route
try {
  console.log('🔄 Registering auth routes...');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes registered successfully');
  
  console.log('🔄 Registering user routes...');
  app.use('/api/users', userRoutes);
  console.log('✅ User routes registered successfully');
  
  console.log('🔄 Registering farm routes...');
  app.use('/api/farms', farmRoutes);
  console.log('✅ Farm routes registered successfully');
  
  console.log('🔄 Registering cow routes...');
  app.use('/api/cows', cowRoutes);
  console.log('✅ Cow routes registered successfully');
  
  console.log('🔄 Registering milk routes...');
  app.use('/api/milk', milkRoutes);
  console.log('✅ Milk routes registered successfully');
  
  console.log('🔄 Registering feed routes...');
  app.use('/api/feeds', feedRoutes);
  console.log('✅ Feed routes registered successfully');
  
  console.log('🔄 Registering health routes...');
  app.use('/api/health', healthRoutes);
  console.log('✅ Health routes registered successfully');
  
  console.log('🔄 Registering chicken routes...');
  app.use('/api/chicken', chickenRoutes);
  console.log('✅ Chicken routes registered successfully');
  
  console.log('🔄 Registering stats routes...');
  app.use('/api/stats', statsRoutes);
  console.log('✅ Stats routes registered successfully');
  
  console.log('🎉 All routes registered successfully!');
  
} catch (error) {
  console.error('❌ Error registering routes:', error);
  console.error('Stack trace:', error.stack);
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;