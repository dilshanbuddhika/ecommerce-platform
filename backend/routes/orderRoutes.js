// ============================================
// ORDER ROUTES
// ============================================
import express from 'express';

import {
  createOrder,
  getMyOrders,
  getOrder,
  trackOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
  addAdminNote,
} from '../controllers/orderController.js';

import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ══════════════════════════════════════════════
// USER ROUTES (Login required)
// ══════════════════════════════════════════════

// Create order
router.post('/', protect, createOrder);

// Get my orders
router.get('/my-orders', protect, getMyOrders);

// Track order by order number
router.get('/track/:orderNumber', protect, trackOrder);

// Get single order
router.get('/:id', protect, getOrder);

// Cancel order
router.put('/:id/cancel', protect, cancelOrder);

// ══════════════════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════════════════

// Get all orders (Admin)
router.get('/', protect, adminOnly, getAllOrders);

// Get order stats (Admin)
router.get('/stats/overview', protect, adminOnly, getOrderStats);

// Update order status (Admin)
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

// Add admin note (Admin)
router.put('/:id/note', protect, adminOnly, addAdminNote);

export default router;