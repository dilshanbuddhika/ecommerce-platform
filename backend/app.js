// ============================================
// EXPRESS APPLICATION SETUP
// ============================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import passport from 'passport';

// Config imports
import corsOptions from './config/corsOptions.js';
import configurePassport from './config/passport.js';
import { generalLimiter } from './middleware/rateLimiter.js';

// Middleware imports
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Initialize Express
const app = express();

// ──────────────────────────────────────────────
// 1. SECURITY MIDDLEWARE
// ──────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors(corsOptions));

// Custom NoSQL Injection Protection
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      }
    }
    return obj;
  };

  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);

  next();
});

app.use(hpp({
  whitelist: [
    'price', 'rating', 'category', 'sort', 'fields', 'page', 'limit',
  ],
}));

app.use('/api', generalLimiter);

// ──────────────────────────────────────────────
// 2. BODY PARSING MIDDLEWARE
// ──────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ──────────────────────────────────────────────
// 3. PASSPORT MIDDLEWARE
// ──────────────────────────────────────────────
app.use(passport.initialize());
configurePassport();

// ──────────────────────────────────────────────
// 4. LOGGING MIDDLEWARE
// ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ──────────────────────────────────────────────
// 5. STATIC FILES
// ──────────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ──────────────────────────────────────────────
// 6. ROUTES
// ──────────────────────────────────────────────

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🛒 E-Commerce API is running!',
    version: '1.0.0',
  });
});

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '💚 Server is healthy!',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// ──────────────────────────────────────────────
// 7. ERROR HANDLING
// ──────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;