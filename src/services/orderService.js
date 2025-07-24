const { Order, OrderItem, Cart, CartItem, Product, User } = require('../models');
const { ApiError } = require('../middleware/error');
const { sequelize } = require('../config/database');

/**
 * Create a new order
 * @param {Number} userId - User ID
 * @param {String} paymentIntentId - Stripe payment intent ID
 * @param {Object} shippingAddress - Shipping address
 * @returns {Object} Created order
 */
const createOrder = async (userId, paymentIntentId, shippingAddress) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Get user's cart
    const cart = await Cart.findOne({
      where: { userId },
      transaction
    });
    
    if (!cart) {
      await transaction.rollback();
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
      ],
      transaction
    });
    
    if (cartItems.length === 0) {
      await transaction.rollback();
      throw new ApiError('Cart is empty', 400);
    }
    
    // Check if all products are in stock
    for (const item of cartItems) {
      if (!item.Product.isInStock(item.quantity)) {
        await transaction.rollback();
        throw new ApiError(`Product "${item.Product.name}" is out of stock`, 400);
      }
    }
    
    // Calculate total amount
    const totalAmount = cartItems.reduce((total, item) => {
      return total + (item.Product.price * item.quantity);
    }, 0);
    
    // Create order
    const order = await Order.create({
      userId,
      totalAmount,
      status: 'pending',
      paymentIntentId,
      shippingAddress
    }, { transaction });
    
    // Create order items
    const orderItems = [];
    for (const item of cartItems) {
      const orderItem = await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.Product.price
      }, { transaction });
      
      orderItems.push(orderItem);
      
      // Reduce product quantity
      await item.Product.reduceQuantity(item.quantity, transaction);
    }
    
    // Clear cart
    await CartItem.destroy({
      where: { cartId: cart.id },
      transaction
    });
    
    await transaction.commit();
    
    // Get the created order with items
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
    await transaction.rollback();
    
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
    
    // Get user's orders
    const { count, rows: orders } = await Order.findAndCountAll({
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
    const totalPages = Math.ceil(count / limit);
    
    return {
      orders,
      pagination: {
        total: count,
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
    
    // Get all orders
    const { count, rows: orders } = await Order.findAndCountAll({
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
    const totalPages = Math.ceil(count / limit);
    
    return {
      orders,
      pagination: {
        total: count,
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