const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder name
 * @param {Object} options - Additional Cloudinary upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = (buffer, folder = 'smartdine', options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 600, crop: 'fill', quality: 'auto', fetch_format: 'auto' }
        ],
        ...options
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Upload a base64 image string to Cloudinary
 * @param {string} base64String - Base64 encoded image (with or without data URI prefix)
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<string>} Secure URL of uploaded image
 */
const uploadBase64ToCloudinary = async (base64String, folder = 'smartdine') => {
  // If it's already a URL (not base64), return as-is
  if (base64String.startsWith('http://') || base64String.startsWith('https://')) {
    return base64String;
  }

  // Upload base64 directly to Cloudinary
  const result = await cloudinary.uploader.upload(base64String, {
    folder,
    resource_type: 'image',
    transformation: [
      { width: 800, height: 600, crop: 'fill', quality: 'auto', fetch_format: 'auto' }
    ]
  });

  return result.secure_url;
};

/**
 * Delete an image from Cloudinary by URL
 * @param {string} imageUrl - The Cloudinary image URL
 */
const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) return;
  try {
    // Extract public_id from URL
    const parts = imageUrl.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${filename}`;
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Failed to delete image from Cloudinary:', error.message);
  }
};

/**
 * Check if Cloudinary is configured
 */
const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name'
  );
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadBase64ToCloudinary,
  deleteFromCloudinary,
  isCloudinaryConfigured
};
