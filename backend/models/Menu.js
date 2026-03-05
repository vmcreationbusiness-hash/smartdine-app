const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String, default: '' },
  priceINR: { type: Number, required: true },
  available: { type: Boolean, default: true },
  category: { type: String, default: '' },
  createdBy: { type: String, default: 'system' },
  createdAt: { type: Date, default: Date.now },
  // Multi-language support for name and description
  translations: {
    hi: { name: String, description: String },
    kn: { name: String, description: String },
    te: { name: String, description: String },
    ta: { name: String, description: String },
    ml: { name: String, description: String },
  }
});

module.exports = mongoose.model('Menu', menuSchema);
