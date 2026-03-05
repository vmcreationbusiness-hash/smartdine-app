const express = require('express');
const router = express.Router();
const axios = require('axios');
const Menu = require('../models/Menu');
const { authMiddleware, roleCheck } = require('../middleware/auth');
const { uploadBase64ToCloudinary, deleteFromCloudinary, isCloudinaryConfigured } = require('../utils/cloudinary');

// Helper: if base64 image, upload to Cloudinary; if URL, return as-is
const processImage = async (image) => {
  if (!image) return image;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  if (isCloudinaryConfigured()) {
    console.log('Uploading image to Cloudinary...');
    return await uploadBase64ToCloudinary(image, 'smartdine/menu');
  }
  console.warn('Cloudinary not configured — storing base64. Set CLOUDINARY_* env vars for production.');
  return image;
};

// GET /api/menu — All available items (Customer)
router.get('/', async (req, res) => {
  try {
    const menuItems = await Menu.find({ available: true }).sort({ createdAt: -1 });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// GET /api/menu/fetch-from-api — Fetch from TheMealDB (Manager)
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

// POST /api/menu — Add menu item (Manager)
router.post('/', authMiddleware, roleCheck('manager'), async (req, res) => {
  try {
    const { name, image, description, priceINR, available, category } = req.body;
    if (!name || !image || !priceINR) return res.status(400).json({ error: 'Name, image, and price are required' });

    const imageUrl = await processImage(image);

    const menuItem = new Menu({
      name, image: imageUrl,
      description: description || '',
      priceINR, category: category || '',
      available: available !== undefined ? available : true,
      createdBy: req.user.username
    });

    await menuItem.save();
    res.status(201).json({ message: 'Menu item added', item: menuItem });
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

// PUT /api/menu/:id — Update menu item (Manager)
router.put('/:id', authMiddleware, roleCheck('manager'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.image) {
      const existing = await Menu.findById(req.params.id);
      updates.image = await processImage(updates.image);
      if (existing?.image && existing.image !== updates.image) {
        await deleteFromCloudinary(existing.image);
      }
    }
    const menuItem = await Menu.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!menuItem) return res.status(404).json({ error: 'Menu item not found' });
    res.json({ message: 'Menu item updated', item: menuItem });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// DELETE /api/menu/:id — Delete menu item (Manager)
router.delete('/:id', authMiddleware, roleCheck('manager'), async (req, res) => {
  try {
    const menuItem = await Menu.findByIdAndDelete(req.params.id);
    if (!menuItem) return res.status(404).json({ error: 'Menu item not found' });
    await deleteFromCloudinary(menuItem.image);
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

module.exports = router;
