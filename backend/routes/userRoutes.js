// ============================================
// USER MANAGEMENT ROUTES
// ============================================
import express from 'express';

// Controller imports
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  deleteAccount,
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
} from '../controllers/userController.js';

// Middleware imports
import { protect, adminOnly } from '../middleware/auth.js';
import { updateProfileValidation } from '../middleware/validator.js';
import { uploadAvatar as uploadAvatarMiddleware } from '../config/cloudinary.js';

const router = express.Router();

// ══════════════════════════════════════════════
// USER ROUTES (Login required)
// ══════════════════════════════════════════════

// ── Profile ──
// GET    /api/v1/users/profile
// PUT    /api/v1/users/profile
router
  .route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfileValidation, updateProfile);

// ── Avatar Upload ──
// PUT /api/v1/users/avatar
router.put(
  '/avatar',
  protect,
  uploadAvatarMiddleware.single('avatar'),
  uploadAvatar
);

// ── Address CRUD ──
// GET    /api/v1/users/addresses
// POST   /api/v1/users/addresses
router
  .route('/addresses')
  .get(protect, getAddresses)
  .post(protect, addAddress);

// PUT    /api/v1/users/addresses/:addressId
// DELETE /api/v1/users/addresses/:addressId
router
  .route('/addresses/:addressId')
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

// PUT /api/v1/users/addresses/:addressId/default
router.put('/addresses/:addressId/default', protect, setDefaultAddress);

// ── Delete Account ──
// DELETE /api/v1/users/account
router.delete('/account', protect, deleteAccount);

// ══════════════════════════════════════════════
// ADMIN ROUTES (Admin only)
// ══════════════════════════════════════════════

// GET /api/v1/users         (All users list)
router.get('/', protect, adminOnly, getAllUsers);

// GET /api/v1/users/:id     (Single user)
router.get('/:id', protect, adminOnly, getUserById);

// PUT /api/v1/users/:id/role    (Change role)
router.put('/:id/role', protect, adminOnly, updateUserRole);

// PUT /api/v1/users/:id/status  (Activate/Deactivate)
router.put('/:id/status', protect, adminOnly, toggleUserStatus);

// DELETE /api/v1/users/:id      (Delete user)
router.delete('/:id', protect, adminOnly, deleteUser);

export default router;