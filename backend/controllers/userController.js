// ============================================
// USER MANAGEMENT CONTROLLER
// ============================================
import User from '../models/User.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import sendTokenResponse from '../utils/generateToken.js';

// ══════════════════════════════════════════════
// @desc    Get current user profile
// @route   GET /api/v1/users/profile
// @access  Private
// ══════════════════════════════════════════════
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ErrorResponse('User not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: '✅ Profile fetched successfully!',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
// ══════════════════════════════════════════════
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    // Update කරන්න allowed fields only
    const updateFields = {};
    if (name) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;

    // Empty check
    if (Object.keys(updateFields).length === 0) {
      return next(new ErrorResponse('Please provide fields to update.', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      {
        new: true,           // Updated document return කරන්න
        runValidators: true, // Validation run කරන්න
      }
    );

    if (!user) {
      return next(new ErrorResponse('User not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: '✅ Profile updated successfully!',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Upload/Update avatar
// @route   PUT /api/v1/users/avatar
// @access  Private
// ══════════════════════════════════════════════
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ErrorResponse('Please upload an image file.', 400));
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ErrorResponse('User not found.', 404));
    }

    // Cloudinary URL from multer upload
    user.avatar = {
      public_id: req.file.filename || req.file.public_id || 'avatar_' + req.user.id,
      url: req.file.path || req.file.secure_url || req.file.url,
    };

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: '✅ Avatar updated successfully!',
      avatar: user.avatar,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Add new address
// @route   POST /api/v1/users/addresses
// @access  Private
// ══════════════════════════════════════════════
export const addAddress = async (req, res, next) => {
  try {
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = req.body;

    // Required fields check
    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      return next(
        new ErrorResponse('Please provide all required address fields.', 400)
      );
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ErrorResponse('User not found.', 404));
    }

    // Maximum 5 addresses
    if (user.addresses.length >= 5) {
      return next(
        new ErrorResponse('Maximum 5 addresses allowed. Please delete one first.', 400)
      );
    }

    // isDefault true නම් අනිත් ඒවා false කරන්න
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    // First address නම් auto default
    const newAddress = {
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || '',
      city,
      state,
      postalCode,
      country: country || 'Sri Lanka',
      isDefault: user.addresses.length === 0 ? true : isDefault || false,
    };

    user.addresses.push(newAddress);
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: '✅ Address added successfully!',
      addresses: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get all addresses
// @route   GET /api/v1/users/addresses
// @access  Private
// ══════════════════════════════════════════════
export const getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ErrorResponse('User not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: '✅ Addresses fetched successfully!',
      count: user.addresses.length,
      addresses: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Update address
// @route   PUT /api/v1/users/addresses/:addressId
// @access  Private
// ══════════════════════════════════════════════
export const updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ErrorResponse('User not found.', 404));
    }

    // Address find කරන්න
    const address = user.addresses.id(req.params.addressId);

    if (!address) {
      return next(new ErrorResponse('Address not found.', 404));
    }

    // Update fields
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = req.body;

    if (fullName) address.fullName = fullName;
    if (phone) address.phone = phone;
    if (addressLine1) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (city) address.city = city;
    if (state) address.state = state;
    if (postalCode) address.postalCode = postalCode;
    if (country) address.country = country;

    // isDefault set කරනවනම් අනිත් ඒවා false කරන්න
    if (isDefault === true) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
      address.isDefault = true;
    }

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: '✅ Address updated successfully!',
      addresses: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Delete address
// @route   DELETE /api/v1/users/addresses/:addressId
// @access  Private
// ══════════════════════════════════════════════
export const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ErrorResponse('User not found.', 404));
    }

    // Address find කරන්න
    const address = user.addresses.id(req.params.addressId);

    if (!address) {
      return next(new ErrorResponse('Address not found.', 404));
    }

    // Address remove
    address.deleteOne();

    // Deleted address එක default උනානම් first address එක default කරන්න
    if (address.isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: '✅ Address deleted successfully!',
      addresses: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Set default address
// @route   PUT /api/v1/users/addresses/:addressId/default
// @access  Private
// ══════════════════════════════════════════════
export const setDefaultAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ErrorResponse('User not found.', 404));
    }

    const address = user.addresses.id(req.params.addressId);

    if (!address) {
      return next(new ErrorResponse('Address not found.', 404));
    }

    // සියලුම addresses false කරන්න
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });

    // Selected address default කරන්න
    address.isDefault = true;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: '✅ Default address updated!',
      addresses: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Delete own account (Soft delete)
