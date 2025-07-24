const express = require('express');
const { getUserCart, addItemToCart, updateCartItemQuantity, removeItemFromCart, clearCart } = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const { cartItemValidation, validate } = require('../utils/validation');

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get('/', getUserCart);

/**
 * @route   POST /api/cart/items
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/items', cartItemValidation, validate, addItemToCart);

/**
 * @route   PUT /api/cart/items/:id
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put('/items/:id', updateCartItemQuantity);

/**
 * @route   DELETE /api/cart/items/:id
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/items/:id', removeItemFromCart);

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear cart
 * @access  Private
 */
router.delete('/clear', clearCart);

module.exports = router;