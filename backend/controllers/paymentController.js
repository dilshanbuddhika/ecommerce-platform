// ============================================
// PAYMENT CONTROLLER (Stripe)
// ============================================
import stripe from '../config/stripe.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import ErrorResponse from '../utils/ErrorResponse.js';

// ══════════════════════════════════════════════
// @desc    Create payment intent
// @route   POST /api/v1/payment/create-intent
// @access  Private
// ══════════════════════════════════════════════
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { shippingAddress } = req.body;

    // ── Get user's cart ──
    const cart = await Cart.findOne({ user: req.user.id }).populate({
      path: 'items.product',
      select: 'name price stock isActive',
    });

    if (!cart || cart.items.length === 0) {
      return next(new ErrorResponse('Cart is empty. Add items first.', 400));
    }

    // ── Validate all items ──
    const invalidItems = [];
    let calculatedTotal = 0;

    for (const item of cart.items) {
      if (!item.product) {
        invalidItems.push({ reason: 'Product not found' });
        continue;
      }

      if (!item.product.isActive) {
        invalidItems.push({
          name: item.product.name,
          reason: 'Product is no longer available',
        });
        continue;
      }

      if (item.product.stock < item.quantity) {
        invalidItems.push({
          name: item.product.name,
          reason: `Only ${item.product.stock} left in stock`,
        });
        continue;
      }

      // Recalculate with current price
      item.price = item.product.price;
      item.totalPrice = item.product.price * item.quantity;
      calculatedTotal += item.totalPrice;
    }

    if (invalidItems.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Some items in your cart have issues.',
        invalidItems,
      });
    }

    // ── Shipping cost calculate ──
    const shippingCost = calculatedTotal >= 5000 ? 0 : 350; // Free shipping over $5000
    const taxRate = 0; // Tax (0% for now)
    const taxAmount = Math.round(calculatedTotal * taxRate);
    const totalAmount = calculatedTotal + shippingCost + taxAmount;

    // ── Order summary ──
    const orderSummary = {
      items: cart.items.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
      })),
      subtotal: calculatedTotal,
      shippingCost,
      taxAmount,
      totalAmount,
      currency: 'usd',
    };

    // ── Stripe configured check ──
    if (!stripe) {
      // Stripe නැත්නම් test response
      return res.status(200).json({
        success: true,
        message: '✅ Payment intent created (TEST MODE - Stripe not configured)',
        testMode: true,
        clientSecret: 'test_secret_' + Date.now(),
        paymentIntentId: 'test_pi_' + Date.now(),
        orderSummary,
      });
    }

    // ── Create Stripe Payment Intent ──
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Stripe uses cents
      currency: 'usd',
      metadata: {
        userId: req.user.id,
        userEmail: req.user.email,
        itemCount: cart.items.length.toString(),
        subtotal: calculatedTotal.toString(),
        shippingCost: shippingCost.toString(),
      },
      description: `E-Commerce Order - ${req.user.email}`,
      shipping: shippingAddress
        ? {
            name: shippingAddress.fullName || req.user.name,
            address: {
              line1: shippingAddress.addressLine1 || '',
              line2: shippingAddress.addressLine2 || '',
              city: shippingAddress.city || '',
              state: shippingAddress.state || '',
              postal_code: shippingAddress.postalCode || '',
              country: shippingAddress.country || 'LK',
            },
          }
        : undefined,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // ── Save cart totals ──
    await cart.save();

    res.status(200).json({
      success: true,
      message: '✅ Payment intent created!',
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderSummary,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Confirm payment (after frontend payment)
// @route   POST /api/v1/payment/confirm
// @access  Private
// ══════════════════════════════════════════════
export const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return next(new ErrorResponse('Payment Intent ID is required.', 400));
    }

    // ── Test mode check ──
    if (!stripe || paymentIntentId.startsWith('test_pi_')) {
      return res.status(200).json({
        success: true,
        message: '✅ Payment confirmed (TEST MODE)',
        testMode: true,
        payment: {
          id: paymentIntentId,
          status: 'succeeded',
          amount: 0,
          currency: 'usd',
        },
      });
    }

    // ── Retrieve payment intent from Stripe ──
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return next(new ErrorResponse('Payment intent not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: '✅ Payment status retrieved!',
      payment: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method,
        created: new Date(paymentIntent.created * 1000),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get Stripe publishable key
// @route   GET /api/v1/payment/config
// @access  Public
// ══════════════════════════════════════════════
export const getStripeConfig = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_not_configured',
      testMode: !stripe,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Process refund
// @route   POST /api/v1/payment/refund
// @access  Private/Admin
// ══════════════════════════════════════════════
export const processRefund = async (req, res, next) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    if (!paymentIntentId) {
      return next(new ErrorResponse('Payment Intent ID is required.', 400));
    }

    // ── Test mode ──
    if (!stripe || paymentIntentId.startsWith('test_pi_')) {
      return res.status(200).json({
        success: true,
        message: '✅ Refund processed (TEST MODE)',
        testMode: true,
        refund: {
          id: 'test_refund_' + Date.now(),
          paymentIntentId,
          amount: amount || 0,
          status: 'succeeded',
          reason: reason || 'requested_by_customer',
        },
      });
    }

    // ── Create refund ──
    const refundData = {
      payment_intent: paymentIntentId,
      reason: reason || 'requested_by_customer',
    };

    // Partial refund
    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundData);

    res.status(200).json({
      success: true,
      message: '✅ Refund processed successfully!',
      refund: {
        id: refund.id,
        paymentIntentId: refund.payment_intent,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        created: new Date(refund.created * 1000),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Stripe Webhook handler
// @route   POST /api/v1/payment/webhook
// @access  Public (Stripe calls this)
// ══════════════════════════════════════════════
export const stripeWebhook = async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(200).json({ received: true, testMode: true });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`❌ Webhook signature verification failed: ${err.message}`.red);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // ── Handle events ──
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`✅ Payment succeeded: ${paymentIntent.id}`.green);
        console.log(`   Amount: $${paymentIntent.amount / 100}`.green);
        console.log(`   Customer: ${paymentIntent.metadata.userEmail}`.green);
        // Order create logic Part 7 එකේදී add කරනවා
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log(`❌ Payment failed: ${failedPayment.id}`.red);
        console.log(`   Error: ${failedPayment.last_payment_error?.message}`.red);
        break;

      case 'charge.refunded':
        const refund = event.data.object;
        console.log(`💰 Refund processed: ${refund.id}`.yellow);
        break;

      default:
        console.log(`📨 Unhandled event type: ${event.type}`.blue);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get payment history (user's payments)
// @route   GET /api/v1/payment/history
// @access  Private
// ══════════════════════════════════════════════
export const getPaymentHistory = async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(200).json({
        success: true,
        message: '✅ Payment history (TEST MODE)',
        testMode: true,
        payments: [],
      });
    }

    // Stripe payment intents search by metadata
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 20,
    });

    // Filter by user email
    const userPayments = paymentIntents.data
      .filter(
        (pi) =>
          pi.metadata.userId === req.user.id ||
          pi.metadata.userEmail === req.user.email
      )
      .map((pi) => ({
        id: pi.id,
        amount: pi.amount / 100,
        currency: pi.currency,
        status: pi.status,
        created: new Date(pi.created * 1000),
      }));

    res.status(200).json({
      success: true,
      message: '✅ Payment history fetched!',
      count: userPayments.length,
      payments: userPayments,
    });
  } catch (error) {
    next(error);
  }
};