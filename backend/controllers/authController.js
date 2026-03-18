// ============================================
// AUTHENTICATION CONTROLLER
// ============================================
import crypto from 'crypto';
import User from '../models/User.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import sendTokenResponse from '../utils/generateToken.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/sendEmail.js';

// ══════════════════════════════════════════════
// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
// ══════════════════════════════════════════════
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // ── Check if email already exists ──
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return next(
        new ErrorResponse('Email already registered. Please login or use another email.', 400)
      );
    }

    // ── Create new user ──
    const user = await User.create({
      name,
      email,
      password,
      authProvider: 'local',
    });

    // ── Generate email verification token ──
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // ── Send welcome email (optional - comment out if no SMTP) ──
    try {
      await sendWelcomeEmail(user);
      console.log(`📧 Welcome email sent to ${user.email}`.green);
    } catch (emailError) {
      console.log(`⚠️ Welcome email failed: ${emailError.message}`.yellow);
      // Email fail උනත් registration success
    }

    // ── Send token response ──
    sendTokenResponse(user, 201, res, '🎉 Registration successful!');

  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
// ══════════════════════════════════════════════
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ── Find user with password field ──
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return next(
        new ErrorResponse('Invalid email or password.', 401)
      );
    }

    // ── Check if account is locked ──
    if (user.isLocked()) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      return next(
        new ErrorResponse(
          `Account is locked. Try again in ${lockTime} minutes.`,
          423
        )
      );
    }

    // ── Check if account is active ──
    if (!user.isActive) {
      return next(
        new ErrorResponse('Your account has been deactivated. Contact support.', 403)
      );
    }

    // ── Check if user registered with Google ──
    if (user.authProvider === 'google' && !user.password) {
      return next(
        new ErrorResponse('This account uses Google login. Please sign in with Google.', 400)
      );
    }

    // ── Compare password ──
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      // Failed login attempt increment
      await user.incrementLoginAttempts();

      const remainingAttempts = 5 - (user.loginAttempts + 1);

      if (remainingAttempts <= 0) {
        return next(
          new ErrorResponse('Account locked due to too many failed attempts. Try again in 30 minutes.', 423)
        );
      }

      return next(
        new ErrorResponse(
          `Invalid email or password. ${remainingAttempts} attempts remaining.`,
          401
        )
      );
    }

    // ── Login success - Reset attempts ──
    await user.resetLoginAttempts();

    // ── Send token response ──
    sendTokenResponse(user, 200, res, '✅ Login successful!');

  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Logout user (clear cookie)
// @route   POST /api/v1/auth/logout
// @access  Private
// ══════════════════════════════════════════════
export const logout = async (req, res, next) => {
  try {
    // Cookie clear කරන්න
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 5 * 1000), // 5 seconds වලින් expire
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      success: true,
      message: '👋 Logged out successfully!',
      token: null,
    });

  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
// ══════════════════════════════════════════════
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ErrorResponse('User not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: '✅ User profile fetched successfully!',
      user,
    });

  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Forgot password - Send reset email
// @route   POST /api/v1/auth/forgot-password
// @access  Public
// ══════════════════════════════════════════════
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // ── Find user ──
    const user = await User.findByEmail(email);

    if (!user) {
      return next(
        new ErrorResponse('No account found with that email address.', 404)
      );
    }

    // ── Check if Google account ──
    if (user.authProvider === 'google') {
      return next(
        new ErrorResponse('This account uses Google login. Password reset is not available.', 400)
      );
    }

    // ── Generate reset token ──
    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // ── Create reset URL ──
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // ── Send email ──
    try {
      await sendPasswordResetEmail(user, resetUrl);

      res.status(200).json({
        success: true,
        message: '📧 Password reset email sent! Check your inbox.',
      });

    } catch (emailError) {
      // Email fail උනානම් token clear කරන්න
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error(`❌ Email send failed: ${emailError.message}`.red);

      return next(
        new ErrorResponse('Email could not be sent. Please try again later.', 500)
      );
    }

  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Reset password
// @route   PUT /api/v1/auth/reset-password/:token
// @access  Public
// ══════════════════════════════════════════════
export const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    // ── Hash the token from URL ──
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // ── Find user with valid token ──
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }, // Token expire වෙලා නැද්ද check
    });

    if (!user) {
      return next(
        new ErrorResponse('Invalid or expired reset token. Please request a new one.', 400)
      );
    }

    // ── Set new password ──
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // ── Send token response (auto login) ──
    sendTokenResponse(user, 200, res, '🔑 Password reset successful!');

  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Verify email
// @route   GET /api/v1/auth/verify-email/:token
// @access  Public
// ══════════════════════════════════════════════
export const verifyEmail = async (req, res, next) => {
  try {
    // ── Hash the token ──
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // ── Find user ──
    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new ErrorResponse('Invalid or expired verification token.', 400)
      );
    }

    // ── Verify email ──
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: '✅ Email verified successfully!',
    });

  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Change password (logged in user)
// @route   PUT /api/v1/auth/change-password
// @access  Private
// ══════════════════════════════════════════════
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // ── Find user with password ──
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return next(new ErrorResponse('User not found.', 404));
    }

    // ── Check Google account ──
    if (user.authProvider === 'google' && !user.password) {
      return next(
        new ErrorResponse('Google accounts cannot change password here.', 400)
      );
    }

    // ── Check current password ──
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return next(new ErrorResponse('Current password is incorrect.', 401));
    }

    // ── Set new password ──
    user.password = newPassword;
    await user.save();

    // ── Send new token ──
    sendTokenResponse(user, 200, res, '🔑 Password changed successfully!');

  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Google OAuth Callback Handler
// @route   GET /api/v1/auth/google/callback
// @access  Public
// ══════════════════════════════════════════════
export const googleAuthCallback = async (req, res, next) => {
  try {
    // Passport මගින් req.user එකට user data එනවා
    const user = req.user;

    if (!user) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=Google authentication failed`
      );
    }

    // ── Generate token ──
    const token = user.generateAuthToken();

    // ── Set cookie ──
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };

    res.cookie('token', token, cookieOptions);

    // ── Redirect to frontend with token ──
    res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);

  } catch (error) {
    console.error(`❌ Google Auth Error: ${error.message}`.red);
    res.redirect(
      `${process.env.CLIENT_URL}/login?error=Authentication failed`
    );
  }
};

// ══════════════════════════════════════════════
// @desc    Refresh token
// @route   POST /api/v1/auth/refresh-token
// @access  Private
// ══════════════════════════════════════════════
export const refreshToken = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ErrorResponse('User not found.', 404));
    }

    sendTokenResponse(user, 200, res, '🔄 Token refreshed successfully!');

  } catch (error) {
    next(error);
  }
};