const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./models/Order');

dotenv.config();

const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;

async function migrate() {
  try {
    await mongoose.connect(`${mongoUrl}/${dbName}`);
    console.log('✅ Connected to MongoDB');

    // Find all orders that don't have finalAmount set
    const orders = await Order.find({ 
      $or: [
        { finalAmount: { $exists: false } },
        { finalAmount: null }
      ]
    });

    console.log(`Found ${orders.length} orders to update`);

    for (const order of orders) {
      order.finalAmount = order.totalAmount;
      order.pointsUsed = order.pointsUsed || 0;
      order.discount = order.discount || 0;
      order.pointsEarned = order.pointsEarned || 0;
      await order.save();
    }

    console.log(`✅ Updated ${orders.length} orders with finalAmount`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrate();
