// ============================================
// RATE LIMITER MIDDLEWARE
// ============================================
import rateLimit from 'express-rate-limit';

// ──────────────────────────────────────────
// General API Rate Limiter
// 15 minutes window එකේ requests 100 ක් වෙනකන්
// ──────────────────────────────────────────
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 100,                    // 100 requests per window
  message: {
    success: false,
    error: '⚠️ Too many requests from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,       // `RateLimit-*` headers return කරන්න
  legacyHeaders: false,        // `X-RateLimit-*` headers disable කරන්න
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

// ──────────────────────────────────────────
// Auth Routes Rate Limiter (Strict)
// Login/Register attempts limit කරන්න
// ──────────────────────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,                     // 10 attempts per window
  message: {
    success: false,
    error: '⚠️ Too many login/register attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,  // Successful requests count නොකරන්න
});

// ──────────────────────────────────────────
// Payment Rate Limiter (Very Strict)
// ──────────────────────────────────────────
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 10,                     // 10 payment attempts per hour
  message: {
    success: false,
    error: '⚠️ Too many payment attempts. Please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});