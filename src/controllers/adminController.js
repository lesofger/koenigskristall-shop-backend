const orderService = require('../services/orderService');
const productService = require('../services/productService');
const { ApiError } = require('../middleware/error');

/**
 * Get all orders (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getAllOrders = async (req, res, next) => {
  try {
    const result = await orderService.getAllOrders(req.query);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'processing', 'shipped', 'delivered'].includes(status)) {
      throw new ApiError('Invalid status', 400);
    }
    
    const order = await orderService.updateOrderStatus(id, status);
    
    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all products with inventory details (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getAllProducts = async (req, res, next) => {
  try {
    const result = await productService.getAllProducts(req.query);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product quantity (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateProductQuantity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (quantity === undefined || quantity < 0) {
      throw new ApiError('Quantity must be a non-negative integer', 400);
    }
    
    const product = await productService.updateProductQuantity(id, quantity);
    
    res.status(200).json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrders,
  updateOrderStatus,
  getAllProducts,
  updateProductQuantity
};