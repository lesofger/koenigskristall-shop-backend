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

/**
 * Update user's own order status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateUserOrderStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'delivered'].includes(status)) {
      throw new ApiError('Invalid status. Users can only toggle between pending and delivered.', 400);
    }
    
    const order = await orderService.updateUserOrderStatus(userId, id, status);
    
    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID (admin version - no user restriction)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getOrderByIdAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const order = await orderService.getOrderByIdAdmin(id);
    
    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order statistics (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getOrderStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const statistics = await orderService.getOrderStatistics({ startDate, endDate });
    
    res.status(200).json({
      status: 'success',
      data: statistics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order details (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateOrderDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, shippingAddress, notes, trackingNumber } = req.body;
    
    const order = await orderService.updateOrderDetails(id, {
      status,
      shippingAddress,
      notes,
      trackingNumber
    });
    
    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete order (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await orderService.deleteOrder(id);
    
    res.status(200).json({
      status: 'success',
      message: 'Order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export orders (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const exportOrders = async (req, res, next) => {
  try {
    const { format = 'csv', status, startDate, endDate } = req.query;
    
    const exportData = await orderService.exportOrders({
      format,
      status,
      startDate,
      endDate
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders-${Date.now()}.csv`);
    
    res.status(200).send(exportData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updateUserOrderStatus,
  getOrderByIdAdmin,
  getOrderStatistics,
  updateOrderDetails,
  deleteOrder,
  exportOrders
};