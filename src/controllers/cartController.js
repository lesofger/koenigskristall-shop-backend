const cartService = require('../services/cartService');
const { ApiError } = require('../middleware/error');

/**
 * Get user's cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getUserCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const cart = await cartService.getUserCart(userId);
    
    res.status(200).json({
      status: 'success',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const addItemToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;
    
    const cart = await cartService.addItemToCart(userId, productId, quantity);
    
    res.status(200).json({
      status: 'success',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update cart item quantity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateCartItemQuantity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      throw new ApiError('Quantity must be at least 1', 400);
    }
    
    const cart = await cartService.updateCartItemQuantity(userId, id, quantity);
    
    res.status(200).json({
      status: 'success',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const removeItemFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const cart = await cartService.removeItemFromCart(userId, id);
    
    res.status(200).json({
      status: 'success',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const cart = await cartService.clearCart(userId);
    
    res.status(200).json({
      status: 'success',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart
};