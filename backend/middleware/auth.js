// ============================================
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ============================================
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ErrorResponse from '../utils/ErrorResponse.js';

// ──────────────────────────────────────────────
// 1. PROTECT ROUTES - Login required
// ──────────────────────────────────────────────
export const protect = async (req, res, next) => {
  let token;

  try {
    // ── Token check ──
    // Option 1: Authorization Header එකෙන්
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Option 2: Cookie එකෙන්
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Token නැත්නම්
    if (!token) {
      return next(
        new ErrorResponse('🔒 Access denied. Please login first.', 401)
      );
    }

    // ── Token verify ──
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── User find ──
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(
        new ErrorResponse('🔒 User not found. Token is invalid.', 401)
      );
    }

    // ── Account active check ──
    if (!user.isActive) {
      return next(
        new ErrorResponse('🔒 Your account has been deactivated.', 401)
      );
    }

    // ── Account locked check ──
    if (user.isLocked()) {
      return next(
        new ErrorResponse(
          '🔒 Account is locked due to too many login attempts. Try again later.',
          423
        )
      );
    }

    // User object එක request එකට attach කරන්න
    req.user = user;
    next();

  } catch (error) {
    // Token expired
    if (error.name === 'TokenExpiredError') {
      return next(
        new ErrorResponse('🔒 Token expired. Please login again.', 401)
      );
    }
    // Invalid token
    if (error.name === 'JsonWebTokenError') {
      return next(
        new ErrorResponse('🔒 Invalid token. Please login again.', 401)
      );
    }
    return next(
      new ErrorResponse('🔒 Authentication failed.', 401)
    );
  }
};

// ──────────────────────────────────────────────
// 2. AUTHORIZE ROLES - Role based access
// ──────────────────────────────────────────────
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new ErrorResponse('🔒 Please login first.', 401)
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `🚫 Role '${req.user.role}' is not authorized to access this route.`,
          403
        )
      );
    }

    next();
  };
};

// ──────────────────────────────────────────────
// 3. ADMIN ONLY Middleware
// ──────────────────────────────────────────────
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return next(
      new ErrorResponse('🔒 Please login first.', 401)
    );
  }

  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse('🚫 Admin access only. You are not authorized.', 403)
    );
  }

  next();
};

// ──────────────────────────────────────────────
// 4. OPTIONAL AUTH - Login optional routes
// ──────────────────────────────────────────────
export const optionalAuth = async (req, res, next) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (error) {
    // Token invalid උනත් error throw නොකරන්න
    req.user = null;
  }

  next();
};