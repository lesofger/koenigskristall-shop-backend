const stripe = require('stripe');
const { stripe: stripeConfig } = require('../config/auth');
const { paypalClient } = require('../config/paypal');
const { ApiError } = require('../middleware/error');
const { Product } = require('../models');
const orderService = require('./orderService');
const emailService = require('./emailService');

// Initialize Stripe with the secret key
const stripeClient = stripe(stripeConfig.secretKey);

// Import PayPal SDK
const paypal = require('@paypal/checkout-server-sdk');

// Shipping cost constant
const SHIPPING_COST = 5.00; // $5 shipping cost

/**
 * Create a payment intent for checkout
 * @param {Number} userId - User ID
 * @param {Array} items - Array of items with id, quantity, and price
 * @param {String} paymentMethod - Payment method ('card' or 'bank_transfer')
 * @param {Object} shippingAddress - Shipping address object
 * @returns {Object} Payment intent
 */
const createPaymentIntent = async (userId, items, paymentMethod = 'card', shippingAddress = null) => {
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
      const itemTotal = Math.round(product.price * item.quantity * 100) / 100;
      totalAmount = Math.round((totalAmount + itemTotal) * 100) / 100;
      
      validatedItems.push({
        ...item,
        product,
        itemTotal
      });
    }
    
    // Add shipping cost to total amount
    const totalWithShipping = Math.round((totalAmount + SHIPPING_COST) * 100) / 100;
    
    // Create payment intent with different configurations based on payment method
    const paymentIntentData = {
      amount: Math.round(totalWithShipping * 100), // Convert to cents
      currency: 'eur', // Changed to EUR for German shop
      metadata: {
        userId: userId.toString(),
        items: JSON.stringify(validatedItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.product.price
        })))
      }
    };

    // Add shipping address if provided
    if (shippingAddress) {
      paymentIntentData.shipping = {
        name: 'Ich bin Maja',
        address: {
          line1: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.zipCode,
          country: shippingAddress.country || 'DE'
        }
      };
    }
    // Add payment method specific configurations
    switch (paymentMethod) {

      case 'bank_transfer':
        paymentIntentData.payment_method_types = ['sepa_debit'];
        break;

      default:
        paymentIntentData.payment_method_types = ['card'];
        break;
    }
    
    const paymentIntent = await stripeClient.paymentIntents.create(paymentIntentData);
    
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalWithShipping,
      paymentMethod: paymentMethod,
      shippingAddress: shippingAddress
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

/**
 * Create a PayPal order
 * @param {Number} userId - User ID
 * @param {Array} items - Array of items with id, quantity, and price
 * @param {Object} shippingAddress - Shipping address object
 * @param {Boolean} includeVAT - Whether to include VAT (default: false for Kleinunternehmerregelung)
 * @returns {Object} PayPal order
 */
