const express = require('express');
const { getAllOrders, updateOrderStatus, getAllProducts, updateProductQuantity } = require('../controllers/adminController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { orderStatusValidation, productQuantityValidation, validate } = require('../utils/validation');

const router = express.Router();

// All admin routes require authentication and admin authorization
router.use(authenticate, authorizeAdmin);

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders
 * @access  Admin
 */
router.get('/orders', getAllOrders);

/**
 * @route   PUT /api/admin/orders/:id/status
 * @desc    Update order status
 * @access  Admin
 */
router.put('/orders/:id/status', orderStatusValidation, validate, updateOrderStatus);

/**
 * @route   GET /api/admin/products
 * @desc    Get all products with inventory details
 * @access  Admin
 */
router.get('/products', getAllProducts);

/**
 * @route   PUT /api/admin/products/:id/quantity
 * @desc    Update product quantity
 * @access  Admin
 */
router.put('/products/:id/quantity', productQuantityValidation, validate, updateProductQuantity);

module.exports = router;