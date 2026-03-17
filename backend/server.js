// ============================================
// SERVER ENTRY POINT
// ============================================
import dotenv from 'dotenv';
import colors from 'colors';

// Load environment variables FIRST
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';

// ──────────────────────────────────────────────
// Connect to Database
// ──────────────────────────────────────────────
connectDB();

// ──────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  // Beautiful server start log
  logger.server(PORT, ENV);
});

// ──────────────────────────────────────────────
// Handle Unhandled Promise Rejections
// ──────────────────────────────────────────────
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Unhandled Rejection: ${err.message}`.red.bold);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// ──────────────────────────────────────────────
// Handle Uncaught Exceptions
// ──────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.log(`❌ Uncaught Exception: ${err.message}`.red.bold);
  console.log(err.stack);
  process.exit(1);
});

// ──────────────────────────────────────────────
// Graceful Shutdown (SIGTERM)
// ──────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...'.yellow);
  server.close(() => {
    console.log('🔌 Process terminated'.yellow);
  });
});

export default server;