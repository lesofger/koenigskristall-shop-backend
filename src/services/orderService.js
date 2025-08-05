const { Order, OrderItem, Product, User } = require('../models');
const { ApiError } = require('../middleware/error');
const { sequelize } = require('../config/database');

/**
 * Create a new order
 * @param {Number} userId - User ID
 * @param {String} paymentIntentId - Stripe payment intent ID
 * @param {Object} shippingAddress - Shipping address
 * @param {Array} items - Array of items with productId, quantity, and price
 * @returns {Object} Created order
 */
const createOrder = async (userId, paymentIntentId, shippingAddress, items) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Starting order creation with transaction:', transaction.id);
    
    if (!items || items.length === 0) {
      await transaction.rollback();
      throw new ApiError('Items are required for order creation', 400);
    }
    
    // Validate items and check stock
    const validatedItems = [];
    let totalAmount = 0;
    
    for (const item of items) {
      // Get product details from database
      const product = await Product.findByPk(item.productId, { transaction });
      if (!product) {
        await transaction.rollback();
        throw new ApiError(`Product with ID ${item.productId} not found`, 404);
      }
      
      // Check if product is in stock
      if (!product.isInStock(item.quantity)) {
        await transaction.rollback();
        throw new ApiError(`Product "${product.name}" is out of stock`, 400);
      }
      
      // Calculate item total
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        product
      });
    }
    
    // Create order
    const order = await Order.create({
      userId,
      totalAmount,
      status: 'pending',
      paymentIntentId,
      shippingAddress
    }, { transaction });
    
    // Create order items and update product quantities within transaction
    const orderItems = [];
    for (const item of validatedItems) {
      try {
        const orderItem = await OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }, { transaction });
        
        orderItems.push(orderItem);

        // Update product quantity within the same transaction
        await Product.update(
          { quantity: item.product.quantity - item.quantity },
          { 
            where: { id: item.productId },
            transaction 
          }
        );
      } catch (itemError) {
        console.error('Error creating order item:', itemError);
        await transaction.rollback();
        throw new ApiError(`Failed to create order item: ${itemError.message}`, 500);
      }
    }
    
    await transaction.commit();
    console.log('Transaction committed successfully');
    
    // Get the created order with items (outside transaction)
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'imageUrl']
            }
          ]
        },
        {
          model: User,
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ]
    });
    return createdOrder;
  } catch (error) {
    console.error('Error in createOrder:', error);
    
    // Only rollback if transaction is still active
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

/**
 * Get user's orders
 * @param {Number} userId - User ID
 * @param {Object} query - Query parameters
 * @returns {Array} User's orders
 */
const getUserOrders = async (userId, query = {}) => {
  try {
    const { limit = 10, page = 1 } = query;
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Get total count of orders (not order items)
    const totalCount = await Order.count({
      where: { userId }
    });
    
    // Get user's orders with items
    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'imageUrl']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      orders,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    };
  } catch (error) {
    throw new ApiError(error.message, 500);
  }
};

/**
 * Get order by ID
 * @param {Number} userId - User ID
 * @param {Number} orderId - Order ID
 * @returns {Object} Order
 */
const getOrderById = async (userId, orderId) => {
  try {
    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'imageUrl']
            }
          ]
        },
        {
          model: User,
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ]
    });
    
    if (!order) {
      throw new ApiError('Order not found', 404);
    }
    
    return order;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

/**
 * Get all orders (admin only)
 * @param {Object} query - Query parameters
 * @returns {Array} All orders
 */
const getAllOrders = async (query = {}) => {
  try {
    const { status, limit = 10, page = 1 } = query;
    
    // Build filter conditions
    const whereConditions = {};
    
    // Filter by status if provided
    if (status) {
      whereConditions.status = status;
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Get total count of orders (not order items)
    const totalCount = await Order.count({
      where: whereConditions
    });
    
    // Get all orders with items
    const orders = await Order.findAll({
      where: whereConditions,
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'imageUrl']
            }
          ]
        },
        {
          model: User,
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      orders,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    };
  } catch (error) {
    throw new ApiError(error.message, 500);
  }
};

/**
 * Update order status
 * @param {Number} orderId - Order ID
 * @param {String} status - New status
 * @returns {Object} Updated order
 */
const updateOrderStatus = async (orderId, status) => {
  try {
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      throw new ApiError('Order not found', 404);
    }
    
    // Update status
    order.status = status;
    await order.save();
    
    return order;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};