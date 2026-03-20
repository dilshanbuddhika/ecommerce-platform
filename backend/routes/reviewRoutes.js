// ============================================
// REVIEW ROUTES
// ============================================
import express from 'express';

import {
  createReview,
  getProductReviews,
  getReview,
  updateReview,
  deleteReview,
  getMyReviews,
  markHelpful,
  canReview,
  getAllReviews,
  approveReview,
} from '../controllers/reviewController.js';

import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ══════════════════════════════════════════════
// PUBLIC ROUTES
// ══════════════════════════════════════════════

// Get reviews for a product
router.get('/product/:productId', getProductReviews);

// Get single review
router.get('/:id', getReview);

// ══════════════════════════════════════════════
// USER ROUTES (Login required)
// ══════════════════════════════════════════════

// Create review
router.post('/', protect, createReview);

// Get my reviews
router.get('/user/my-reviews', protect, getMyReviews);

// Check if can review
router.get('/can-review/:productId', protect, canReview);

// Update own review
router.put('/:id', protect, updateReview);

// Delete own review
router.delete('/:id', protect, deleteReview);

// Mark review as helpful
router.put('/:id/helpful', protect, markHelpful);

// ══════════════════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════════════════

// Get all reviews (Admin)
router.get('/', protect, adminOnly, getAllReviews);

// Approve/Reject review (Admin)
router.put('/:id/approve', protect, adminOnly, approveReview);

export default router;