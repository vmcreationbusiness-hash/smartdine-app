const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  restaurantName: {
    type: String,
    required: true,
    default: 'SmartDine India'
  },
  address: {
    type: String,
    default: ''
  },
  contactNumber: {
    type: String,
    default: ''
  },
  GSTNumber: {
    type: String,
    default: ''
  },
  UPI_ID: {
    type: String,
    default: ''
  },
  sgstPercent: {
    type: Number,
    default: 2.5,
    min: 0,
    max: 100
  },
  cgstPercent: {
    type: Number,
    default: 2.5,
    min: 0,
    max: 100
  },
  // Theme customization
  logo: {
    type: String,
    default: ''
  },
  backgroundImage: {
    type: String,
    default: 'https://customer-assets.emergentagent.com/job_dine-payment-flow/artifacts/kficyfx7_Nandhana%20Palace.jpg'
  },
  backgroundColor: {
    type: String,
    default: '#FFF8E1'
  },
  primaryColor: {
    type: String,
    default: '#E65100'
  },
  secondaryColor: {
    type: String,
    default: '#F57F17'
  },
  accentColor: {
    type: String,
    default: '#B71C1C'
  },
  overlayOpacity: {
    type: Number,
    default: 0.92,
    min: 0,
    max: 1
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
