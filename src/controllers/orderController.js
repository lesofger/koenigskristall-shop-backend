const orderService = require('../services/orderService');
const { ApiError } = require('../middleware/error');

/**
 * Create a new order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { paymentIntentId, shippingAddress } = req.body;
    
    const order = await orderService.createOrder(userId, paymentIntentId, shippingAddress);
    
    res.status(201).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's orders
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const result = await orderService.getUserOrders(userId, req.query);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getOrderById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const order = await orderService.getOrderById(userId, id);
    
    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

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

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};