const express = require('express');
const { testAuth, createPaymentIntent, createBankTransferPaymentIntent, handleWebhook } = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/payments/test-auth
 * @desc    Test authentication endpoint
 * @access  Private
 */
router.get('/test-auth', authenticate, testAuth);

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
router.post('/webhook', handleWebhook);

module.exports = router;