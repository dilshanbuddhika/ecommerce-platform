// ============================================
// PRODUCT ROUTES
// ============================================
import express from 'express';

import {
  createProduct,
  getProducts,
  getProduct,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getLatestProducts,
  getTopRatedProducts,
  getProductsByCategory,
  updateStock,
  getLowStockProducts,
} from '../controllers/productController.js';

import { protect, adminOnly } from '../middleware/auth.js';
import { uploadProductImages } from '../config/cloudinary.js';

const router = express.Router();

// ══════════════════════════════════════════════
// PUBLIC ROUTES
// ══════════════════════════════════════════════

// ⚠️ Static routes FIRST (/:id ට කලින් තියන්න ඕන)
router.get('/featured', getFeaturedProducts);
router.get('/latest', getLatestProducts);
router.get('/top-rated', getTopRatedProducts);
router.get('/low-stock', protect, adminOnly, getLowStockProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/category/:categoryId', getProductsByCategory);

// GET all products (with search, filter, sort, pagination)
router.get('/', getProducts);

// GET single product
router.get('/:id', getProduct);

// ══════════════════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════════════════

// Create product (with image upload)
router.post(
  '/',
  protect,
  adminOnly,
  uploadProductImages.array('images', 5),
  createProduct
);

// Update product (with optional image upload)
router.put(
  '/:id',
  protect,
  adminOnly,
  uploadProductImages.array('images', 5),
  updateProduct
);

// Delete product
router.delete('/:id', protect, adminOnly, deleteProduct);

// Update stock
router.put('/:id/stock', protect, adminOnly, updateStock);

export default router;