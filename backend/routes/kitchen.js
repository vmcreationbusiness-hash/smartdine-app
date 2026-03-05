const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { authMiddleware, roleCheck } = require('../middleware/auth');

// Get all orders for kitchen
router.get('/orders', authMiddleware, roleCheck('kitchen'), async (req, res) => {
  try {
    const orders = await Order.find({
      orderStatus: { $in: ['Ordered', 'Preparing', 'Ready'] }
    }).sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status (Kitchen only)
router.put('/orders/:orderId/status', authMiddleware, roleCheck('kitchen'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!['Preparing', 'Ready'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.orderStatus = status;
    order.statusHistory.push({
      status,
      updatedBy: req.user.username,
      role: req.user.role,
      timestamp: new Date()
    });

    await order.save();

    // Emit real-time event
    const io = req.app.get('io');
    if (status === 'Preparing') {
      io.emit('orderPreparing', order);
    } else if (status === 'Ready') {
      io.emit('orderReady', order);
    }

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
