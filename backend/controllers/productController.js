// ============================================
// PRODUCT CONTROLLER
// ============================================
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import ApiFeatures from '../utils/apiFeatures.js';

// ══════════════════════════════════════════════
// @desc    Create product
// @route   POST /api/v1/products
// @access  Private/Admin
// ══════════════════════════════════════════════
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      shortDescription,
      price,
      comparePrice,
      category,
      stock,
      brand,
      tags,
      specifications,
      isFeatured,
    } = req.body;

    // Required fields check
    if (!name || !description || !price || !category) {
      return next(
        new ErrorResponse('Name, description, price and category are required.', 400)
      );
    }

    // Category exists check
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return next(new ErrorResponse('Category not found.', 404));
    }

    // Images handle (Cloudinary upload ආවොත්)
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => ({
        public_id: file.filename || file.public_id,
        url: file.path || file.secure_url || file.url,
      }));
    }

    // Default image (images upload නොකළොත්)
    if (images.length === 0) {
      images = [
        {
          public_id: 'default_product',
          url: 'https://res.cloudinary.com/demo/image/upload/v1/default-product.png',
        },
      ];
    }

    // Product create
    const product = await Product.create({
      name,
      description,
      shortDescription: shortDescription || '',
      price,
      comparePrice: comparePrice || 0,
      category,
      images,
      stock: stock || 0,
      brand: brand || '',
      tags: tags || [],
      specifications: specifications || [],
      isFeatured: isFeatured || false,
      createdBy: req.user.id,
    });

    // Populate category info
    await product.populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: '✅ Product created successfully!',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get all products (with search, filter, sort, pagination)
// @route   GET /api/v1/products
// @access  Public
// ══════════════════════════════════════════════
export const getProducts = async (req, res, next) => {
  try {
    // Total count (for pagination)
    const totalProducts = await Product.countDocuments({ isActive: true });

    // API Features apply
    const apiFeatures = new ApiFeatures(Product.find(), req.query)
      .search()
      .filter()
      .sort()
      .selectFields()
      .paginate();

    // Execute query with populate
    const products = await apiFeatures.query
      .populate('category', 'name slug')
      .populate('createdBy', 'name');

    // Filtered count
    const filteredCount = products.length;

    res.status(200).json({
      success: true,
      message: '✅ Products fetched successfully!',
      count: filteredCount,
      total: totalProducts,
      totalPages: Math.ceil(totalProducts / (parseInt(req.query.limit) || 12)),
      currentPage: parseInt(req.query.page) || 1,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
// ══════════════════════════════════════════════
export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('createdBy', 'name');

    if (!product) {
      return next(new ErrorResponse('Product not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: '✅ Product fetched successfully!',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get product by slug
// @route   GET /api/v1/products/slug/:slug
// @access  Public
// ══════════════════════════════════════════════
export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate('category', 'name slug')
      .populate('createdBy', 'name');

    if (!product) {
      return next(new ErrorResponse('Product not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: '✅ Product fetched successfully!',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
// ══════════════════════════════════════════════
export const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorResponse('Product not found.', 404));
    }

    const {
      name,
      description,
      shortDescription,
      price,
      comparePrice,
      category,
      stock,
      brand,
      tags,
      specifications,
      isFeatured,
      isActive,
    } = req.body;

    // Category check (update කරනවනම්)
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return next(new ErrorResponse('Category not found.', 404));
      }
    }

    // Update fields
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (price !== undefined) updateData.price = price;
    if (comparePrice !== undefined) updateData.comparePrice = comparePrice;
    if (category) updateData.category = category;
    if (stock !== undefined) updateData.stock = stock;
    if (brand !== undefined) updateData.brand = brand;
    if (tags) updateData.tags = tags;
    if (specifications) updateData.specifications = specifications;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (isActive !== undefined) updateData.isActive = isActive;

    // New images upload (optional)
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({
        public_id: file.filename || file.public_id,
        url: file.path || file.secure_url || file.url,
      }));
      updateData.images = newImages;
    }

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'name slug')
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      message: '✅ Product updated successfully!',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
// ══════════════════════════════════════════════
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorResponse('Product not found.', 404));
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: '✅ Product deleted successfully!',
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get featured products
// @route   GET /api/v1/products/featured
// @access  Public
// ══════════════════════════════════════════════
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const products = await Product.find({ isFeatured: true, isActive: true })
      .sort('-createdAt')
      .limit(limit)
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      message: '✅ Featured products fetched!',
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get latest products
// @route   GET /api/v1/products/latest
// @access  Public
// ══════════════════════════════════════════════
export const getLatestProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const products = await Product.find({ isActive: true })
      .sort('-createdAt')
      .limit(limit)
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      message: '✅ Latest products fetched!',
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get top rated products
// @route   GET /api/v1/products/top-rated
// @access  Public
// ══════════════════════════════════════════════
export const getTopRatedProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const products = await Product.find({
      isActive: true,
      ratingsCount: { $gt: 0 },
    })
      .sort('-ratingsAverage -ratingsCount')
      .limit(limit)
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      message: '✅ Top rated products fetched!',
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get products by category
// @route   GET /api/v1/products/category/:categoryId
// @access  Public
// ══════════════════════════════════════════════
export const getProductsByCategory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Category check
    const category = await Category.findById(req.params.categoryId);
    if (!category) {
      return next(new ErrorResponse('Category not found.', 404));
    }

    const total = await Product.countDocuments({
      category: req.params.categoryId,
      isActive: true,
    });

    const products = await Product.find({
      category: req.params.categoryId,
      isActive: true,
    })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      message: `✅ Products in '${category.name}' fetched!`,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      category: category.name,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Update product stock (Admin)
// @route   PUT /api/v1/products/:id/stock
// @access  Private/Admin
// ══════════════════════════════════════════════
export const updateStock = async (req, res, next) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return next(new ErrorResponse('Please provide a valid stock value.', 400));
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true, runValidators: true }
    );

    if (!product) {
      return next(new ErrorResponse('Product not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: '✅ Stock updated successfully!',
      product: {
        _id: product._id,
        name: product.name,
        stock: product.stock,
        inStock: product.stock > 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get low stock products (Admin)
// @route   GET /api/v1/products/low-stock
// @access  Private/Admin
// ══════════════════════════════════════════════
export const getLowStockProducts = async (req, res, next) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;

    const products = await Product.find({
      stock: { $lte: threshold },
      isActive: true,
    })
      .sort('stock')
      .select('name stock sku price category')
      .populate('category', 'name');

    res.status(200).json({
      success: true,
      message: '✅ Low stock products fetched!',
      threshold,
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
};