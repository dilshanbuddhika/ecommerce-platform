// ============================================
// CART CONTROLLER
// ============================================
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import ErrorResponse from '../utils/ErrorResponse.js';

// ══════════════════════════════════════════════
// @desc    Get user's cart
// @route   GET /api/v1/cart
// @access  Private
// ══════════════════════════════════════════════
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate({
      path: 'items.product',
      select: 'name price stock images slug isActive',
    });

    if (!cart) {
      // Cart නැත්නම් empty cart create
      cart = await Cart.create({
        user: req.user.id,
        items: [],
      });
    }

    // Inactive/deleted products remove
    const validItems = cart.items.filter(
      (item) => item.product && item.product.isActive
    );

    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: '✅ Cart fetched successfully!',
      cart: {
        _id: cart._id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalAmount: cart.totalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Add item to cart
// @route   POST /api/v1/cart
// @access  Private
// ══════════════════════════════════════════════
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // ── Validation ──
    if (!productId) {
      return next(new ErrorResponse('Product ID is required.', 400));
    }

    if (quantity < 1 || quantity > 10) {
      return next(new ErrorResponse('Quantity must be between 1 and 10.', 400));
    }

    // ── Product check ──
    const product = await Product.findById(productId);

    if (!product) {
      return next(new ErrorResponse('Product not found.', 404));
    }

    if (!product.isActive) {
      return next(new ErrorResponse('This product is not available.', 400));
    }

    if (product.stock < quantity) {
      return next(
        new ErrorResponse(
          `Only ${product.stock} items available in stock.`,
          400
        )
      );
    }

    // ── Find or create cart ──
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [],
      });
    }

    // ── Check if product already in cart ──
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Already exists → update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      if (newQuantity > 10) {
        return next(
          new ErrorResponse('Maximum 10 items per product allowed.', 400)
        );
      }

      if (newQuantity > product.stock) {
        return next(
          new ErrorResponse(
            `Only ${product.stock} items available in stock.`,
            400
          )
        );
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = product.price;
      cart.items[existingItemIndex].totalPrice = product.price * newQuantity;
    } else {
      // New item → add to cart
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
        totalPrice: product.price * quantity,
      });
    }

    await cart.save();

    // Populate product details
    await cart.populate({
      path: 'items.product',
      select: 'name price stock images slug',
    });

    res.status(200).json({
      success: true,
      message: '✅ Item added to cart!',
      cart: {
        _id: cart._id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalAmount: cart.totalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Update cart item quantity
// @route   PUT /api/v1/cart/:itemId
// @access  Private
// ══════════════════════════════════════════════
export const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    // ── Validation ──
    if (!quantity || quantity < 1 || quantity > 10) {
      return next(new ErrorResponse('Quantity must be between 1 and 10.', 400));
    }

    // ── Find cart ──
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return next(new ErrorResponse('Cart not found.', 404));
    }

    // ── Find item in cart ──
    const item = cart.items.id(itemId);

    if (!item) {
      return next(new ErrorResponse('Item not found in cart.', 404));
    }

    // ── Stock check ──
    const product = await Product.findById(item.product);

    if (!product) {
      // Product deleted → remove from cart
      item.deleteOne();
      await cart.save();
      return next(new ErrorResponse('Product no longer available. Removed from cart.', 400));
    }

    if (quantity > product.stock) {
      return next(
        new ErrorResponse(
          `Only ${product.stock} items available in stock.`,
          400
        )
      );
    }

    // ── Update ──
    item.quantity = quantity;
    item.price = product.price;
    item.totalPrice = product.price * quantity;

    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'name price stock images slug',
    });

    res.status(200).json({
      success: true,
      message: '✅ Cart item updated!',
      cart: {
        _id: cart._id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalAmount: cart.totalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/:itemId
// @access  Private
// ══════════════════════════════════════════════
export const removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return next(new ErrorResponse('Cart not found.', 404));
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return next(new ErrorResponse('Item not found in cart.', 404));
    }

    item.deleteOne();
    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'name price stock images slug',
    });

    res.status(200).json({
      success: true,
      message: '✅ Item removed from cart!',
      cart: {
        _id: cart._id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalAmount: cart.totalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Clear entire cart
// @route   DELETE /api/v1/cart
// @access  Private
// ══════════════════════════════════════════════
export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return next(new ErrorResponse('Cart not found.', 404));
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: '✅ Cart cleared!',
      cart: {
        _id: cart._id,
        items: [],
        totalItems: 0,
        totalAmount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};