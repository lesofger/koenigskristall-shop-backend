const express = require('express');
const { createOrder, getUserOrders, getOrderById } = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { orderValidation, validate } = require('../utils/validation');

const router = express.Router();

// All order routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post('/', orderValidation, validate, createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get user's orders
 * @access  Private
 */
router.get('/', getUserOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', getOrderById);

module.exports = router;