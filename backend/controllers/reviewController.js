// ============================================
// REVIEW CONTROLLER
// ============================================
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import ErrorResponse from '../utils/ErrorResponse.js';

// ══════════════════════════════════════════════
// @desc    Create review
// @route   POST /api/v1/reviews
// @access  Private
// ══════════════════════════════════════════════
export const createReview = async (req, res, next) => {
  try {
    const { productId, rating, title, comment } = req.body;

    // ── Validation ──
    if (!productId) {
      return next(new ErrorResponse('Product ID is required.', 400));
    }

    if (!rating || rating < 1 || rating > 5) {
      return next(new ErrorResponse('Rating must be between 1 and 5.', 400));
    }

    if (!comment || comment.length < 5) {
      return next(
        new ErrorResponse('Comment must be at least 5 characters.', 400)
      );
    }

    // ── Product exists check ──
    const product = await Product.findById(productId);

    if (!product) {
      return next(new ErrorResponse('Product not found.', 404));
    }

    // ── Already reviewed check ──
    const existingReview = await Review.findOne({
      user: req.user.id,
      product: productId,
    });

    if (existingReview) {
      return next(
        new ErrorResponse(
          'You have already reviewed this product. You can update your existing review.',
          400
        )
      );
    }

    // ── Check if user purchased this product ──
    let isVerifiedPurchase = false;

    const purchasedOrder = await Order.findOne({
      user: req.user.id,
      'orderItems.product': productId,
      orderStatus: 'delivered',
    });

    if (purchasedOrder) {
      isVerifiedPurchase = true;
    }

    // ── Create review ──
    const review = await Review.create({
      user: req.user.id,
      product: productId,
      rating,
      title: title || '',
      comment,
      isVerifiedPurchase,
    });

    // Populate user info
    await review.populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      message: '✅ Review submitted successfully!',
      review,
    });
  } catch (error) {
    // Duplicate review error
    if (error.code === 11000) {
      return next(
        new ErrorResponse('You have already reviewed this product.', 400)
      );
    }
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get all reviews for a product
// @route   GET /api/v1/reviews/product/:productId
// @access  Public
// ══════════════════════════════════════════════
export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';
    const rating = req.query.rating || '';

    // Product check
    const product = await Product.findById(productId).select(
      'name ratingsAverage ratingsCount'
    );

    if (!product) {
      return next(new ErrorResponse('Product not found.', 404));
    }

    // Filter
    const filter = { product: productId, isApproved: true };

    // Filter by rating
    if (rating) {
      filter.rating = parseInt(rating);
    }

    const total = await Review.countDocuments(filter);

    const reviews = await Review.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('user', 'name avatar');

    // Rating breakdown (1-5 stars count)
    const ratingBreakdown = await Review.aggregate([
      { $match: { product: product._id, isApproved: true } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    // Format breakdown
    const breakdown = {};
    for (let i = 5; i >= 1; i--) {
      const found = ratingBreakdown.find((r) => r._id === i);
      breakdown[`${i}star`] = found ? found.count : 0;
    }

    res.status(200).json({
      success: true,
      message: '✅ Reviews fetched successfully!',
      product: {
        name: product.name,
        ratingsAverage: product.ratingsAverage,
        ratingsCount: product.ratingsCount,
      },
      ratingBreakdown: breakdown,
      count: reviews.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get single review
// @route   GET /api/v1/reviews/:id
// @access  Public
// ══════════════════════════════════════════════
export const getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'name avatar')
      .populate('product', 'name images slug');

    if (!review) {
      return next(new ErrorResponse('Review not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: '✅ Review fetched successfully!',
      review,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Update own review
// @route   PUT /api/v1/reviews/:id
// @access  Private
// ══════════════════════════════════════════════
export const updateReview = async (req, res, next) => {
  try {
    const { rating, title, comment } = req.body;

    let review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ErrorResponse('Review not found.', 404));
    }

    // Own review check
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse('You can only update your own reviews.', 403)
      );
    }

    // Validation
    if (rating && (rating < 1 || rating > 5)) {
      return next(new ErrorResponse('Rating must be between 1 and 5.', 400));
    }

    if (comment && comment.length < 5) {
      return next(
        new ErrorResponse('Comment must be at least 5 characters.', 400)
      );
    }

    // Update fields
    if (rating) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment) review.comment = comment;

    await review.save();

    await review.populate('user', 'name avatar');

    res.status(200).json({
      success: true,
      message: '✅ Review updated successfully!',
      review,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Delete own review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
// ══════════════════════════════════════════════
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ErrorResponse('Review not found.', 404));
    }

    // Own review or admin check
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse('You can only delete your own reviews.', 403)
      );
    }

    await Review.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: '✅ Review deleted successfully!',
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get my reviews
// @route   GET /api/v1/reviews/my-reviews
// @access  Private
// ══════════════════════════════════════════════
export const getMyReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Review.countDocuments({ user: req.user.id });

    const reviews = await Review.find({ user: req.user.id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('product', 'name images slug price');

    res.status(200).json({
      success: true,
      message: '✅ Your reviews fetched!',
      count: reviews.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Mark review as helpful
// @route   PUT /api/v1/reviews/:id/helpful
// @access  Private
// ══════════════════════════════════════════════
export const markHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ErrorResponse('Review not found.', 404));
    }

    // Own review vote එපා
    if (review.user.toString() === req.user.id) {
      return next(
        new ErrorResponse('You cannot vote on your own review.', 400)
      );
    }

    // Already voted check
    const alreadyVoted = review.helpfulVotes.find(
      (vote) => vote.user.toString() === req.user.id
    );

    if (alreadyVoted) {
      // Remove vote (toggle)
      review.helpfulVotes = review.helpfulVotes.filter(
        (vote) => vote.user.toString() !== req.user.id
      );
      review.helpfulCount = review.helpfulVotes.length;
      await review.save();

      return res.status(200).json({
        success: true,
        message: '✅ Helpful vote removed!',
        helpfulCount: review.helpfulCount,
        isHelpful: false,
      });
    }

    // Add vote
    review.helpfulVotes.push({ user: req.user.id });
    review.helpfulCount = review.helpfulVotes.length;
    await review.save();

    res.status(200).json({
      success: true,
      message: '✅ Marked as helpful!',
      helpfulCount: review.helpfulCount,
      isHelpful: true,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Check if user can review a product
// @route   GET /api/v1/reviews/can-review/:productId
// @access  Private
// ══════════════════════════════════════════════
export const canReview = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Already reviewed?
    const existingReview = await Review.findOne({
      user: req.user.id,
      product: productId,
    });

    if (existingReview) {
      return res.status(200).json({
        success: true,
        canReview: false,
        reason: 'already_reviewed',
        existingReview: existingReview._id,
      });
    }

    // Has purchased?
    const hasPurchased = await Order.findOne({
      user: req.user.id,
      'orderItems.product': productId,
      orderStatus: 'delivered',
    });

    res.status(200).json({
      success: true,
      canReview: true,
      isVerifiedPurchase: !!hasPurchased,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════════════
//              ADMIN ONLY ENDPOINTS
// ══════════════════════════════════════════════════════

// ══════════════════════════════════════════════
// @desc    Get all reviews (Admin)
// @route   GET /api/v1/reviews
// @access  Private/Admin
// ══════════════════════════════════════════════
export const getAllReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const approved = req.query.approved;

    const filter = {};
    if (approved !== undefined) {
      filter.isApproved = approved === 'true';
    }

    const total = await Review.countDocuments(filter);

    const reviews = await Review.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('product', 'name slug');

    res.status(200).json({
      success: true,
      message: '✅ All reviews fetched!',
      count: reviews.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Approve/Reject review (Admin)
// @route   PUT /api/v1/reviews/:id/approve
// @access  Private/Admin
// ══════════════════════════════════════════════
export const approveReview = async (req, res, next) => {
  try {
    const { isApproved } = req.body;

    if (isApproved === undefined) {
      return next(new ErrorResponse('isApproved field is required.', 400));
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(new ErrorResponse('Review not found.', 404));
    }

    review.isApproved = isApproved;
    await review.save();

    const status = isApproved ? 'approved' : 'rejected';

    res.status(200).json({
      success: true,
      message: `✅ Review ${status} successfully!`,
      review: {
        _id: review._id,
        isApproved: review.isApproved,
        rating: review.rating,
        comment: review.comment,
      },
    });
  } catch (error) {
    next(error);
  }
};