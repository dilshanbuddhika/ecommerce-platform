// ============================================
// CUSTOM ERROR RESPONSE CLASS
// ============================================

class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Stack trace capture
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorResponse;