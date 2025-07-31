const paymentService = require('../services/paymentService');
const { stripe: stripeConfig } = require('../config/auth');
const { ApiError } = require('../middleware/error');
const stripe = require('stripe')(stripeConfig.secretKey);

/**
 * Test authentication endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const testAuth = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Authentication working',
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a payment intent for checkout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const createPaymentIntent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new ApiError('Items are required for payment intent', 400);
    }

    
    const paymentIntent = await paymentService.createPaymentIntent(userId, items);
    
    res.status(200).json({
      status: 'success',
      data: paymentIntent
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Stripe webhook events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      throw new ApiError('Stripe signature is missing', 400);
    }
    
    let event;
    
    try {
      // Verify the event came from Stripe
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        stripeConfig.webhookSecret
      );
    } catch (err) {
      throw new ApiError(`Webhook signature verification failed: ${err.message}`, 400);
    }
    
    // Handle the event
    const result = await paymentService.handleWebhookEvent(event);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  testAuth,
  createPaymentIntent,
  handleWebhook
};