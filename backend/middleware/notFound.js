// ============================================
// 404 NOT FOUND MIDDLEWARE
// ============================================

const notFound = (req, res, next) => {
  const message = `🔍 Route not found - ${req.method} ${req.originalUrl}`;

  res.status(404).json({
    success: false,
    error: message,
    suggestion: 'Please check the API documentation for available endpoints.',
    availableEndpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      products: '/api/v1/products',
      cart: '/api/v1/cart',
      orders: '/api/v1/orders',
      reviews: '/api/v1/reviews',
      wishlist: '/api/v1/wishlist',
      admin: '/api/v1/admin',
    },
  });
};

export default notFound;