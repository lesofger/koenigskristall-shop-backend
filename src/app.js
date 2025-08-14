const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const cartRoutes = require('./routes/cart');
const adminRoutes = require('./routes/admin');

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'https://koenigskristall-shop.vercel.app',
    'https://www.koenigskristall.de'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // Enable CORS with specific origins
app.use(morgan('dev')); // HTTP request logger

// Cross-Origin-Resource-Policy middleware for image embedding
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Raw body parsing for Stripe webhooks (must come before JSON parsing)
app.use('/public', express.static(__dirname + '/public/images'));
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// JSON and URL-encoded body parsing for other routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Koenigskristall Shop API1' });
});

// Import error handling middleware
const { errorHandler, notFoundHandler } = require('./middleware/error');

// Error handling middleware
app.use(errorHandler);

// 404 middleware
app.use(notFoundHandler);

module.exports = app;