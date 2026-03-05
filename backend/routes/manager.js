const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const Menu = require('../models/Menu');
const { uploadBase64ToCloudinary, isCloudinaryConfigured } = require('../utils/cloudinary');

// Helper: upload base64 to Cloudinary or return as-is
const processSettingImage = async (image, folder) => {
  if (!image) return image;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  if (isCloudinaryConfigured()) return await uploadBase64ToCloudinary(image, folder);
  return image;
};
const { authMiddleware, roleCheck } = require('../middleware/auth');

// Get restaurant settings
router.get('/settings', authMiddleware, roleCheck('manager'), async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create default settings
      settings = new Settings({
        restaurantName: 'SmartDine India',
        address: '',
        contactNumber: '',
        GSTNumber: '',
        UPI_ID: '',
        backgroundImage: 'https://customer-assets.emergentagent.com/job_dine-payment-flow/artifacts/kficyfx7_Nandhana%20Palace.jpg'
      });
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get public theme settings (no auth required)
router.get('/theme', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    
    res.json({
      restaurantName: settings.restaurantName,
      logo: settings.logo,
      backgroundImage: settings.backgroundImage,
      backgroundColor: settings.backgroundColor,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      overlayOpacity: settings.overlayOpacity,
      sgstPercent: settings.sgstPercent,
      cgstPercent: settings.cgstPercent
    });
  } catch (error) {
    console.error('Error fetching theme:', error);
    res.status(500).json({ error: 'Failed to fetch theme' });
  }
});

// Update restaurant settings
router.put('/settings', authMiddleware, roleCheck('manager'), async (req, res) => {
  try {
    const updates = req.body;
    updates.updatedAt = new Date();

    // Upload logo and background to Cloudinary if they are base64
    if (updates.logo) {
      updates.logo = await processSettingImage(updates.logo, 'smartdine/logos');
    }
    if (updates.backgroundImage) {
      updates.backgroundImage = await processSettingImage(updates.backgroundImage, 'smartdine/backgrounds');
    }

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings(updates);
    } else {
      Object.assign(settings, updates);
    }
    
    await settings.save();
    
    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get all orders (with filters)
router.get('/orders', authMiddleware, roleCheck('manager'), async (req, res) => {
  try {
    const { status, paymentStatus, date } = req.query;
    
    let filter = {};
    
    if (status) {
      filter.orderStatus = status;
    }
    
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.createdAt = { $gte: startDate, $lt: endDate };
    }
    
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching manager orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get daily report
router.get('/reports/daily', authMiddleware, roleCheck('manager'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let filter = {};
    
    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: end
      };
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filter.createdAt = { $gte: today, $lt: tomorrow };
    }
    
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    
    const totalRevenue = orders
      .filter(o => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + (o.finalAmount || o.totalAmount), 0);
    
    const stats = {
      totalOrders: orders.length,
      paidOrders: orders.filter(o => o.paymentStatus === 'Paid').length,
      unpaidOrders: orders.filter(o => o.paymentStatus === 'Unpaid').length,
      totalRevenue,
      orders
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching daily report:', error);
    res.status(500).json({ error: 'Failed to fetch daily report' });
  }
});

// Get invoice for specific order
router.get('/invoice/:orderId', authMiddleware, roleCheck('manager'), async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const settings = await Settings.findOne();
    
    res.json({
      order,
      restaurant: settings || {
        restaurantName: 'SmartDine India',
        address: '',
        contactNumber: '',
        GSTNumber: ''
      }
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Get all menu items (Manager view)
router.get('/menu', authMiddleware, roleCheck('manager'), async (req, res) => {
  try {
    const menuItems = await Menu.find().sort({ createdAt: -1 });
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

module.exports = router;
