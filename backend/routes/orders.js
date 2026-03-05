const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { authMiddleware, roleCheck } = require('../middleware/auth');
const crypto = require('crypto');

// Check if using placeholder keys
const isPlaceholderKeys = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  return !keyId || 
         keyId === 'rzp_test_placeholder' ||
         keyId === 'your_razorpay_key_id' ||
         keyId.includes('placeholder') ||
         keyId.includes('your_');
};

// Only initialize Razorpay if real keys are provided
let razorpay = null;
if (!isPlaceholderKeys()) {
  const Razorpay = require('razorpay');
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// Place order (Customer only)
router.post('/', authMiddleware, roleCheck('customer'), async (req, res) => {
  try {
    const { tableNumber, items, totalAmount, pointsUsed } = req.body;

    if (!tableNumber || !items || items.length === 0 || !totalAmount) {
      return res.status(400).json({ error: 'Table number, items, and total amount are required' });
    }

    // Get customer to check loyalty points
    const User = require('../models/User');
    const customer = await User.findById(req.user.userId);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Validate points redemption
    const pointsToUse = pointsUsed || 0;
    if (pointsToUse > customer.loyaltyPoints) {
      return res.status(400).json({ error: 'Insufficient loyalty points' });
    }

    // Calculate discount (100 points = Rs 100)
    const discount = pointsToUse;
    const maxDiscount = totalAmount * 0.5; // Max 50% discount
    const finalDiscount = Math.min(discount, maxDiscount);
    const afterDiscount = Math.max(totalAmount - finalDiscount, 0);

    // Calculate GST from settings
    const Settings = require('../models/Settings');
    const settings = await Settings.findOne();
    const sgstPercent = settings?.sgstPercent ?? 2.5;
    const cgstPercent = settings?.cgstPercent ?? 2.5;
    const sgstAmount = Math.round(afterDiscount * sgstPercent / 100 * 100) / 100;
    const cgstAmount = Math.round(afterDiscount * cgstPercent / 100 * 100) / 100;
    const finalAmount = Math.round((afterDiscount + sgstAmount + cgstAmount) * 100) / 100;

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = new Order({
      orderId,
      customerId: req.user.userId,
      customerName: customer.name || req.user.name || req.user.username,
      tableNumber,
      items,
      totalAmount,
      pointsUsed: pointsToUse,
      discount: finalDiscount,
      sgstAmount,
      cgstAmount,
      sgstPercent,
      cgstPercent,
      finalAmount,
      paymentStatus: 'Unpaid',
      orderStatus: 'Ordered',
      statusHistory: [{
        status: 'Ordered',
        updatedBy: req.user.username,
        role: req.user.role,
        timestamp: new Date()
      }]
    });

    await order.save();

    // Deduct points if used
    if (pointsToUse > 0) {
      customer.loyaltyPoints -= pointsToUse;
      await customer.save();
    }

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('orderPlaced', order);

    res.status(201).json({ 
      message: 'Order placed successfully', 
      order,
      remainingPoints: customer.loyaltyPoints
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Get customer's orders
router.get('/my-orders', authMiddleware, roleCheck('customer'), async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get customer loyalty info
router.get('/loyalty-info', authMiddleware, roleCheck('customer'), async (req, res) => {
  try {
    const User = require('../models/User');
    const customer = await User.findById(req.user.userId);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({
      loyaltyPoints: customer.loyaltyPoints,
      totalPointsEarned: customer.totalPointsEarned,
      pointsValue: customer.loyaltyPoints, // 1 point = ₹1
      conversionRate: '1 point = ₹1 discount'
    });
  } catch (error) {
    console.error('Error fetching loyalty info:', error);
    res.status(500).json({ error: 'Failed to fetch loyalty info' });
  }
});

// Create Razorpay order (Customer or Manager - only when status is Ready)
router.post('/create-payment-order/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    let order;
    if (req.user.role === 'manager') {
      order = await Order.findOne({ orderId });
    } else if (req.user.role === 'customer') {
      order = await Order.findOne({ orderId, customerId: req.user.userId });
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.orderStatus !== 'Ready') {
      return res.status(400).json({ error: 'Payment not allowed. Order must be Ready' });
    }

    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ error: 'Order already paid' });
    }

    // Check if using placeholder keys (demo mode)
    const useDemoMode = isPlaceholderKeys();

    // Always use demo mode if keys are placeholders
    console.log('Payment order creation - Demo mode:', useDemoMode);

    if (useDemoMode) {
      // Demo mode - generate mock order ID
      const mockOrderId = `order_demo_${Date.now()}`;
      order.razorpayOrderId = mockOrderId;
      await order.save();

      console.log('Demo payment order created:', mockOrderId);

      res.json({
        razorpayOrderId: mockOrderId,
        amount: order.finalAmount,
        currency: 'INR',
        keyId: 'rzp_test_demo',
        demoMode: true
      });
    } else {
      // Real Razorpay integration
      try {
        const razorpayOrder = await razorpay.orders.create({
          amount: order.finalAmount * 100, // Convert to paise
          currency: 'INR',
          receipt: orderId.substring(0, 40),
          payment_capture: 1
        });

        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        res.json({
          razorpayOrderId: razorpayOrder.id,
          amount: order.finalAmount,
          currency: 'INR',
          keyId: process.env.RAZORPAY_KEY_ID,
          demoMode: false
        });
      } catch (razorpayError) {
        console.error('Razorpay API error, falling back to demo mode:', razorpayError.message);
        
        // Fallback to demo mode if Razorpay fails
        const mockOrderId = `order_demo_${Date.now()}`;
        order.razorpayOrderId = mockOrderId;
        await order.save();

        res.json({
          razorpayOrderId: mockOrderId,
          amount: order.finalAmount,
          currency: 'INR',
          keyId: 'rzp_test_demo',
          demoMode: true
        });
      }
    }
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify payment and update order
router.post('/verify-payment/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, paymentMode, demoMode } = req.body;

    let order;
    if (req.user.role === 'manager') {
      order = await Order.findOne({ orderId });
    } else if (req.user.role === 'customer') {
      order = await Order.findOne({ orderId, customerId: req.user.userId });
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    let isAuthentic = false;

    if (demoMode) {
      // Demo mode - always authenticate
      isAuthentic = true;
    } else {
      // Verify signature for real payments
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
        .update(body.toString())
        .digest('hex');

      isAuthentic = expectedSignature === razorpaySignature;
    }

    if (isAuthentic) {
      // Calculate loyalty points earned (1 point per ₹10 spent)
      const pointsEarned = Math.floor(order.finalAmount / 10);

      order.paymentStatus = 'Paid';
      order.razorpayPaymentId = razorpayPaymentId || `pay_demo_${Date.now()}`;
      order.paymentMode = paymentMode || 'UPI';
      order.orderStatus = 'Delivered';
      order.pointsEarned = pointsEarned;
      order.statusHistory.push({
        status: 'Delivered',
        updatedBy: req.user.username,
        role: req.user.role,
        timestamp: new Date()
      });
      await order.save();

      // Award loyalty points to customer
      const User = require('../models/User');
      const customer = await User.findById(req.user.userId);
      if (customer) {
        customer.loyaltyPoints += pointsEarned;
        customer.totalPointsEarned += pointsEarned;
        await customer.save();
      }

      // Emit real-time event
      const io = req.app.get('io');
      io.emit('paymentCompleted', order);

      res.json({ 
        message: 'Payment verified successfully', 
        order,
        pointsEarned,
        totalPoints: customer ? customer.loyaltyPoints : 0
      });
    } else {
      res.status(400).json({ error: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Get invoice data for an order (Customer or Manager)
router.get('/invoice/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    let order;
    if (req.user.role === 'manager') {
      order = await Order.findOne({ orderId });
    } else if (req.user.role === 'customer') {
      order = await Order.findOne({ orderId, customerId: req.user.userId });
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const Settings = require('../models/Settings');
    const settings = await Settings.findOne();
    res.json({
      order,
      restaurant: {
        restaurantName: settings?.restaurantName || 'SmartDine India',
        address: settings?.address || '',
        contactNumber: settings?.contactNumber || '',
        GSTNumber: settings?.GSTNumber || '',
        UPI_ID: settings?.UPI_ID || ''
      }
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

module.exports = router;
