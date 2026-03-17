// ============================================
// EXPRESS APPLICATION SETUP
// ============================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

// Config imports
import corsOptions from './config/corsOptions.js';
import { generalLimiter } from './middleware/rateLimiter.js';

// Middleware imports
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';

// Initialize Express
const app = express();

// ──────────────────────────────────────────────
// 1. SECURITY MIDDLEWARE
// ──────────────────────────────────────────────

// Helmet - HTTP headers secure කරන්න
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// CORS - Cross Origin requests allow කරන්න
app.use(cors(corsOptions));

// Mongo Sanitize - NoSQL injection prevent කරන්න
// { "$gt": "" } වගේ malicious queries block කරනවා
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️  Sanitized ${key} in ${req.originalUrl}`.yellow);
  },
}));

// HPP - HTTP Parameter Pollution prevent කරන්න
app.use(hpp({
  whitelist: [
    'price',
    'rating',
    'category',
    'sort',
    'fields',
    'page',
    'limit',
  ],
}));

// Rate Limiter - API abuse prevent කරන්න
app.use('/api', generalLimiter);

// ──────────────────────────────────────────────
// 2. BODY PARSING MIDDLEWARE
// ──────────────────────────────────────────────

// JSON body parser (10kb limit)
app.use(express.json({ limit: '10kb' }));

// URL encoded data parser
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser
app.use(cookieParser());

// ──────────────────────────────────────────────
// 3. LOGGING MIDDLEWARE
// ──────────────────────────────────────────────

// Morgan HTTP request logger (development only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ──────────────────────────────────────────────
// 4. STATIC FILES
// ──────────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ──────────────────────────────────────────────
// 5. HEALTH CHECK & ROOT ROUTE
// ──────────────────────────────────────────────

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🛒 E-Commerce API is running!',
    version: '1.0.0',
    documentation: '/api/v1/docs',
    health: '/api/v1/health',
  });
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '💚 Server is healthy!',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
    environment: process.env.NODE_ENV,
    memoryUsage: {
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
    },
  });
});

// API info endpoint
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🛒 E-Commerce Platform API v1',
    endpoints: {
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        logout: 'POST /api/v1/auth/logout',
        forgotPassword: 'POST /api/v1/auth/forgot-password',
        resetPassword: 'PUT /api/v1/auth/reset-password/:token',
      },
      users: {
        getProfile: 'GET /api/v1/users/profile',
        updateProfile: 'PUT /api/v1/users/profile',
        uploadAvatar: 'PUT /api/v1/users/avatar',
      },
      products: {
        getAll: 'GET /api/v1/products',
        getOne: 'GET /api/v1/products/:id',
        create: 'POST /api/v1/products (Admin)',
        update: 'PUT /api/v1/products/:id (Admin)',
        delete: 'DELETE /api/v1/products/:id (Admin)',
      },
      cart: {
        getCart: 'GET /api/v1/cart',
        addToCart: 'POST /api/v1/cart',
        updateItem: 'PUT /api/v1/cart/:itemId',
        removeItem: 'DELETE /api/v1/cart/:itemId',
        clearCart: 'DELETE /api/v1/cart',
      },
      orders: {
        create: 'POST /api/v1/orders',
        getMyOrders: 'GET /api/v1/orders/my-orders',
        getOne: 'GET /api/v1/orders/:id',
        updateStatus: 'PUT /api/v1/orders/:id/status (Admin)',
      },
      reviews: {
        create: 'POST /api/v1/products/:productId/reviews',
        getProductReviews: 'GET /api/v1/products/:productId/reviews',
        update: 'PUT /api/v1/reviews/:id',
        delete: 'DELETE /api/v1/reviews/:id',
      },
      wishlist: {
        getWishlist: 'GET /api/v1/wishlist',
        addItem: 'POST /api/v1/wishlist',
        removeItem: 'DELETE /api/v1/wishlist/:productId',
      },
      payment: {
        createIntent: 'POST /api/v1/payment/create-intent',
        webhook: 'POST /api/v1/payment/webhook',
      },
      admin: {
        dashboard: 'GET /api/v1/admin/dashboard',
        allUsers: 'GET /api/v1/admin/users',
        allOrders: 'GET /api/v1/admin/orders',
        analytics: 'GET /api/v1/admin/analytics',
      },
    },
  });
});

// ──────────────────────────────────────────────
// 6. API ROUTES (Part 2 වලදී add කරනවා)
// ──────────────────────────────────────────────

// Routes will be added here in next parts:
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/users', userRoutes);
// app.use('/api/v1/products', productRoutes);
// app.use('/api/v1/cart', cartRoutes);
// app.use('/api/v1/orders', orderRoutes);
// app.use('/api/v1/reviews', reviewRoutes);
// app.use('/api/v1/wishlist', wishlistRoutes);
// app.use('/api/v1/payment', paymentRoutes);
// app.use('/api/v1/admin', adminRoutes);

// ──────────────────────────────────────────────
// 7. ERROR HANDLING
// ──────────────────────────────────────────────

// 404 handler - Route not found
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;