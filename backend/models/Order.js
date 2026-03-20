// ============================================
// ORDER MODEL
// ============================================
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image: {
    type: String,
    default: '',
  },
  totalPrice: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    // ──────────────────────────────────────
    // Order Number (unique readable ID)
    // ──────────────────────────────────────
    orderNumber: {
      type: String,
      unique: true,
    },

    // ──────────────────────────────────────
    // User who placed order
    // ──────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ──────────────────────────────────────
    // Order Items
    // ──────────────────────────────────────
    orderItems: [orderItemSchema],

    // ──────────────────────────────────────
    // Shipping Address
    // ──────────────────────────────────────
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: 'Sri Lanka' },
    },

    // ──────────────────────────────────────
    // Pricing
    // ──────────────────────────────────────
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },

    shippingCost: {
      type: Number,
      required: true,
      default: 0,
    },

    taxAmount: {
      type: Number,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    // ──────────────────────────────────────
    // Payment Info
    // ──────────────────────────────────────
    paymentInfo: {
      method: {
        type: String,
        enum: ['stripe', 'cod', 'test'],
        default: 'test',
      },
      paymentIntentId: {
        type: String,
        default: '',
      },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
      },
      paidAt: {
        type: Date,
        default: null,
      },
    },

    // ──────────────────────────────────────
    // Order Status
    // ──────────────────────────────────────
    orderStatus: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'returned',
      ],
      default: 'pending',
    },

    // ──────────────────────────────────────
    // Status Timeline (Tracking)
    // ──────────────────────────────────────
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          default: '',
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ──────────────────────────────────────
    // Delivery Info
    // ──────────────────────────────────────
    trackingNumber: {
      type: String,
      default: '',
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    estimatedDelivery: {
      type: Date,
      default: null,
    },

    // ──────────────────────────────────────
    // Cancellation
    // ──────────────────────────────────────
    cancelReason: {
      type: String,
      default: '',
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    // ──────────────────────────────────────
    // Notes
    // ──────────────────────────────────────
    customerNote: {
      type: String,
      maxlength: 500,
      default: '',
    },

    adminNote: {
      type: String,
      maxlength: 500,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ══════════════════════════════════════════════
// Auto generate order number
// ══════════════════════════════════════════════
orderSchema.pre('save', async function () {
  if (!this.orderNumber && this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }
});

// ══════════════════════════════════════════════
// Set estimated delivery (5-7 days from order)
// ══════════════════════════════════════════════
orderSchema.pre('save', function () {
  if (!this.estimatedDelivery && this.isNew) {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    this.estimatedDelivery = deliveryDate;
  }
});

// ══════════════════════════════════════════════
// Add initial status to history
// ══════════════════════════════════════════════
orderSchema.pre('save', function () {
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: 'pending',
      message: 'Order placed successfully',
      timestamp: Date.now(),
    });
  }
});

// ══════════════════════════════════════════════
// INDEXES
// ══════════════════════════════════════════════
orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'paymentInfo.paymentIntentId': 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;