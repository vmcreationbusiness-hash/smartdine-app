const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Menu = require('./models/Menu');

dotenv.config();

const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;

const sampleMenu = [
  {
    name: 'Butter Chicken',
    image: 'https://www.themealdb.com/images/media/meals/tkxquw1628771028.jpg',
    description: 'Creamy and rich butter chicken curry',
    priceINR: 350,
    available: true
  },
  {
    name: 'Biryani',
    image: 'https://www.themealdb.com/images/media/meals/1550441882.jpg',
    description: 'Aromatic rice dish with spices and chicken',
    priceINR: 400,
    available: true
  },
  {
    name: 'Paneer Tikka',
    image: 'https://www.themealdb.com/images/media/meals/vyqwys1511883849.jpg',
    description: 'Grilled cottage cheese with Indian spices',
    priceINR: 280,
    available: true
  },
  {
    name: 'Dal Makhani',
    image: 'https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg',
    description: 'Black lentils cooked in creamy tomato sauce',
    priceINR: 250,
    available: true
  },
  {
    name: 'Tandoori Chicken',
    image: 'https://www.themealdb.com/images/media/meals/qptpvt1487339892.jpg',
    description: 'Chicken marinated in yogurt and spices',
    priceINR: 320,
    available: true
  },
  {
    name: 'Naan Bread',
    image: 'https://www.themealdb.com/images/media/meals/oe8rg51699014028.jpg',
    description: 'Fresh baked Indian flatbread',
    priceINR: 50,
    available: true
  }
];

async function seedMenu() {
  try {
    await mongoose.connect(`${mongoUrl}/${dbName}`);
    console.log('✅ Connected to MongoDB');

    // Clear existing menu
    await Menu.deleteMany({});
    console.log('✅ Cleared existing menu');

    // Insert sample menu
    await Menu.insertMany(sampleMenu);
    console.log(`✅ Added ${sampleMenu.length} menu items`);

    console.log('\n🎉 Menu seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedMenu();
