// ============================================
// JWT TOKEN GENERATION & COOKIE SETTING
// ============================================

// ──────────────────────────────────────
// Token Generate කරලා Cookie එකේ set කරන්න
// ──────────────────────────────────────
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  // JWT token generate
  const token = user.generateAuthToken();

  // Cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,        // JavaScript වලින් access කරන්න බැහැ (XSS prevent)
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    sameSite: 'strict',    // CSRF prevent
    path: '/',
  };

  // User data (password ඉවත් කරලා)
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    isEmailVerified: user.isEmailVerified,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
  };

  // Response send with cookie
  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      user: userData,
    });
};

export default sendTokenResponse;