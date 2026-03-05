const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware, roleCheck } = require('../middleware/auth');
const { uploadToCloudinary, uploadBase64ToCloudinary, isCloudinaryConfigured } = require('../utils/cloudinary');

// Use memory storage — files are kept in buffer, not saved to disk
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// POST /api/upload/image — Upload a file directly (multipart/form-data)
router.post('/image', authMiddleware, roleCheck('manager'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!isCloudinaryConfigured()) {
      // Fallback: return base64 if Cloudinary not configured
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      return res.json({ url: base64, source: 'base64_fallback' });
    }

    const folder = req.body.folder || 'smartdine/menu';
    const result = await uploadToCloudinary(req.file.buffer, folder);

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      source: 'cloudinary'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// POST /api/upload/base64 — Upload a base64 image string
router.post('/base64', authMiddleware, roleCheck('manager'), async (req, res) => {
  try {
    const { image, folder } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    if (!isCloudinaryConfigured()) {
      // Fallback: return the base64 as-is if Cloudinary not configured
      return res.json({ url: image, source: 'base64_fallback' });
    }

    const uploadFolder = folder || 'smartdine/menu';
    const url = await uploadBase64ToCloudinary(image, uploadFolder);

    res.json({ url, source: 'cloudinary' });
  } catch (error) {
    console.error('Base64 upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// POST /api/upload/logo — Upload restaurant logo
router.post('/logo', authMiddleware, roleCheck('manager'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!isCloudinaryConfigured()) {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      return res.json({ url: base64, source: 'base64_fallback' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'smartdine/logos', {
      transformation: [{ width: 400, height: 400, crop: 'pad', quality: 'auto', fetch_format: 'auto' }]
    });

    res.json({ url: result.secure_url, publicId: result.public_id, source: 'cloudinary' });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// POST /api/upload/background — Upload restaurant background image
router.post('/background', authMiddleware, roleCheck('manager'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!isCloudinaryConfigured()) {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      return res.json({ url: base64, source: 'base64_fallback' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'smartdine/backgrounds', {
      transformation: [{ width: 1920, height: 1080, crop: 'fill', quality: 'auto:low', fetch_format: 'auto' }]
    });

    res.json({ url: result.secure_url, publicId: result.public_id, source: 'cloudinary' });
  } catch (error) {
    console.error('Background upload error:', error);
    res.status(500).json({ error: 'Failed to upload background image' });
  }
});

module.exports = router;
