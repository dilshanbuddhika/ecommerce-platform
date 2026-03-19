import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import passport from 'passport';

import corsOptions from './config/corsOptions.js';
import configurePassport from './config/passport.js';
import { generalLimiter } from './middleware/rateLimiter.js';

import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors(corsOptions));

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
  whitelist: ['price', 'rating', 'category', 'sort', 'fields', 'page', 'limit'],
}));

app.use('/api', generalLimiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use(passport.initialize());
configurePassport();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/uploads', express.static('uploads'));

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
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;