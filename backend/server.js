const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGINS || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// MongoDB Connection
const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;

mongoose.connect(`${mongoUrl}/${dbName}`)
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Make io accessible to routes
app.set('io', io);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Routes
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const kitchenRoutes = require('./routes/kitchen');
const managerRoutes = require('./routes/manager');
const uploadRoutes = require('./routes/upload');

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/upload', uploadRoutes);

// Alias: /api/settings/theme -> /api/manager/theme (public, no auth)
app.use('/api/settings', managerRoutes);

// Health check
app.get('/api', (req, res) => {
  res.json({ message: 'SmartDine India API - Order First, Pay After Ready' });
});

const PORT = process.env.PORT || 8001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
