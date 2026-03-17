// ============================================
// GLOBAL ERROR HANDLER MIDDLEWARE
// ============================================
import ErrorResponse from '../utils/ErrorResponse.js';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for developer
  if (process.env.NODE_ENV === 'development') {
    console.log('─'.repeat(50).red);
    console.log(`❌ Error: ${err.message}`.red.bold);
    console.log(`   Stack: ${err.stack}`.red);
    console.log('─'.repeat(50).red);
  }

  // ──────────────────────────────────────────
  // Mongoose Bad ObjectId (CastError)
  // ──────────────────────────────────────────
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // ──────────────────────────────────────────
  // Mongoose Duplicate Key Error (11000)
  // ──────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate value entered for '${field}': '${value}'. Please use another value.`;
    error = new ErrorResponse(message, 400);
  }

  // ──────────────────────────────────────────
  // Mongoose Validation Error
  // ──────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    const message = `Validation Error: ${messages.join('. ')}`;
    error = new ErrorResponse(message, 400);
  }

  // ──────────────────────────────────────────
  // JWT Errors
  // ──────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = new ErrorResponse(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired. Please log in again.';
    error = new ErrorResponse(message, 401);
  }

  // ──────────────────────────────────────────
  // Multer Errors (File Upload)
  // ──────────────────────────────────────────
  if (err.name === 'MulterError') {
    let message = 'File upload error.';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large. Maximum size allowed is 5MB.';
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files. Maximum 5 files allowed.';
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field.';
    }
    error = new ErrorResponse(message, 400);
  }

  // ──────────────────────────────────────────
  // Send Error Response
  // ──────────────────────────────────────────
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      originalError: err.message,
    }),
  });
};

export default errorHandler;