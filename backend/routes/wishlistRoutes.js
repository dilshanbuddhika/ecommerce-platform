// ============================================
// WISHLIST ROUTES
// ============================================
import express from 'express';

import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart,
  clearWishlist,
  checkWishlist,
} from '../controllers/wishlistController.js';

import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes need login
router.use(protect);

router.route('/')
  .get(getWishlist)         // GET    /api/v1/wishlist
  .post(addToWishlist)      // POST   /api/v1/wishlist
  .delete(clearWishlist);   // DELETE /api/v1/wishlist

router.get('/check/:productId', checkWishlist);   // GET /api/v1/wishlist/check/:productId

router.delete('/:productId', removeFromWishlist); // DELETE /api/v1/wishlist/:productId

router.post('/:productId/move-to-cart', moveToCart); // POST /api/v1/wishlist/:productId/move-to-cart

export default router;