// ============================================
// PRODUCT MODEL
// ============================================
import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema(
  {
    // ──────────────────────────────────────
    // Basic Information
    // ──────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [150, 'Product name cannot exceed 150 characters'],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
      default: '',
    },

    // ──────────────────────────────────────
    // Pricing
    // ──────────────────────────────────────
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
      max: [999999, 'Price cannot exceed 999999'],
    },

    comparePrice: {
      type: Number,
      default: 0,
      min: [0, 'Compare price cannot be negative'],
    },

    // ──────────────────────────────────────
    // Category
    // ──────────────────────────────────────
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
    },

    // ──────────────────────────────────────
    // Images (Multiple)
    // ──────────────────────────────────────
    images: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],

    // ──────────────────────────────────────
    // Inventory
    // ──────────────────────────────────────
    stock: {
      type: Number,
      required: [true, 'Product stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },

    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },

    // ──────────────────────────────────────
    // Ratings
    // ──────────────────────────────────────
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot exceed 5'],
      set: (val) => Math.round(val * 10) / 10, // 4.6667 → 4.7
    },

    ratingsCount: {
      type: Number,
      default: 0,
    },

    // ──────────────────────────────────────
    // Status & Flags
    // ──────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    // ──────────────────────────────────────
    // Additional Info
    // ──────────────────────────────────────
    brand: {
      type: String,
      trim: true,
      default: '',
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    specifications: [
      {
        key: { type: String, trim: true },
        value: { type: String, trim: true },
      },
    ],

    // ──────────────────────────────────────
    // Who created
    // ──────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ──────────────────────────────────────
    // Sales tracking
    // ──────────────────────────────────────
    soldCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ══════════════════════════════════════════════
// VIRTUALS
// ══════════════════════════════════════════════

// Discount percentage calculate
productSchema.virtual('discountPercentage').get(function () {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
});

// In stock check
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

// ══════════════════════════════════════════════
// MIDDLEWARE
// ══════════════════════════════════════════════

// Slug auto generate
productSchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now();
  }
});

// Auto generate SKU
productSchema.pre('save', function () {
  if (!this.sku && this.isNew) {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.sku = `PRD-${random}`;
  }
});

// ══════════════════════════════════════════════
// INDEXES
// ══════════════════════════════════════════════
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ ratingsAverage: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isActive: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;