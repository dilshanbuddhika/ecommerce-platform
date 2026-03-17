// ============================================
// CLOUDINARY CONFIGURATION - Image Uploads
// ============================================
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Cloudinary configure කරන්න
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Product images සඳහා storage
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce/products',        // Cloudinary folder name
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'limit' },  // Max size 800x800
      { quality: 'auto' },                           // Auto quality
      { fetch_format: 'auto' }                       // Auto format
    ],
  },
});

// User avatar සඳහා storage
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'face' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ],
  },
});

// File filter - images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('❌ Only image files are allowed!'), false);
  }
};

// Multer upload instances
export const uploadProductImages = multer({
  storage: productStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB max per file
    files: 5                     // Maximum 5 files
  }
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,  // 2MB max
    files: 1                     // 1 file only
  }
});

// Delete image from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️  Cloudinary image deleted: ${publicId}`);
    return result;
  } catch (error) {
    console.error(`❌ Cloudinary delete error: ${error.message}`);
    throw error;
  }
};

// Extract public ID from Cloudinary URL
export const getPublicIdFromUrl = (url) => {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  const folder = parts[parts.length - 2];
  const publicId = `${folder}/${fileName.split('.')[0]}`;
  return publicId;
};

export default cloudinary;