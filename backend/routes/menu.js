const express = require('express');
const router = express.Router();
const axios = require('axios');
const Menu = require('../models/Menu');
const { authMiddleware, roleCheck } = require('../middleware/auth');
const { uploadBase64ToCloudinary, deleteFromCloudinary, isCloudinaryConfigured } = require('../utils/cloudinary');

// Auto-translate using MyMemory (free, no API key needed)
const LANGS = [
  { code: 'hi', mymemory: 'hi-IN' },
  { code: 'kn', mymemory: 'kn-IN' },
  { code: 'te', mymemory: 'te-IN' },
  { code: 'ta', mymemory: 'ta-IN' },
  { code: 'ml', mymemory: 'ml-IN' },
];

const translateText = async (text, targetLang) => {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
    const res = await axios.get(url, { timeout: 5000 });
    const translated = res.data?.responseData?.translatedText;
    if (!translated || translated.toLowerCase() === text.toLowerCase()) return null;
    return translated;
  } catch {
    return null;
  }
};

const autoTranslate = async (name, description) => {
  const translations = {};
  for (const lang of LANGS) {
    const [tName, tDesc] = await Promise.all([
      translateText(name, lang.mymemory),
      description ? translateText(description, lang.mymemory) : Promise.resolve(null),
    ]);
    translations[lang.code] = {
      name: tName || name,
      description: tDesc || description || '',
    };
  }
  return translations;
};

const processImage = async (image) => {
  if (!image) return image;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  if (isCloudinaryConfigured()) {
    return await uploadBase64ToCloudinary(image, 'smartdine/menu');
  }
  return image;
};

// GET /api/menu
router.get('/', async (req, res) => {
  try {
    const menuItems = await Menu.find({ available: true }).sort({ createdAt: -1 });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// GET /api/menu/all (Manager)
router.get('/all', authMiddleware, roleCheck('manager'), async (req, res) => {
  try {
    const menuItems = await Menu.find({}).sort({ createdAt: -1 });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// GET /api/menu/fetch-from-api
router.get('/fetch-from-api', authMiddleware, roleCheck('manager'), async (req, res) => {
  try {
    const response = await axios.get('https://www.themealdb.com/api/json/v1/1/filter.php?a=Indian');
    const meals = response.data.meals || [];
    const formattedMeals = meals.slice(0, 20).map(meal => ({
      name: meal.strMeal,
      image: meal.strMealThumb,
      description: 'Delicious Indian cuisine',
      priceINR: 0,
      available: false,
      apiId: meal.idMeal
    }));
    res.json(formattedMeals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meals from API' });
  }
});

// POST /api/menu — Add with auto-translation
router.post('/', authMiddleware, roleCheck('manager'), async (req, res) => {
  try {
    const { name, image, description, priceINR, available, category } = req.body;
    if (!name || !image || !priceINR) {
      return res.status(400).json({ error: 'Name, image, and price are required' });
    }
    const imageUrl = await processImage(image);
    console.log('Translating: ' + name);
    const translations = await autoTranslate(name, description || '');
    const menuItem = new Menu({
      name, image: imageUrl,
      description: description || '',
      priceINR, category: category || '',
      available: available !== undefined ? available : true,
      createdBy: req.user.username,
      translations,
    });
    await menuItem.save();
    res.status(201).json({ message: 'Menu item added with translations', item: menuItem });
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

// PUT /api/menu/:id — Update with auto-translation
router.put('/:id', authMiddleware, roleCheck('manager'), async (req, res) => {
  try {
    const existing = await Menu.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Menu item not found' });
    const updates = { ...req.body };
    if (updates.image && updates.image !== existing.image) {
      updates.image = await processImage(updates.image);
      await deleteFromCloudinary(existing.image);
    }
    const nameChanged = updates.name && updates.name !== existing.name;
    const descChanged = updates.description !== undefined && updates.description !== existing.description;
    if (nameChanged || descChanged) {
      const newName = updates.name || existing.name;
      const newDesc = updates.description !== undefined ? updates.description : existing.description;
      console.log('Re-translating: ' + newName);
      updates.translations = await autoTranslate(newName, newDesc);
    }
    const menuItem = await Menu.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ message: 'Menu item updated', item: menuItem });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// DELETE /api/menu/:id
router.delete('/:id', authMiddleware, roleCheck('manager'), async (req, res) => {
  try {
    const menuItem = await Menu.findByIdAndDelete(req.params.id);
    if (!menuItem) return res.status(404).json({ error: 'Menu item not found' });
    await deleteFromCloudinary(menuItem.image);
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// POST /api/menu/seed-translations — Backfill all existing items
router.post('/seed-translations', authMiddleware, roleCheck('manager'), async (req, res) => {
  try {
    const items = await Menu.find({});
    let updated = 0;
    for (const item of items) {
      const hasTranslations = item.translations?.hi?.name && item.translations.hi.name !== item.name;
      if (hasTranslations) continue;
      console.log('Translating existing: ' + item.name);
      item.translations = await autoTranslate(item.name, item.description);
      await item.save();
      updated++;
    }
    res.json({ success: true, updated, total: items.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
