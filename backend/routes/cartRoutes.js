// ============================================
// CART ROUTES
// ============================================
import express from 'express';

import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cartController.js';

import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes need login
router.use(protect);

router.route('/')
  .get(getCart)         // GET    /api/v1/cart
  .post(addToCart)      // POST   /api/v1/cart
  .delete(clearCart);   // DELETE /api/v1/cart

router.route('/:itemId')
  .put(updateCartItem)      // PUT    /api/v1/cart/:itemId
  .delete(removeFromCart);   // DELETE /api/v1/cart/:itemId

export default router;