// ============================================
// ORDER CONTROLLER
// ============================================
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import { sendOrderConfirmationEmail } from '../utils/sendEmail.js';

// ══════════════════════════════════════════════
// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
// ══════════════════════════════════════════════
export const createOrder = async (req, res, next) => {
  try {
    const {
      shippingAddress,
      paymentIntentId,
      paymentMethod,
      customerNote,
    } = req.body;

    // ── Shipping address required ──
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.addressLine1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postalCode
    ) {
      return next(new ErrorResponse('Complete shipping address is required.', 400));
    }

    // ── Get user's cart ──
    const cart = await Cart.findOne({ user: req.user.id }).populate({
      path: 'items.product',
      select: 'name price stock images isActive soldCount',
    });

    if (!cart || cart.items.length === 0) {
      return next(new ErrorResponse('Cart is empty. Add items first.', 400));
    }

    // ── Validate & build order items ──
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      if (!item.product) {
        return next(new ErrorResponse('A product in your cart no longer exists.', 400));
      }

      if (!item.product.isActive) {
        return next(
          new ErrorResponse(`'${item.product.name}' is no longer available.`, 400)
        );
      }

      if (item.product.stock < item.quantity) {
        return next(
          new ErrorResponse(
            `'${item.product.name}' - Only ${item.product.stock} left in stock.`,
            400
          )
        );
      }

      const itemTotal = item.product.price * item.quantity;

      orderItems.push({
        product: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.images[0]?.url || '',
        totalPrice: itemTotal,
      });

      subtotal += itemTotal;
    }

    // ── Calculate totals ──
    const shippingCost = subtotal >= 5000 ? 0 : 350;
    const taxAmount = 0;
    const discount = 0;
    const totalPrice = subtotal + shippingCost + taxAmount - discount;

    // ── Create order ──
    const order = await Order.create({
      user: req.user.id,
      orderItems,
      shippingAddress,
      subtotal,
      shippingCost,
      taxAmount,
      discount,
      totalPrice,
      paymentInfo: {
        method: paymentMethod || 'test',
        paymentIntentId: paymentIntentId || '',
        status: paymentMethod === 'cod' ? 'pending' : 'paid',
        paidAt: paymentMethod === 'cod' ? null : Date.now(),
      },
      orderStatus: 'confirmed',
      customerNote: customerNote || '',
      statusHistory: [
        {
          status: 'pending',
          message: 'Order placed',
          timestamp: Date.now(),
        },
        {
          status: 'confirmed',
          message: 'Order confirmed and payment received',
          timestamp: Date.now(),
        },
      ],
    });

    // ── Update product stock & sold count ──
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: {
          stock: -item.quantity,
          soldCount: item.quantity,
        },
      });
    }

    // ── Clear cart ──
    cart.items = [];
    await cart.save();

    // ── Send confirmation email ──
    try {
      await sendOrderConfirmationEmail(req.user, order);
      console.log(`📧 Order confirmation email sent for ${order.orderNumber}`.green);
    } catch (emailError) {
      console.log(`⚠️ Order email failed: ${emailError.message}`.yellow);
    }

    // ── Populate & respond ──
    await order.populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: '✅ Order placed successfully!',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderItems: order.orderItems,
        shippingAddress: order.shippingAddress,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        taxAmount: order.taxAmount,
        totalPrice: order.totalPrice,
        paymentInfo: order.paymentInfo,
        orderStatus: order.orderStatus,
        estimatedDelivery: order.estimatedDelivery,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get logged in user's orders
// @route   GET /api/v1/orders/my-orders
// @access  Private
// ══════════════════════════════════════════════
export const getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';

    // Filter
    const filter = { user: req.user.id };
    if (status) {
      filter.orderStatus = status;
    }

    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .select(
        'orderNumber orderItems totalPrice orderStatus paymentInfo createdAt estimatedDelivery deliveredAt'
      );

    res.status(200).json({
      success: true,
      message: '✅ Orders fetched successfully!',
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get single order details
// @route   GET /api/v1/orders/:id
// @access  Private
// ══════════════════════════════════════════════
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'name images slug')
      .populate('statusHistory.updatedBy', 'name');

    if (!order) {
      return next(new ErrorResponse('Order not found.', 404));
    }

    // User can only see own orders (admin can see all)
    if (
      order.user._id.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(new ErrorResponse('Not authorized to view this order.', 403));
    }

    res.status(200).json({
      success: true,
      message: '✅ Order fetched successfully!',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get order by order number
// @route   GET /api/v1/orders/track/:orderNumber
// @access  Private
// ══════════════════════════════════════════════
export const trackOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      orderNumber: req.params.orderNumber.toUpperCase(),
    }).select(
      'orderNumber orderStatus statusHistory trackingNumber estimatedDelivery deliveredAt shippingAddress createdAt'
    );

    if (!order) {
      return next(new ErrorResponse('Order not found. Check your order number.', 404));
    }

    res.status(200).json({
      success: true,
      message: '✅ Order tracking info fetched!',
      tracking: {
        orderNumber: order.orderNumber,
        currentStatus: order.orderStatus,
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery,
        deliveredAt: order.deliveredAt,
        shippingAddress: {
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          country: order.shippingAddress.country,
        },
        timeline: order.statusHistory.map((s) => ({
          status: s.status,
          message: s.message,
          timestamp: s.timestamp,
        })),
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Cancel order
// @route   PUT /api/v1/orders/:id/cancel
// @access  Private
// ══════════════════════════════════════════════
export const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorResponse('Order not found.', 404));
    }

    // Own order check
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized.', 403));
    }

    // Cancel allowed statuses
    const cancellableStatuses = ['pending', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return next(
        new ErrorResponse(
          `Cannot cancel order with status '${order.orderStatus}'. Only pending, confirmed, or processing orders can be cancelled.`,
          400
        )
      );
    }

    // ── Update order ──
    order.orderStatus = 'cancelled';
    order.cancelReason = reason || 'Cancelled by customer';
    order.cancelledAt = Date.now();

    order.statusHistory.push({
      status: 'cancelled',
      message: reason || 'Order cancelled by customer',
      updatedBy: req.user.id,
      timestamp: Date.now(),
    });

    // ── Restore stock ──
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          stock: item.quantity,
          soldCount: -item.quantity,
        },
      });
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: '✅ Order cancelled successfully!',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        cancelReason: order.cancelReason,
        cancelledAt: order.cancelledAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════════════
