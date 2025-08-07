const paymentService = require('../services/paymentService');
const { stripe: stripeConfig } = require('../config/auth');
const { ApiError } = require('../middleware/error');
const stripe = require('stripe')(stripeConfig.secretKey);

/**
 * Create a payment intent for checkout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const createPaymentIntent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { items, paymentMethod = 'card', shippingAddress = null } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new ApiError('Items are required for payment intent', 400);
    }

    const paymentIntent = await paymentService.createPaymentIntent(userId, items, paymentMethod, shippingAddress);
    
    res.status(200).json({
      status: 'success',
      data: paymentIntent
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a PayPal order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const createPayPalOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { items, shippingAddress } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new ApiError('Items are required for PayPal order', 400);
    }

    const paypalOrder = await paymentService.createPayPalOrder(userId, items, shippingAddress);
    
    res.status(200).json({
      status: 'success',
      data: paypalOrder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Capture PayPal payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const capturePayPalPayment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderID, shippingAddress } = req.body;
    
    if (!orderID) {
      throw new ApiError('PayPal order ID is required', 400);
    }

    const captureResult = await paymentService.capturePayPalPayment(userId, orderID, shippingAddress);
    
    res.status(200).json({
      status: 'success',
      data: captureResult
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get PayPal order details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getPayPalOrderDetails = async (req, res, next) => {
  try {
    const { orderID } = req.params;
    
    if (!orderID) {
      throw new ApiError('PayPal order ID is required', 400);
    }

    const orderDetails = await paymentService.getPayPalOrderDetails(orderID);
    
    res.status(200).json({
      status: 'success',
      data: orderDetails
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
  createPaymentIntent,
  createPayPalOrder,
  capturePayPalPayment,
  getPayPalOrderDetails,
  handleWebhook,
};