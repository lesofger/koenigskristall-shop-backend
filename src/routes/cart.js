const express = require('express');
const { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart 
} = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get('/', authenticate, getCart);

/**
 * @route   POST /api/cart/add
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/add', authenticate, addToCart);

/**
 * @route   PUT /api/cart/:cartItemId
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put('/:cartItemId', authenticate, updateCartItem);

/**
 * @route   DELETE /api/cart/:cartItemId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/:cartItemId', authenticate, removeFromCart);

/**
 * @route   DELETE /api/cart
 * @desc    Clear cart
 * @access  Private
 */
router.delete('/', authenticate, clearCart);

module.exports = router; 