//              ADMIN ONLY ENDPOINTS
// ══════════════════════════════════════════════════════

// ══════════════════════════════════════════════
// @desc    Get all orders (Admin)
// @route   GET /api/v1/orders
// @access  Private/Admin
// ══════════════════════════════════════════════
export const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';
    const sort = req.query.sort || '-createdAt';

    // Filter
    const filter = {};
    if (status) {
      filter.orderStatus = status;
    }

    // Search by order number
    if (req.query.search) {
      filter.orderNumber = { $regex: req.query.search, $options: 'i' };
    }

    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .select(
        'orderNumber user orderItems totalPrice orderStatus paymentInfo createdAt'
      );

    res.status(200).json({
      success: true,
      message: '✅ All orders fetched!',
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Update order status (Admin)
// @route   PUT /api/v1/orders/:id/status
// @access  Private/Admin
// ══════════════════════════════════════════════
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, message, trackingNumber } = req.body;

    const validStatuses = [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'returned',
    ];

    if (!status || !validStatuses.includes(status)) {
      return next(
        new ErrorResponse(
          `Invalid status. Valid options: ${validStatuses.join(', ')}`,
          400
        )
      );
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorResponse('Order not found.', 404));
    }

    // Cannot update cancelled orders
    if (order.orderStatus === 'cancelled') {
      return next(new ErrorResponse('Cannot update a cancelled order.', 400));
    }

    // Cannot update delivered orders (except to returned)
    if (order.orderStatus === 'delivered' && status !== 'returned') {
      return next(
        new ErrorResponse('Delivered orders can only be changed to returned.', 400)
      );
    }

    // ── Status specific logic ──
    const statusMessages = {
      confirmed: 'Order has been confirmed',
      processing: 'Order is being prepared',
      shipped: 'Order has been shipped',
      out_for_delivery: 'Order is out for delivery',
      delivered: 'Order has been delivered',
      cancelled: 'Order has been cancelled',
      returned: 'Order has been returned',
    };

    // Update order
    order.orderStatus = status;

    // Tracking number
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    // Delivered
    if (status === 'delivered') {
      order.deliveredAt = Date.now();
    }

    // Cancelled - restore stock
    if (status === 'cancelled') {
      order.cancelledAt = Date.now();
      order.cancelReason = message || 'Cancelled by admin';

      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: {
            stock: item.quantity,
            soldCount: -item.quantity,
          },
        });
      }
    }

    // Returned - restore stock
    if (status === 'returned') {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: {
            stock: item.quantity,
            soldCount: -item.quantity,
          },
        });
      }
    }

    // Add to status history
    order.statusHistory.push({
      status,
      message: message || statusMessages[status] || `Status updated to ${status}`,
      updatedBy: req.user.id,
      timestamp: Date.now(),
    });

    await order.save();

    await order.populate('user', 'name email');
    await order.populate('statusHistory.updatedBy', 'name');

    res.status(200).json({
      success: true,
      message: `✅ Order status updated to '${status}'!`,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        trackingNumber: order.trackingNumber,
        statusHistory: order.statusHistory,
        deliveredAt: order.deliveredAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get order statistics (Admin)
// @route   GET /api/v1/orders/stats
// @access  Private/Admin
// ══════════════════════════════════════════════
export const getOrderStats = async (req, res, next) => {
  try {
    // Total orders by status
    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Total revenue
    const revenueStats = await Order.aggregate([
      {
        $match: {
          orderStatus: { $nin: ['cancelled', 'returned'] },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
    ]);

    // Recent orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          orderStatus: { $nin: ['cancelled', 'returned'] },
        },
      },
      {
        $group: {
          _id: null,
          ordersThisWeek: { $sum: 1 },
          revenueThisWeek: { $sum: '$totalPrice' },
        },
      },
    ]);

    // Daily orders (last 7 days)
    const dailyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      message: '✅ Order statistics fetched!',
      stats: {
        byStatus: statusStats,
        overall: revenueStats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          avgOrderValue: 0,
        },
        thisWeek: recentStats[0] || {
          ordersThisWeek: 0,
          revenueThisWeek: 0,
        },
        dailyOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Add admin note to order
// @route   PUT /api/v1/orders/:id/note
// @access  Private/Admin
// ══════════════════════════════════════════════
export const addAdminNote = async (req, res, next) => {
  try {
    const { note } = req.body;

    if (!note) {
      return next(new ErrorResponse('Note is required.', 400));
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { adminNote: note },
      { new: true }
    ).select('orderNumber adminNote');

    if (!order) {
      return next(new ErrorResponse('Order not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: '✅ Admin note added!',
      order,
    });
  } catch (error) {
    next(error);
  }
};