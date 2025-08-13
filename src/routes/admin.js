const express = require('express');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { 
  getAllOrders, 
  getOrderByIdAdmin, 
  updateOrderStatus, 
  updateOrderDetails,
  deleteOrder,
  exportOrders,
  getOrderStatistics
} = require('../controllers/orderController');

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  getUserStatistics,
  exportUsers
} = require('../controllers/userController');

const {
  createUserValidation,
  updateUserValidation,
  updatePasswordValidation,
  userIdValidation,
  userQueryValidation
} = require('../utils/validation');

const router = express.Router();

// All admin routes require authentication and admin authorization
router.use(authenticate);
router.use(authorizeAdmin);

// ==================== ORDER MANAGEMENT ROUTES ====================

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

// ==================== USER MANAGEMENT ROUTES ====================

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination and filtering
 * @access  Admin
 */
router.get('/users', userQueryValidation, validate, getAllUsers);

/**
 * @route   GET /api/admin/users/statistics
 * @desc    Get user statistics and analytics
 * @access  Admin
 */
router.get('/users/statistics', getUserStatistics);

/**
 * @route   GET /api/admin/users/export
 * @desc    Export users to CSV
 * @access  Admin
 */
router.get('/users/export', exportUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID
 * @access  Admin
 */
router.get('/users/:id', userIdValidation, validate, getUserById);

/**
 * @route   POST /api/admin/users
 * @desc    Create a new user
 * @access  Admin
 */
router.post('/users', createUserValidation, validate, createUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user details
 * @access  Admin
 */
router.put('/users/:id', userIdValidation, updateUserValidation, validate, updateUser);

/**
 * @route   PUT /api/admin/users/:id/password
 * @desc    Update user password
 * @access  Admin
 */
router.put('/users/:id/password', userIdValidation, updatePasswordValidation, validate, updateUserPassword);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Admin
 */
router.delete('/users/:id', userIdValidation, validate, deleteUser);

module.exports = router;