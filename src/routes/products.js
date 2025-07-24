const express = require('express');
const { getAllProducts, getProductById, getProductsByCategory } = require('../controllers/productController');

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public
 */
router.get('/', getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', getProductById);

/**
 * @route   GET /api/products/category/:category
 * @desc    Get products by category
 * @access  Public
 */
router.get('/category/:category', getProductsByCategory);

module.exports = router;