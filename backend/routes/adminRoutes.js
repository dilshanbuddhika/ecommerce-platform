// ============================================
// ADMIN DASHBOARD ROUTES
// ============================================
import express from 'express';

import {
  getDashboard,
  getSalesAnalytics,
  getOrderAnalytics,
  getTopProducts,
  getCategoryAnalytics,
  getUserAnalytics,
  getInventoryAlerts,
  getRevenueReport,
} from '../controllers/adminController.js';

import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All routes need admin access
router.use(protect);
router.use(adminOnly);

// Dashboard overview
router.get('/dashboard', getDashboard);

// Sales analytics
router.get('/analytics/sales', getSalesAnalytics);

// Order analytics
router.get('/analytics/orders', getOrderAnalytics);

// Top products
router.get('/analytics/top-products', getTopProducts);

// Category analytics
router.get('/analytics/categories', getCategoryAnalytics);

// User analytics
router.get('/analytics/users', getUserAnalytics);

// Inventory alerts
router.get('/inventory', getInventoryAlerts);

// Revenue report
router.get('/reports/revenue', getRevenueReport);

export default router;