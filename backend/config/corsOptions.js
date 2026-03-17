// ============================================
// CORS CONFIGURATION
// ============================================

// Allowed origins list
const allowedOrigins = [
  'http://localhost:5173',       // Vite React dev server
  'http://localhost:3000',       // React dev server (CRA)
  'http://localhost:5000',       // Backend itself
  process.env.CLIENT_URL,       // Production frontend URL
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('🚫 Not allowed by CORS'));
    }
  },
  credentials: true,              // Cookies allow කරන්න
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Total-Count'],  // Pagination headers
  maxAge: 86400,                       // Preflight cache 24 hours
  optionsSuccessStatus: 200,
};

export default corsOptions;