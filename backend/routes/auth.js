const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

// Customer Auto-Entry (No separate register/login - just enter name + mobile)
router.post('/customer-entry', async (req, res) => {
  try {
    const { name, mobile } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ error: 'Name and mobile are required' });
    }

    // Look up by mobile
    let user = await User.findOne({ mobile, role: 'customer' });

    if (user) {
      // Returning customer — update name if changed
      if (user.name !== name) {
        user.name = name;
        await user.save();
      }
    } else {
      // New customer — auto-create (use mobile as unique username)
      const hashedPassword = await bcrypt.hash(mobile, 10);
      user = new User({
        name,
        mobile,
        username: mobile,
        password: hashedPassword,
        role: 'customer'
      });
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Welcome!',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Customer entry error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Customer Registration
router.post('/register', async (req, res) => {
  try {
    const { name, mobile } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ error: 'Name and mobile are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ error: 'Mobile number already registered' });
    }

    // Username = Name, Password = Mobile Number
    const hashedPassword = await bcrypt.hash(mobile, 10);

    const user = new User({
      name,
      mobile,
      username: name,
      password: hashedPassword,
      role: 'customer'
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Staff (Kitchen/Manager) Registration
router.post('/staff-register', async (req, res) => {
  try {
    const { name, username, password, role } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['kitchen', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      username,
      password: hashedPassword,
      role
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Staff registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Staff registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login (All roles)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
