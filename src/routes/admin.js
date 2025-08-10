const express = require('express');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { 
  getAllOrders, 
  getOrderByIdAdmin, 
  updateOrderStatus, 
  updateOrderDetails,
  deleteOrder,
  exportOrders,
  getOrderStatistics
} = require('../controllers/orderController');

const router = express.Router();

// All admin routes require authentication and admin authorization
router.use(authenticate);
router.use(authorizeAdmin);

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders with pagination and filtering
 * @access  Admin
 */
router.get('/orders', getAllOrders);

/**
 * @route   GET /api/admin/orders/statistics
 * @desc    Get order statistics and analytics
 * @access  Admin
 */
router.get('/orders/statistics', getOrderStatistics);

/**
 * @route   GET /api/admin/orders/export
 * @desc    Export orders to CSV
 * @access  Admin
 */
router.get('/orders/export', exportOrders);

/**
 * @route   GET /api/admin/orders/:id
 * @desc    Get order by ID (admin version)
 * @access  Admin
 */
router.get('/orders/:id', getOrderByIdAdmin);

/**
 * @route   PUT /api/admin/orders/:id/status
 * @desc    Update order status
 * @access  Admin
 */
router.put('/orders/:id/status', updateOrderStatus);

/**
 * @route   PUT /api/admin/orders/:id
 * @desc    Update order details
 * @access  Admin
 */
router.put('/orders/:id', updateOrderDetails);

/**
 * @route   DELETE /api/admin/orders/:id
 * @desc    Delete order
 * @access  Admin
 */
router.delete('/orders/:id', deleteOrder);

module.exports = router;