const createPayPalOrder = async (userId, items, shippingAddress = null, includeVAT = false) => {
  try {
    if (!items || items.length === 0) {
      throw new ApiError('Items are required for PayPal order', 400);
    }
    
    // Get VAT configuration from environment - default to no VAT for Kleinunternehmerregelung
    const vatRate = process.env.VAT_RATE ? parseFloat(process.env.VAT_RATE) : 0;
    const shouldIncludeVAT = process.env.INCLUDE_VAT === 'true' && includeVAT;
    
    // Validate items and check stock
    const validatedItems = [];
    let totalAmount = 0;
    let totalTax = 0;
    
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
      
      // Calculate item total - no VAT for Kleinunternehmerregelung
      const itemTotal = Math.round(product.price * item.quantity * 100) / 100;
      const itemTax = shouldIncludeVAT ? Math.round(itemTotal * vatRate * 100) / 100 : 0;
      totalAmount = Math.round((totalAmount + itemTotal) * 100) / 100;
      totalTax = Math.round((totalTax + itemTax) * 100) / 100;
      
      console.log(`Item ${item.id} (${product.name}):`, {
        price: product.price,
        quantity: item.quantity,
        itemTotal: itemTotal,
        itemTax: itemTax,
        vatRate: shouldIncludeVAT ? `${vatRate * 100}%` : 'No VAT (Kleinunternehmerregelung)',
        runningTotal: totalAmount,
        runningTax: totalTax
      });
      
      validatedItems.push({
        ...item,
        product,
        itemTotal,
        itemTax
      });
    }

    // Create PayPal order request
    const request = new paypal.orders.OrdersCreateRequest();
    
    // Calculate totals properly with shipping cost
    const itemTotal = totalAmount;
    const taxTotal = totalTax;
    const grandTotal = Math.round((itemTotal + taxTotal + SHIPPING_COST) * 100) / 100;
    
    console.log('PayPal Order Amounts:', {
      itemTotal: itemTotal.toFixed(2),
      taxTotal: taxTotal.toFixed(2),
      shippingCost: SHIPPING_COST.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      items: validatedItems.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        itemTotal: item.itemTotal.toFixed(2),
        itemTax: item.itemTax.toFixed(2)
      }))
    });
    
    // Build order structure
    const orderData = {
      intent: 'CAPTURE',
      application_context: {
        brand_name: 'Königskristall Shop',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL || 'https://koenigskristall-shop.vercel.app'}/payment-success`,
        cancel_url: `${process.env.FRONTEND_URL || 'https://koenigskristall-shop.vercel.app'}/payment-cancelled`
      },
      purchase_units: [
        {
          reference_id: `ORDER_${Date.now()}_${userId}`,
          description: 'Königskristall Shop Purchase - Kleinunternehmerregelung (§19 UStG)',
          custom_id: userId.toString(),
          invoice_id: `INV_${Date.now()}`,
          soft_descriptor: 'KOENIGSKRISTALL',
          amount: {
            currency_code: 'EUR',
            value: grandTotal.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'EUR',
                value: itemTotal.toFixed(2)
              },
              shipping: {
                currency_code: 'EUR',
                value: SHIPPING_COST.toFixed(2)
              }
              // No tax_total for Kleinunternehmerregelung
            }
          },
          items: validatedItems.map(item => ({
            name: item.product.name,
            description: item.product.description || item.product.name,
            sku: `PROD_${item.product.id}`,
            quantity: item.quantity.toString(),
            unit_amount: {
              currency_code: 'EUR',
              value: item.product.price.toFixed(2)
            }
            // No tax field for Kleinunternehmerregelung
          }))
        }
      ]
    };

    // Add shipping address if provided
    if (shippingAddress) {
      orderData.purchase_units[0].shipping = {
        address: {
          address_line_1: shippingAddress.street,
          admin_area_2: shippingAddress.city,
          admin_area_1: shippingAddress.state,
          postal_code: shippingAddress.zipCode,
          country_code: shippingAddress.country || 'DE'
        }
      };
    }

    request.requestBody(orderData);

    try {
      // Create the order with PayPal
      const order = await paypalClient.execute(request);
      
      console.log('PayPal order created successfully:', order.result.id);
      console.log('PayPal order links:', order.result.links);
      
      return {
        orderId: order.result.id,
        status: order.result.status,
        intent: order.result.intent,
        amount: grandTotal,
        currency: 'EUR',
        items: validatedItems.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          total: item.itemTotal
        })),
        links: order.result.links,
        metadata: {
          userId: userId.toString(),
          items: JSON.stringify(validatedItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.product.price
          }))),
          totalAmount: grandTotal,
          itemTotal: itemTotal,
          totalTax: totalTax
        },
        message: 'PayPal order created successfully - ready for user approval'
      };
    } catch (paypalError) {
      console.error('PayPal API Error:', paypalError);
      throw new ApiError(`PayPal order creation failed: ${paypalError.message}`, 500);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

/**
 * Capture PayPal payment
 * @param {Number} userId - User ID
 * @param {String} orderID - PayPal order ID
 * @param {Object} shippingAddress - Shipping address object
 * @returns {Object} Payment result
 */
const capturePayPalPayment = async (userId, orderID, shippingAddress = null) => {
  try {
    if (!orderID) {
      throw new ApiError('PayPal order ID is required', 400);
    }

    console.log('Starting PayPal capture for order:', orderID);

    // Create capture request
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.headers["Prefer"] = "return=representation";
    request.requestBody({}); // optional for capture
    
    try {
      // Capture the payment with PayPal
      const capture = await paypalClient.execute(request);
      
      console.log('PayPal payment captured successfully:', capture.result.id);
      
      // Extract order details from the capture result
      const captureResult = capture.result;
      const purchaseUnit = captureResult.purchase_units[0];
      const amount = parseFloat(purchaseUnit.amount.value);
      
      // Parse items from the capture result
      const items = purchaseUnit.items.map(item => ({
        productId: parseInt(item.sku.replace('PROD_', '')),
        quantity: parseInt(item.quantity),
        price: parseFloat(item.unit_amount.value)
      }));
      
      // Create shipping address from capture result if not provided
      let finalShippingAddress = shippingAddress;
      if (!finalShippingAddress && purchaseUnit.shipping) {
        const shipping = purchaseUnit.shipping.address;
        finalShippingAddress = {
          street: shipping.address_line_1 || 'N/A',
          city: shipping.admin_area_2 || 'N/A',
          state: shipping.admin_area_1 || 'N/A',
          zipCode: shipping.postal_code || 'N/A',
          country: shipping.country_code || 'DE'
        };
      }
      
      // Create order in your system
      console.log('Creating order in database with:', {
        userId,
        paypalOrderId: captureResult.id,
        shippingAddress: finalShippingAddress,
        items
      });
      
      const order = await orderService.createOrder(
        userId, 
        captureResult.id, 
        finalShippingAddress, 
        items
      );
      
      // Send payment confirmation email to customer
      try {
        await emailService.sendPaymentConfirmationEmail(order, 'paypal', captureResult.id);
        console.log(`Payment confirmation email sent for PayPal payment: ${captureResult.id}`);
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
        // Don't fail the payment capture if email fails
      }
      
      // Send admin notification email
      try {
        await emailService.sendAdminOrderNotification(order, 'paypal', captureResult.id);
        console.log(`Admin notification email sent for PayPal payment: ${captureResult.id}`);
      } catch (adminEmailError) {
        console.error('Failed to send admin notification email:', adminEmailError);
        // Don't fail the payment capture if admin email fails
      }
      
      // Get PayPal capture ID for reference
      const paypalCaptureId = captureResult.purchase_units[0].payments?.captures?.[0]?.id || 'N/A';
      
      return {
        success: true,
        orderId: order.id,
        paypalOrderId: captureResult.id,
        paypalCaptureId: paypalCaptureId,
        status: captureResult.status,
        amount: amount,
        currency: captureResult.purchase_units[0].amount.currency_code,
        items: items,
        shippingAddress: finalShippingAddress,
        captureTime: captureResult.create_time,
        message: 'Payment captured successfully and order created in database'
      };
    } catch (paypalError) {
      console.error('PayPal capture error:', paypalError);
      
      // Handle specific PayPal errors
      if (paypalError.statusCode === 404) {
        throw new ApiError('PayPal order not found', 404);
      } else if (paypalError.statusCode === 422) {
        throw new ApiError('PayPal order cannot be captured (already captured or expired)', 422);
      } else {
        throw new ApiError(`PayPal capture failed: ${paypalError.message}`, 500);
      }
    }
  } catch (error) {
    console.error('Capture payment error:', error);
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
    const paymentIntent = event.data.object; // The PaymentIntent object
    const paymentMethodId = paymentIntent.payment_method; // ID of the payment method
    console.log('paymentIntent==========>', paymentIntent);
    // Retrieve the payment method details using Stripe's API
    const paymentMethod = await stripeClient.paymentMethods.retrieve(paymentMethodId);
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        return await handlePaymentIntentSucceeded(event);
        
      case 'payment_intent.payment_failed':
        return await handlePaymentIntentFailed(event);
        
      case 'payment_intent.created':
        return await handlePaymentIntentCreated(event);
        
      case 'charge.succeeded':
        return await handleChargeSucceeded(event);
        
      case 'charge.failed':
        return await handleChargeFailed(event);
        
      case 'payment_method.attached':
        console.log(`Payment method attached: ${paymentMethodId}`);
        return { received: true };
        
      case 'payment_method.detached':
        console.log(`Payment method detached: ${paymentMethodId}`);
        return { received: true };
        
      default:
        return await handleUnhandledEvent(event);
    }
  } catch (error) {
    console.error('Webhook error:', error);
    throw new ApiError(error.message, 500);
  }
};

/**
 * Handle successful payment intent
 * @param {Object} event - Stripe event
 * @returns {Object} Response
 */
const handlePaymentIntentSucceeded = async (event) => {
  const paymentIntent = event.data.object;
  const userId = parseInt(paymentIntent.metadata.userId);
  const items = JSON.parse(paymentIntent.metadata.items);
  
  console.log(`Payment succeeded for user ${userId} with items:`, items);
  
  // Create shipping address from payment intent
  const shippingAddress = {
    street: paymentIntent.shipping?.address?.line1 || 'N/A',
    city: paymentIntent.shipping?.address?.city || 'N/A',
    state: paymentIntent.shipping?.address?.state || 'N/A',
    zipCode: paymentIntent.shipping?.address?.postal_code || 'N/A',
    country: paymentIntent.shipping?.address?.country || 'DE'
  };
  
  console.log('Shipping address from payment intent:', shippingAddress);
  
  // Create order with items from webhook
  const order = await orderService.createOrder(userId, paymentIntent.id, shippingAddress, items);
  console.log(`Order created for payment intent: ${paymentIntent.id}`);
  
  // Send payment confirmation email to customer
  try {
    await emailService.sendPaymentConfirmationEmail(order, 'stripe', paymentIntent.id);
    console.log(`Payment confirmation email sent for Stripe payment: ${paymentIntent.id}`);
  } catch (emailError) {
    console.error('Failed to send payment confirmation email:', emailError);
    // Don't fail the webhook if email fails
  }
  
  // Send admin notification email
  try {
    await emailService.sendAdminOrderNotification(order, 'stripe', paymentIntent.id);
    console.log(`Admin notification email sent for Stripe payment: ${paymentIntent.id}`);
  } catch (adminEmailError) {
    console.error('Failed to send admin notification email:', adminEmailError);
    // Don't fail the webhook if admin email fails
  }
  
  return { received: true };
};

/**
 * Handle failed payment intent
 * @param {Object} event - Stripe event
 * @returns {Object} Response
 */
const handlePaymentIntentFailed = async (event) => {
  const paymentIntent = event.data.object;
  console.log(`Payment failed for intent: ${paymentIntent.id}`);
  
  return { received: true };
};

/**
 * Handle created payment intent
 * @param {Object} event - Stripe event
 * @returns {Object} Response
 */
const handlePaymentIntentCreated = async (event) => {
  const paymentIntent = event.data.object;
  console.log(`Payment intent created: ${paymentIntent.id}`);
  
  return { received: true };
};

/**
 * Handle successful charge
 * @param {Object} event - Stripe event
 * @returns {Object} Response
 */
const handleChargeSucceeded = async (event) => {
  const charge = event.data.object;
  console.log(`Charge succeeded: ${charge.id}`);
  
  return { received: true };
};

/**
 * Handle failed charge
 * @param {Object} event - Stripe event
 * @returns {Object} Response
 */
const handleChargeFailed = async (event) => {
  const charge = event.data.object;
  console.log(`Charge failed: ${charge.id}`);
  
  return { received: true };
};

/**
 * Handle unhandled event types
 * @param {Object} event - Stripe event
 * @returns {Object} Response
 */
const handleUnhandledEvent = async (event) => {
  console.log(`Unhandled event type: ${event.type}`);
  
  return { received: true };
};

/**
 * Get PayPal order details
 * @param {String} orderID - PayPal order ID
 * @returns {Object} PayPal order details
 */
const getPayPalOrderDetails = async (orderID) => {
  try {
    if (!orderID) {
      throw new ApiError('PayPal order ID is required', 400);
    }

    // Create get order request
    const request = new paypal.orders.OrdersGetRequest(orderID);
    
    try {
      // Get order details from PayPal
      const order = await paypalClient.execute(request);
      
      console.log('PayPal order details retrieved:', order.result.id);
      
      return {
        orderId: order.result.id,
        status: order.result.status,
        intent: order.result.intent,
        amount: parseFloat(order.result.purchase_units[0].amount.value),
        currency: order.result.purchase_units[0].amount.currency_code,
        items: order.result.purchase_units[0].items.map(item => ({
          name: item.name,
          description: item.description,
          sku: item.sku,
          quantity: parseInt(item.quantity),
          unitAmount: parseFloat(item.unit_amount.value),
          tax: parseFloat(item.tax.value)
        })),
        shipping: order.result.purchase_units[0].shipping,
        createTime: order.result.create_time,
        updateTime: order.result.update_time
      };
    } catch (paypalError) {
      console.error('PayPal get order error:', paypalError);
      
      if (paypalError.statusCode === 404) {
        throw new ApiError('PayPal order not found', 404);
      } else {
        throw new ApiError(`PayPal get order failed: ${paypalError.message}`, 500);
      }
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

module.exports = {
  createPaymentIntent,
  createPayPalOrder,
  capturePayPalPayment,
  handleWebhookEvent,
  getPayPalOrderDetails
};