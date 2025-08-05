const express = require('express');
const { 
  testAuth, 
  createPaymentIntent, 
  handleWebhook, 
  getAvailablePaymentMethods,
  createPayPalOrder,
  capturePayPalPayment,
  getPayPalOrderDetails,
  getLegalNotice
} = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/payments/create-payment-intent
 * @desc    Create a payment intent for checkout
 * @access  Private
 */
router.post('/create-payment-intent', authenticate, createPaymentIntent);

/**
 * @route   POST /api/payments/paypal/create-order
 * @desc    Create a PayPal order
 * @access  Private
 */
router.post('/paypal/create-order', authenticate, createPayPalOrder);

/**
 * @route   POST /api/payments/paypal/capture
 * @desc    Capture PayPal payment
 * @access  Private
 */
router.post('/paypal/capture', authenticate, capturePayPalPayment);

/**
 * @route   GET /api/payments/paypal/order/:orderID
 * @desc    Get PayPal order details
 * @access  Private
 */
router.get('/paypal/order/:orderID', authenticate, getPayPalOrderDetails);

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public
 */
router.post('/webhook', handleWebhook);

module.exports = router;