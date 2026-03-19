// ============================================
// PAYMENT ROUTES
// ============================================
import express from 'express';

import {
  createPaymentIntent,
  confirmPayment,
  getStripeConfig,
  processRefund,
  stripeWebhook,
  getPaymentHistory,
} from '../controllers/paymentController.js';

import { protect, adminOnly } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// ══════════════════════════════════════════════
// PUBLIC ROUTES
// ══════════════════════════════════════════════

// Get Stripe publishable key
router.get('/config', getStripeConfig);

// Stripe webhook (raw body needed)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// ══════════════════════════════════════════════
// PRIVATE ROUTES (Login required)
// ══════════════════════════════════════════════

// Create payment intent
router.post('/create-intent', protect, paymentLimiter, createPaymentIntent);

// Confirm payment
router.post('/confirm', protect, confirmPayment);

// Payment history
router.get('/history', protect, getPaymentHistory);

// ══════════════════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════════════════

// Process refund
router.post('/refund', protect, adminOnly, processRefund);

export default router;