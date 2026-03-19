// ============================================
// WISHLIST CONTROLLER
// ============================================
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import ErrorResponse from '../utils/ErrorResponse.js';

// ══════════════════════════════════════════════
// @desc    Get user's wishlist
// @route   GET /api/v1/wishlist
// @access  Private
// ══════════════════════════════════════════════
export const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
      path: 'products.product',
      select: 'name price comparePrice stock images slug ratingsAverage isActive',
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        products: [],
      });
    }

    // Inactive products remove
    const validProducts = wishlist.products.filter(
      (item) => item.product && item.product.isActive
    );

    if (validProducts.length !== wishlist.products.length) {
      wishlist.products = validProducts;
      await wishlist.save();
    }

    res.status(200).json({
      success: true,
      message: '✅ Wishlist fetched successfully!',
      count: wishlist.products.length,
      wishlist: wishlist.products,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Add product to wishlist
// @route   POST /api/v1/wishlist
// @access  Private
// ══════════════════════════════════════════════
export const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return next(new ErrorResponse('Product ID is required.', 400));
    }

    // Product check
    const product = await Product.findById(productId);

    if (!product) {
      return next(new ErrorResponse('Product not found.', 404));
    }

    if (!product.isActive) {
      return next(new ErrorResponse('This product is not available.', 400));
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user.id,
        products: [],
      });
    }

    // Already in wishlist check
    const alreadyExists = wishlist.products.find(
      (item) => item.product.toString() === productId
    );

    if (alreadyExists) {
      return next(new ErrorResponse('Product already in wishlist.', 400));
    }

    // Maximum 50 items
    if (wishlist.products.length >= 50) {
      return next(
        new ErrorResponse('Wishlist is full. Maximum 50 items allowed.', 400)
      );
    }

    wishlist.products.push({
      product: productId,
      addedAt: Date.now(),
    });

    await wishlist.save();

    await wishlist.populate({
      path: 'products.product',
      select: 'name price comparePrice stock images slug ratingsAverage',
    });

    res.status(200).json({
      success: true,
      message: '✅ Product added to wishlist!',
      count: wishlist.products.length,
      wishlist: wishlist.products,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Remove product from wishlist
// @route   DELETE /api/v1/wishlist/:productId
// @access  Private
// ══════════════════════════════════════════════
export const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return next(new ErrorResponse('Wishlist not found.', 404));
    }

    const itemIndex = wishlist.products.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return next(new ErrorResponse('Product not found in wishlist.', 404));
    }

    wishlist.products.splice(itemIndex, 1);
    await wishlist.save();

    await wishlist.populate({
      path: 'products.product',
      select: 'name price comparePrice stock images slug ratingsAverage',
    });

    res.status(200).json({
      success: true,
      message: '✅ Product removed from wishlist!',
      count: wishlist.products.length,
      wishlist: wishlist.products,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Move wishlist item to cart
// @route   POST /api/v1/wishlist/:productId/move-to-cart
// @access  Private
// ══════════════════════════════════════════════
export const moveToCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // ── Wishlist check ──
    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return next(new ErrorResponse('Wishlist not found.', 404));
    }

    const wishlistItemIndex = wishlist.products.findIndex(
      (item) => item.product.toString() === productId
    );

    if (wishlistItemIndex === -1) {
      return next(new ErrorResponse('Product not found in wishlist.', 404));
    }

    // ── Product check ──
    const product = await Product.findById(productId);

    if (!product) {
      return next(new ErrorResponse('Product not found.', 404));
    }

    if (!product.isActive) {
      return next(new ErrorResponse('This product is not available.', 400));
    }

    if (product.stock < 1) {
      return next(new ErrorResponse('Product is out of stock.', 400));
    }

    // ── Add to cart ──
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [],
      });
    }

    // Already in cart check
    const cartItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (cartItemIndex > -1) {
      // Already in cart → quantity increase
      const newQty = cart.items[cartItemIndex].quantity + 1;

      if (newQty > 10) {
        return next(new ErrorResponse('Maximum 10 items per product in cart.', 400));
      }

      if (newQty > product.stock) {
        return next(
          new ErrorResponse(`Only ${product.stock} items available.`, 400)
        );
      }

      cart.items[cartItemIndex].quantity = newQty;
      cart.items[cartItemIndex].price = product.price;
      cart.items[cartItemIndex].totalPrice = product.price * newQty;
    } else {
      // New item in cart
      cart.items.push({
        product: productId,
        quantity: 1,
        price: product.price,
        totalPrice: product.price,
      });
    }

    // ── Remove from wishlist ──
    wishlist.products.splice(wishlistItemIndex, 1);

    // ── Save both ──
    await cart.save();
    await wishlist.save();

    await cart.populate({
      path: 'items.product',
      select: 'name price stock images slug',
    });

    res.status(200).json({
      success: true,
      message: '✅ Product moved from wishlist to cart!',
      cart: {
        _id: cart._id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalAmount: cart.totalAmount,
      },
      wishlistCount: wishlist.products.length,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Clear entire wishlist
// @route   DELETE /api/v1/wishlist
// @access  Private
// ══════════════════════════════════════════════
export const clearWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return next(new ErrorResponse('Wishlist not found.', 404));
    }

    wishlist.products = [];
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: '✅ Wishlist cleared!',
      count: 0,
      wishlist: [],
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Check if product is in wishlist
// @route   GET /api/v1/wishlist/check/:productId
// @access  Private
// ══════════════════════════════════════════════
export const checkWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });

    let isInWishlist = false;

    if (wishlist) {
      isInWishlist = wishlist.products.some(
        (item) => item.product.toString() === productId
      );
    }

    res.status(200).json({
      success: true,
      isInWishlist,
    });
  } catch (error) {
    next(error);
  }
};