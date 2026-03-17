// ============================================
// CUSTOM LOGGER UTILITY
// ============================================
import colors from 'colors';

const logger = {
  // Info log
  info: (message) => {
    console.log(`ℹ️  [INFO] ${new Date().toISOString()} - ${message}`.blue);
  },

  // Success log
  success: (message) => {
    console.log(`✅ [SUCCESS] ${new Date().toISOString()} - ${message}`.green);
  },

  // Warning log
  warn: (message) => {
    console.log(`⚠️  [WARN] ${new Date().toISOString()} - ${message}`.yellow);
  },

  // Error log
  error: (message) => {
    console.log(`❌ [ERROR] ${new Date().toISOString()} - ${message}`.red);
  },

  // Request log
  request: (req) => {
    console.log(
      `📨 [${req.method}] ${req.originalUrl} - ${req.ip}`.magenta
    );
  },

  // Database log
  db: (message) => {
    console.log(`🗄️  [DB] ${new Date().toISOString()} - ${message}`.cyan);
  },

  // Server start log
  server: (port, env) => {
    console.log('');
    console.log('═'.repeat(55).cyan);
    console.log(`  🚀 Server running on port ${port}`.cyan.bold);
    console.log(`  🌍 Environment: ${env}`.cyan);
    console.log(`  📡 API URL: http://localhost:${port}/api/v1`.cyan);
    console.log(`  📋 Health: http://localhost:${port}/api/v1/health`.cyan);
    console.log('═'.repeat(55).cyan);
    console.log('');
  },
};

export default logger;