// ============================================
// AUTHENTICATION ROUTES
// ============================================
import express from 'express';
import passport from 'passport';

// Controller imports
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  changePassword,
  googleAuthCallback,
  refreshToken,
} from '../controllers/authController.js';

// Middleware imports
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} from '../middleware/validator.js';

const router = express.Router();

// ══════════════════════════════════════════════
// PUBLIC ROUTES (Login required නැහැ)
// ══════════════════════════════════════════════

// ── Register ──
// POST /api/v1/auth/register
router.post('/register', authLimiter, registerValidation, register);

// ── Login ──
// POST /api/v1/auth/login
router.post('/login', authLimiter, loginValidation, login);

// ── Forgot Password ──
// POST /api/v1/auth/forgot-password
router.post('/forgot-password', authLimiter, forgotPasswordValidation, forgotPassword);

// ── Reset Password ──
// PUT /api/v1/auth/reset-password/:token
router.put('/reset-password/:token', resetPasswordValidation, resetPassword);

// ── Verify Email ──
// GET /api/v1/auth/verify-email/:token
router.get('/verify-email/:token', verifyEmail);

// ══════════════════════════════════════════════
// GOOGLE OAUTH ROUTES
// ══════════════════════════════════════════════

// ── Google Login Redirect ──
// GET /api/v1/auth/google
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// ── Google Callback ──
// GET /api/v1/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=Google authentication failed`,
  }),
  googleAuthCallback
);

// ══════════════════════════════════════════════
// PRIVATE ROUTES (Login required)
// ══════════════════════════════════════════════

// ── Get Current User ──
// GET /api/v1/auth/me
router.get('/me', protect, getMe);

// ── Logout ──
// POST /api/v1/auth/logout
router.post('/logout', protect, logout);

// ── Change Password ──
// PUT /api/v1/auth/change-password
router.put('/change-password', protect, changePasswordValidation, changePassword);

// ── Refresh Token ──
// POST /api/v1/auth/refresh-token
router.post('/refresh-token', protect, refreshToken);

export default router;