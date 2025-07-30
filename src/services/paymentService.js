const stripe = require('stripe');
const { stripe: stripeConfig } = require('../config/auth');
const { ApiError } = require('../middleware/error');
const { Product } = require('../models');
const orderService = require('./orderService');

// Initialize Stripe with the secret key
const stripeClient = stripe(stripeConfig.secretKey);

/**
 * Create a payment intent for checkout
 * @param {Number} userId - User ID
 * @param {Array} items - Array of items with id, quantity, and price
 * @returns {Object} Payment intent
 */
const createPaymentIntent = async (userId, items) => {
  try {
    if (!items || items.length === 0) {
      throw new ApiError('Items are required for payment intent', 400);
    }
    
    // Validate items and check stock
    const validatedItems = [];
    let totalAmount = 0;
    
    for (const item of items) {
      // Get product details from database
      const product = await Product.findByPk(item.id);
      if (!product) {
        throw new ApiError(`Product with ID ${item.id} not found`, 404);
      }
      
      // Check if product is in stock
      if (!product.isInStock(item.quantity)) {
        throw new ApiError(`Product "${product.name}" is out of stock`, 400);
      }
      
      // Calculate item total
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      validatedItems.push({
        ...item,
        product,
        itemTotal
      });
    }
    
    // Create a payment intent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'eur', // Changed to EUR for German shop
      metadata: {
        userId: userId.toString(),
        items: JSON.stringify(validatedItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.product.price
        })))
      }
    });
    
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount
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
        // Payment was successful - create order
        const paymentIntent = event.data.object;
        const userId = parseInt(paymentIntent.metadata.userId);
        const items = JSON.parse(paymentIntent.metadata.items);
        
        // Create shipping address from payment intent
        const shippingAddress = {
          street: paymentIntent.shipping?.address?.line1 || 'N/A',
          city: paymentIntent.shipping?.address?.city || 'N/A',
          state: paymentIntent.shipping?.address?.state || 'N/A',
          zipCode: paymentIntent.shipping?.address?.postal_code || 'N/A',
          country: paymentIntent.shipping?.address?.country || 'N/A'
        };
        
        // Create order with items from webhook
        await orderService.createOrder(userId, paymentIntent.id, shippingAddress, items);
        console.log(`Order created for payment intent: ${paymentIntent.id}`);
        return { received: true };
        
      case 'payment_intent.payment_failed':
        // Payment failed
        console.log(`Payment failed for intent: ${event.data.object.id}`);
        return { received: true };

      case 'payment_intent.created':
        // Payment intent was created
        return { received: true };

      case 'charge.succeeded':
        // Charge was successful
        return { received: true };

      case 'charge.failed':   
        // Charge failed
        console.log(`Charge failed: ${event.data.object.id}`);
        return { received: false };

      default:
        // Unexpected event type
        console.log(`Unhandled event type: ${event.type}`);
        return { received: true };
    }
  } catch (error) {
    console.error('Webhook error:', error);
    throw new ApiError(error.message, 500);
  }
};

module.exports = {
  createPaymentIntent,
  handleWebhookEvent
};