// @route   DELETE /api/v1/users/account
// @access  Private
// ══════════════════════════════════════════════
export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return next(
        new ErrorResponse('Please provide your password to confirm deletion.', 400)
      );
    }

    // User with password field
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return next(new ErrorResponse('User not found.', 404));
    }

    // Google account check
    if (user.authProvider === 'google' && !user.password) {
      // Google accounts - soft delete without password
      user.isActive = false;
      user.email = `deleted_${Date.now()}_${user.email}`;
      await user.save({ validateBeforeSave: false });

      res.cookie('token', 'none', {
        expires: new Date(Date.now() + 5 * 1000),
        httpOnly: true,
      });

      return res.status(200).json({
        success: true,
        message: '✅ Account deactivated successfully.',
      });
    }

    // Password verify
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Incorrect password.', 401));
    }

    // Soft delete - account deactivate කරන්න
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save({ validateBeforeSave: false });

    // Cookie clear
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 5 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: '✅ Account deactivated successfully. Sorry to see you go!',
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════════════
//              ADMIN ONLY ENDPOINTS
// ══════════════════════════════════════════════════════

// ══════════════════════════════════════════════
// @desc    Get all users (Admin)
// @route   GET /api/v1/users
// @access  Private/Admin
// ══════════════════════════════════════════════
export const getAllUsers = async (req, res, next) => {
  try {
    // Query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const sort = req.query.sort || '-createdAt';

    // Filter build
    const filter = {};

    // Search by name or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by role
    if (role && ['user', 'admin'].includes(role)) {
      filter.role = role;
    }

    // Total count
    const total = await User.countDocuments(filter);

    // Users fetch
    const users = await User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-__v');

    res.status(200).json({
      success: true,
      message: '✅ Users fetched successfully!',
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Get single user by ID (Admin)
// @route   GET /api/v1/users/:id
// @access  Private/Admin
// ══════════════════════════════════════════════
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse('User not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: '✅ User fetched successfully!',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Update user role (Admin)
// @route   PUT /api/v1/users/:id/role
// @access  Private/Admin
// ══════════════════════════════════════════════
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return next(
        new ErrorResponse('Please provide a valid role (user or admin).', 400)
      );
    }

    // Self role change prevent
    if (req.params.id === req.user.id) {
      return next(
        new ErrorResponse('You cannot change your own role.', 400)
      );
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse('User not found.', 404));
    }

    user.role = role;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `✅ User role updated to '${role}' successfully!`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Activate/Deactivate user (Admin)
// @route   PUT /api/v1/users/:id/status
// @access  Private/Admin
// ══════════════════════════════════════════════
export const toggleUserStatus = async (req, res, next) => {
  try {
    // Self deactivate prevent
    if (req.params.id === req.user.id) {
      return next(
        new ErrorResponse('You cannot deactivate your own account.', 400)
      );
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse('User not found.', 404));
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    const status = user.isActive ? 'activated' : 'deactivated';

    res.status(200).json({
      success: true,
      message: `✅ User ${status} successfully!`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Delete user permanently (Admin)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
// ══════════════════════════════════════════════
export const deleteUser = async (req, res, next) => {
  try {
    // Self delete prevent
    if (req.params.id === req.user.id) {
      return next(
        new ErrorResponse('You cannot delete your own account from here.', 400)
      );
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse('User not found.', 404));
    }

    // Admin delete prevent (another admin needed)
    if (user.role === 'admin') {
      return next(
        new ErrorResponse('Cannot delete an admin account.', 400)
      );
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: '✅ User deleted permanently!',
    });
  } catch (error) {
    next(error);
  }
};