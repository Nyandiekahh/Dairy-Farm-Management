const app = require('./app');
const { admin } = require('./config/firebase');

const PORT = process.env.PORT || 3001;

// Graceful shutdown function
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed.');
    
    // Close Firebase connection
    admin.app().delete().then(() => {
      console.log('Firebase connection closed.');
      process.exit(0);
    }).catch((error) => {
      console.error('Error closing Firebase connection:', error);
      process.exit(1);
    });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Dairy Farm Management API Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n📋 Available API Endpoints:`);
    console.log(`   Auth: http://localhost:${PORT}/api/auth`);
    console.log(`   Users: http://localhost:${PORT}/api/users`);
    console.log(`   Farms: http://localhost:${PORT}/api/farms`);
    console.log(`   Cows: http://localhost:${PORT}/api/cows`);
    console.log(`   Milk: http://localhost:${PORT}/api/milk`);
    console.log(`   Feeds: http://localhost:${PORT}/api/feeds`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Chicken: http://localhost:${PORT}/api/chicken`);
    console.log(`   Stats: http://localhost:${PORT}/api/stats`);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;