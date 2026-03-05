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
    priceINR: 350, available: true, category: 'Main Course',
    translations: {
      hi: { name: 'बटर चिकन', description: 'मलाईदार और स्वादिष्ट बटर चिकन करी' },
      kn: { name: 'ಬಟರ್ ಚಿಕನ್', description: 'ಕೆನೆ ಮತ್ತು ರುಚಿಕರ ಬಟರ್ ಚಿಕನ್ ಕರಿ' },
      te: { name: 'బటర్ చికెన్', description: 'క్రీమీ మరియు రుచికరమైన బటర్ చికెన్ కర్రీ' },
      ta: { name: 'பட்டர் சிக்கன்', description: 'கிரீமி மற்றும் சுவையான பட்டர் சிக்கன் கறி' },
      ml: { name: 'ബട്ടർ ചിക്കൻ', description: 'ക്രീമി ബട്ടർ ചിക്കൻ കറി' },
    }
  },
  {
    name: 'Biryani',
    image: 'https://www.themealdb.com/images/media/meals/1550441882.jpg',
    description: 'Aromatic rice dish with spices and chicken',
    priceINR: 400, available: true, category: 'Rice',
    translations: {
      hi: { name: 'बिरयानी', description: 'मसालों और चिकन के साथ सुगंधित चावल' },
      kn: { name: 'ಬಿರ್ಯಾನಿ', description: 'ಮಸಾಲೆ ಮತ್ತು ಕೋಳಿಯೊಂದಿಗೆ ಸುಗಂಧ ಅಕ್ಕಿ' },
      te: { name: 'బిర్యానీ', description: 'సుగంధ మసాలాలు మరియు చికెన్‌తో అన్నం' },
      ta: { name: 'பிரியாணி', description: 'மசாலா மற்றும் சிக்கனுடன் வாசனை அரிசி' },
      ml: { name: 'ബിരിയാണി', description: 'മസാലകളും ചിക്കനും ഉള്ള സുഗന്ധ ചോറ്' },
    }
  },
  {
    name: 'Paneer Tikka',
    image: 'https://www.themealdb.com/images/media/meals/vyqwys1511883849.jpg',
    description: 'Grilled cottage cheese with Indian spices',
    priceINR: 280, available: true, category: 'Starters',
    translations: {
      hi: { name: 'पनीर टिक्का', description: 'भारतीय मसालों के साथ ग्रिल्ड पनीर' },
      kn: { name: 'ಪನೀರ್ ಟಿಕ್ಕಾ', description: 'ಭಾರತೀಯ ಮಸಾಲೆಗಳೊಂದಿಗೆ ಗ್ರಿಲ್ಡ್ ಪನೀರ್' },
      te: { name: 'పనీర్ టిక్కా', description: 'భారతీయ మసాలాలతో గ్రిల్ చేసిన పనీర్' },
      ta: { name: 'பனீர் டிக்கா', description: 'இந்திய மசாலாவுடன் கிரில் செய்த பனீர்' },
      ml: { name: 'പനീർ ടിക്ക', description: 'ഇന്ത്യൻ മസാലകളോടെ ഗ്രിൽ ചെയ്ത പനീർ' },
    }
  },
  {
    name: 'Dal Makhani',
    image: 'https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg',
    description: 'Black lentils cooked in creamy tomato sauce',
    priceINR: 250, available: true, category: 'Main Course',
    translations: {
      hi: { name: 'दाल मखनी', description: 'मलाईदार टमाटर सॉस में पकी काली दाल' },
      kn: { name: 'ದಾಲ್ ಮಖನಿ', description: 'ಕೆನೆ ಟೊಮೇಟೊ ಸಾಸ್‌ನಲ್ಲಿ ಬೇಯಿಸಿದ ಕಪ್ಪು ಬೇಳೆ' },
      te: { name: 'దాల్ మఖని', description: 'క్రీమీ టమాటో సాస్‌లో వండిన నల్ల పప్పు' },
      ta: { name: 'தால் மக்கானி', description: 'கிரீமி தக்காளி சாஸில் சமைத்த கருப்பு பருப்பு' },
      ml: { name: 'ദാൽ മഖനി', description: 'ക്രീമി തക്കാളി സോസിൽ പാകം ചെയ്ത കറുത്ത പരിപ്പ്' },
    }
  },
  {
    name: 'Tandoori Chicken',
    image: 'https://www.themealdb.com/images/media/meals/qptpvt1487339892.jpg',
    description: 'Chicken marinated in yogurt and spices',
    priceINR: 320, available: true, category: 'Starters',
    translations: {
      hi: { name: 'तंदूरी चिकन', description: 'दही और मसालों में मैरीनेट किया चिकन' },
      kn: { name: 'ತಂದೂರಿ ಚಿಕನ್', description: 'ಮೊಸರು ಮತ್ತು ಮಸಾಲೆಯಲ್ಲಿ ಮ್ಯಾರಿನೇಟ್ ಮಾಡಿದ ಕೋಳಿ' },
      te: { name: 'తందూరి చికెన్', description: 'పెరుగు మరియు మసాలాలలో మెరినేట్ చేసిన చికెన్' },
      ta: { name: 'தந்தூரி சிக்கன்', description: 'தயிர் மற்றும் மசாலாவில் ஊறவைத்த சிக்கன்' },
      ml: { name: 'തന്തൂരി ചിക്കൻ', description: 'തൈരും മസാലകളും ചേർത്ത് മാരിനേറ്റ് ചെയ്ത ചിക്കൻ' },
    }
  },
  {
    name: 'Naan Bread',
    image: 'https://www.themealdb.com/images/media/meals/oe8rg51699014028.jpg',
    description: 'Fresh baked Indian flatbread',
    priceINR: 50, available: true, category: 'Breads',
    translations: {
      hi: { name: 'नान ब्रेड', description: 'ताजा बेक किया हुआ भारतीय नान' },
      kn: { name: 'ನಾನ್ ಬ್ರೆಡ್', description: 'ತಾಜಾ ಬೇಕ್ ಮಾಡಿದ ಭಾರತೀಯ ನಾನ್' },
      te: { name: 'నాన్ బ్రెడ్', description: 'తాజాగా కాల్చిన భారతీయ నాన్' },
      ta: { name: 'நான் பிரெட்', description: 'புதிதாக சுடப்பட்ட இந்திய நான்' },
      ml: { name: 'നാൻ ബ്രെഡ്', description: 'പുതുതായി ചുട്ട ഇന്ത്യൻ നാൻ' },
    }
  },
  {
    name: 'Masala Dosa',
    image: 'https://www.themealdb.com/images/media/meals/xusqvw1511638311.jpg',
    description: 'Crispy rice crepe filled with spiced potato',
    priceINR: 150, available: true, category: 'Breakfast',
    translations: {
      hi: { name: 'मसाला डोसा', description: 'मसालेदार आलू भरी क्रिस्पी चावल की क्रेप' },
      kn: { name: 'ಮಸಾಲಾ ದೋಸೆ', description: 'ಮಸಾಲೆ ಆಲೂ ತುಂಬಿದ ಕ್ರಿಸ್ಪಿ ಅಕ್ಕಿ ದೋಸೆ' },
      te: { name: 'మసాలా దోశ', description: 'మసాలా ఆలూతో నిండిన క్రిస్పీ అన్నం క్రెప్' },
      ta: { name: 'மசாலா தோசை', description: 'மசாலா உருளைக்கிழங்கு நிறைந்த மொறுமொறுப்பான தோசை' },
      ml: { name: 'മസാല ദോശ', description: 'മസാല ഉരുളക്കിഴങ്ങ് നിറഞ്ഞ കൂർത്ത ദോശ' },
    }
  },
  {
    name: 'Idli Sambar',
    image: 'https://www.themealdb.com/images/media/meals/xusqvw1511638311.jpg',
    description: 'Steamed rice cakes with lentil soup',
    priceINR: 100, available: true, category: 'Breakfast',
    translations: {
      hi: { name: 'इडली सांभर', description: 'दाल सूप के साथ भाप में पकी चावल की इडली' },
      kn: { name: 'ಇಡ್ಲಿ ಸಾಂಬಾರ್', description: 'ಬೇಳೆ ಸೂಪ್‌ನೊಂದಿಗೆ ಆವಿಯಲ್ಲಿ ಬೇಯಿಸಿದ ಅಕ್ಕಿ ಇಡ್ಲಿ' },
      te: { name: 'ఇడ్లీ సాంబార్', description: 'పప్పు సూప్‌తో ఆవిరిలో వండిన అన్నం కేక్‌లు' },
      ta: { name: 'இட்லி சாம்பார்', description: 'பருப்பு சூப்புடன் வேகவைத்த அரிசி கேக்' },
      ml: { name: 'ഇഡ്ലി സാമ്പാർ', description: 'പരിപ്പ് സൂപ്പോടൊപ്പം ആവിയിൽ പാകം ചെയ്ത ഇഡ്ലി' },
    }
  },
  {
    name: 'Gulab Jamun',
    image: 'https://www.themealdb.com/images/media/meals/0206h11699013809.jpg',
    description: 'Soft milk dumplings soaked in rose sugar syrup',
    priceINR: 120, available: true, category: 'Desserts',
    translations: {
      hi: { name: 'गुलाब जामुन', description: 'गुलाब की चाशनी में डूबे नरम दूध के गोले' },
      kn: { name: 'ಗುಲಾಬ್ ಜಾಮೂನ್', description: 'ಗುಲಾಬ್ ಸಕ್ಕರೆ ಪಾಕದಲ್ಲಿ ಹಾಲಿನ ಉಂಡೆ' },
      te: { name: 'గులాబ్ జామున్', description: 'రోజ్ షుగర్ సిరప్‌లో నానిన పాల ఉండలు' },
      ta: { name: 'குலாப் ஜாமுன்', description: 'ரோஸ் சர்க்கரை சிரப்பில் ஊறிய பால் உருண்டைகள்' },
      ml: { name: 'ഗുലാബ് ജാമൂൻ', description: 'റോസ് ഷുഗർ സിറപ്പിൽ കുതിർത്ത പാൽ ഉരുളകൾ' },
    }
  },
  {
    name: 'Lassi',
    image: 'https://www.themealdb.com/images/media/meals/1550441882.jpg',
    description: 'Chilled yogurt based drink',
    priceINR: 80, available: true, category: 'Drinks',
    translations: {
      hi: { name: 'लस्सी', description: 'ठंडा दही आधारित पेय' },
      kn: { name: 'ಲಸ್ಸಿ', description: 'ತಂಪಾದ ಮೊಸರು ಆಧಾರಿತ ಪಾನೀಯ' },
      te: { name: 'లస్సీ', description: 'చల్లని పెరుగు ఆధారిత పానీయం' },
      ta: { name: 'லஸ்சி', description: 'குளிர்ந்த தயிர் அடிப்படை பானம்' },
      ml: { name: 'ലസ്സി', description: 'തണുത്ത തൈര് അടിസ്ഥാനമാക്കിയ പാനീയം' },
    }
  },
];

async function seedMenu() {
  try {
    await mongoose.connect(`${mongoUrl}/${dbName}`);
    console.log('✅ Connected to MongoDB');
    await Menu.deleteMany({});
    console.log('✅ Cleared existing menu');
    await Menu.insertMany(sampleMenu);
    console.log(`✅ Added ${sampleMenu.length} menu items with translations`);
    console.log('\n🎉 Menu seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedMenu();
