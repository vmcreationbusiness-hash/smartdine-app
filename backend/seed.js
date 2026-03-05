const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const User = require('./models/User');
const Settings = require('./models/Settings');

dotenv.config();

const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;

async function seed() {
  try {
    await mongoose.connect(`${mongoUrl}/${dbName}`);

    console.log('✅ Connected to MongoDB');

    // Clear existing users (optional)
    await User.deleteMany({ username: { $in: ['Kitchen Staff', 'Manager Admin'] } });

    // Create Kitchen user
    const kitchenPassword = await bcrypt.hash('kitchen123', 10);
    const kitchenUser = new User({
      name: 'Kitchen Staff',
      username: 'Kitchen Staff',
      password: kitchenPassword,
      role: 'kitchen'
    });
    await kitchenUser.save();
    console.log('✅ Kitchen user created - Username: Kitchen Staff, Password: kitchen123');

    // Create Manager user
    const managerPassword = await bcrypt.hash('manager123', 10);
    const managerUser = new User({
      name: 'Manager Admin',
      username: 'Manager Admin',
      password: managerPassword,
      role: 'manager'
    });
    await managerUser.save();
    console.log('✅ Manager user created - Username: Manager Admin, Password: manager123');

    // Create default settings
    await Settings.deleteMany({});
    const settings = new Settings({
      restaurantName: 'SmartDine India',
      address: '123 MG Road, Bangalore, Karnataka 560001',
      contactNumber: '+91 98765 43210',
      GSTNumber: '29ABCDE1234F1Z5',
      UPI_ID: 'smartdine@upi'
    });
    await settings.save();
    console.log('✅ Default restaurant settings created');

    console.log('\n🎉 Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
