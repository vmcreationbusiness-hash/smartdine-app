const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  tableNumber: {
    type: String,
    required: true
  },
  items: [{
    name: String,
    quantity: Number,
    price: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  pointsUsed: {
    type: Number,
    default: 0
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  sgstAmount: {
    type: Number,
    default: 0
  },
  cgstAmount: {
    type: Number,
    default: 0
  },
  sgstPercent: {
    type: Number,
    default: 2.5
  },
  cgstPercent: {
    type: Number,
    default: 2.5
  },
  finalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Paid'],
    default: 'Unpaid'
  },
  paymentMode: {
    type: String,
    enum: [null, 'UPI', 'Card', 'Wallet'],
    default: null
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpayOrderId: {
    type: String,
    default: null
  },
  orderStatus: {
    type: String,
    enum: ['Ordered', 'Preparing', 'Ready', 'Delivered'],
    default: 'Ordered'
  },
  statusHistory: [{
    status: String,
    updatedBy: String,
    role: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
