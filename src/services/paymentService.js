const stripe = require('stripe');
const { stripe: stripeConfig } = require('../config/auth');
const { ApiError } = require('../middleware/error');
const { Cart, CartItem, Product } = require('../models');

// Initialize Stripe with the secret key
const stripeClient = stripe(stripeConfig.secretKey);

/**
 * Create a payment intent for checkout
 * @param {Number} userId - User ID
 * @returns {Object} Payment intent
 */
const createPaymentIntent = async (userId) => {
  try {
    // Get user's cart
    const cart = await Cart.findOne({
      where: { userId }
    });
    
    if (!cart) {
      throw new ApiError('Cart not found', 404);
    }
    
    // Get cart items with product details
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'price', 'quantity']
        }
      ]
    });
    
    if (cartItems.length === 0) {
      throw new ApiError('Cart is empty', 400);
    }
    
    // Check if all products are in stock
    for (const item of cartItems) {
      if (!item.Product.isInStock(item.quantity)) {
        throw new ApiError(`Product "${item.Product.name}" is out of stock`, 400);
      }
    }
    
    // Calculate total amount
    const amount = cartItems.reduce((total, item) => {
      return total + (item.Product.price * item.quantity);
    }, 0);
    
    // Create a payment intent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId,
        cartId: cart.id
      }
    });
    
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

/**
 * Handle Stripe webhook events
 * @param {Object} event - Stripe event
 * @returns {Object} Response
 */
const handleWebhookEvent = async (event) => {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Payment was successful
        // This would typically trigger order creation, but we're handling that separately
        return { received: true };
        
      case 'payment_intent.payment_failed':
        // Payment failed
        // You might want to notify the user or update the order status
        return { received: true };
        
      default:
        // Unexpected event type
        console.log(`Unhandled event type: ${event.type}`);
        return { received: true };
    }
  } catch (error) {
    throw new ApiError(error.message, 500);
  }
};

module.exports = {
  createPaymentIntent,
  handleWebhookEvent
};