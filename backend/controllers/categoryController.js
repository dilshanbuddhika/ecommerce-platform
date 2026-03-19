// ============================================
// CATEGORY CONTROLLER
// ============================================
import Category from '../models/Category.js';
import ErrorResponse from '../utils/ErrorResponse.js';

// ══════════════════════════════════════════════
// @desc    Create category
// @route   POST /api/v1/categories
// @access  Private/Admin
// ══════════════════════════════════════════════
export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return next(new ErrorResponse('Category name is required.', 400));
    }

    // Duplicate check
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });

    if (existing) {
      return next(new ErrorResponse('Category already exists.', 400));
    }

    const category = await Category.create({
      name,
      description: description || '',
    });

    res.status(201).json({
      success: true,
      message: '✅ Category created successfully!',
      category,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
// ══════════════════════════════════════════════
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort('name')
      .populate('productCount');

    res.status(200).json({
      success: true,
      message: '✅ Categories fetched successfully!',
      count: categories.length,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get single category
// @route   GET /api/v1/categories/:id
// @access  Public
// ══════════════════════════════════════════════
export const getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      'productCount'
    );

    if (!category) {
      return next(new ErrorResponse('Category not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: '✅ Category fetched successfully!',
      category,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Update category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
// ══════════════════════════════════════════════
export const updateCategory = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(new ErrorResponse('Category not found.', 404));
    }

    // Duplicate name check (different category)
    if (name && name !== category.name) {
      const existing = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id },
      });

      if (existing) {
        return next(new ErrorResponse('Category name already exists.', 400));
      }
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.status(200).json({
      success: true,
      message: '✅ Category updated successfully!',
      category,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
// ══════════════════════════════════════════════
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(new ErrorResponse('Category not found.', 404));
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: '✅ Category deleted successfully!',
    });
  } catch (error) {
    next(error);
  }
};