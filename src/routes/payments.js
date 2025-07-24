const express = require('express');
const { createPaymentIntent, handleWebhook } = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/payments/create-payment-intent
 * @desc    Create a payment intent for checkout
 * @access  Private
 */
router.post('/create-payment-intent', authenticate, createPaymentIntent);

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public
 */
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;