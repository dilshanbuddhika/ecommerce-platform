// ============================================
// REVIEW MODEL
// ============================================
import mongoose from 'mongoose';
import Product from './Product.js';

const reviewSchema = new mongoose.Schema(
  {
    // Who wrote the review
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },

    // Which product
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to a product'],
    },

    // Rating (1-5 stars)
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },

    // Review title
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
      default: '',
    },

    // Review comment
    comment: {
      type: String,
      required: [true, 'Please provide a review comment'],
      trim: true,
      minlength: [5, 'Comment must be at least 5 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },

    // Is this review verified purchase
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },

    // Admin can approve/reject
    isApproved: {
      type: Boolean,
      default: true,
    },

    // Helpful votes
    helpfulCount: {
      type: Number,
      default: 0,
    },

    helpfulVotes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ══════════════════════════════════════════════
// One review per product per user
// ══════════════════════════════════════════════
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ product: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: 1 });

// ══════════════════════════════════════════════
// Static Method: Calculate average rating
// ══════════════════════════════════════════════
reviewSchema.statics.calculateAverageRating = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: {
        product: productId,
        isApproved: true,
      },
    },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: Math.round(stats[0].avgRating * 10) / 10,
      ratingsCount: stats[0].totalReviews,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: 0,
      ratingsCount: 0,
    });
  }
};

// ══════════════════════════════════════════════
// After save → recalculate rating
// ══════════════════════════════════════════════
reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.product);
});

// ══════════════════════════════════════════════
// After delete → recalculate rating
// ══════════════════════════════════════════════
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.product);
  }
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;