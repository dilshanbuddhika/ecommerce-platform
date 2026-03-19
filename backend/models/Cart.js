// ============================================
// CART MODEL
// ============================================
import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },

    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [10, 'Maximum 10 items per product'],
      default: 1,
    },

    price: {
      type: Number,
      required: true,
    },

    totalPrice: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    items: [cartItemSchema],

    totalItems: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ══════════════════════════════════════════════
// Cart totals auto calculate
// ══════════════════════════════════════════════
cartSchema.methods.calculateTotals = function () {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalAmount = Math.round(this.totalAmount * 100) / 100;
};

// Save කරන්න කලින් totals calculate
cartSchema.pre('save', function () {
  this.calculateTotals();
});

cartSchema.index({ user: 1 });

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;