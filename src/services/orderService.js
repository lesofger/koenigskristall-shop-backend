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
    
    // Add shipping cost to total amount
    const shippingCost = 4.99;
    totalAmount = Math.round((totalAmount + shippingCost) * 100) / 100;
    
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
    const { limit = 10, page = 1, status } = query;
    
    // Build where conditions
    const whereConditions = { userId };
    
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
    
    // Get user's orders with items
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
    const { status, limit = 10, page = 1, startDate, endDate } = query;
    const { Op } = require('sequelize');
    
    // Build filter conditions
    const whereConditions = {};
    
    // Filter by status if provided
    if (status) {
      whereConditions.status = status;
    }
    
    // Filter by date range if provided
    if (startDate || endDate) {
      whereConditions.createdAt = {};
      if (startDate) {
        // Create start date at beginning of day (00:00:00)
        const startDateTime = new Date(startDate + 'T00:00:00.000Z');
        whereConditions.createdAt[Op.gte] = startDateTime;
      }
      if (endDate) {
        // Create end date at end of day (23:59:59.999)
        const endDateTime = new Date(endDate + 'T23:59:59.999Z');
        whereConditions.createdAt[Op.lte] = endDateTime;
      }
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
 * Update order status (admin version)
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

/**
 * Update user's own order status
 * @param {Number} userId - User ID
 * @param {Number} orderId - Order ID
 * @param {String} status - New status
 * @returns {Object} Updated order
 */
const updateUserOrderStatus = async (userId, orderId, status) => {
  try {
    const order = await Order.findOne({
      where: { id: orderId, userId }
    });
    
    if (!order) {
      throw new ApiError('Order not found', 404);
    }
    
    order.status = status;
    await order.save();
    
    const updatedOrder = await Order.findByPk(orderId, {
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
    
    return updatedOrder;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

/**
 * Get order by ID (admin version - no user restriction)
 * @param {Number} orderId - Order ID
 * @returns {Object} Order
 */
const getOrderByIdAdmin = async (orderId) => {
  try {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'imageUrl', 'price']
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
 * Get order statistics
 * @param {Object} options - Options object with startDate and endDate
 * @returns {Object} Statistics
 */
const getOrderStatistics = async (options = {}) => {
  try {
    const { startDate, endDate } = options;
    const { Op } = require('sequelize');
    
    const dateConditions = {};
    
    if (startDate) {
      const startDateTime = new Date(startDate + 'T00:00:00.000Z');
      dateConditions[Op.gte] = startDateTime;
    }
    
    if (endDate) {
      const endDateTime = new Date(endDate + 'T23:59:59.999Z');
      dateConditions[Op.lte] = endDateTime;
    }
    
    if (!startDate && !endDate) {
      const now = new Date();
      const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateConditions[Op.gte] = defaultStartDate;
    }
    
    const totalOrders = await Order.count({
      where: {
        createdAt: dateConditions
      }
    });
    
    const totalRevenue = await Order.sum('totalAmount', {
      where: {
        createdAt: dateConditions,
        status: {
          [Op.in]: ['pending', 'processing', 'shipped', 'delivered']
        }
      }
    });
    
    const ordersByStatus = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: dateConditions
      },
      group: ['status']
    });
    
    const dailyOrders = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
      ],
      where: {
        createdAt: dateConditions
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
    });
    
    return {
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      },
      totalOrders,
      totalRevenue: totalRevenue || 0,
      ordersByStatus: ordersByStatus.map(item => ({
        status: item.status,
        count: parseInt(item.dataValues.count)
      })),
      dailyOrders: dailyOrders.map(item => ({
        date: item.dataValues.date,
        count: parseInt(item.dataValues.count),
        revenue: parseFloat(item.dataValues.revenue) || 0
      }))
    };
  } catch (error) {
    throw new ApiError(error.message, 500);
  }
};

/**
 * Update order details
 * @param {Number} orderId - Order ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated order
 */
const updateOrderDetails = async (orderId, updateData) => {
  try {
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      throw new ApiError('Order not found', 404);
    }
    
    // Update allowed fields
    const allowedFields = ['status', 'shippingAddress', 'notes', 'trackingNumber'];
    const fieldsToUpdate = {};
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        fieldsToUpdate[field] = updateData[field];
      }
    });
    
    // Validate status if provided
    if (fieldsToUpdate.status && !['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(fieldsToUpdate.status)) {
      throw new ApiError('Invalid status', 400);
    }
    
    // Update order
    await order.update(fieldsToUpdate);
    
    // Get updated order with relationships
    const updatedOrder = await Order.findByPk(orderId, {
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
    
    return updatedOrder;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

/**
 * Delete order
 * @param {Number} orderId - Order ID
 * @returns {Boolean} Success
 */
const deleteOrder = async (orderId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const order = await Order.findByPk(orderId, { transaction });
    
    if (!order) {
      await transaction.rollback();
      throw new ApiError('Order not found', 404);
    }
    
    // Get order items to restore product quantities
    const orderItems = await OrderItem.findAll({
      where: { orderId },
      include: [{ model: Product }],
      transaction
    });
    
    // Restore product quantities
    for (const item of orderItems) {
      await Product.update(
        { quantity: item.Product.quantity + item.quantity },
        { 
          where: { id: item.productId },
          transaction 
        }
      );
    }
    
    // Delete order items
    await OrderItem.destroy({
      where: { orderId },
      transaction
    });
    
    // Delete order
    await order.destroy({ transaction });
    
    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

/**
 * Bulk update order statuses
 * @param {Array} orderIds - Array of order IDs
 * @param {String} status - New status
 * @returns {Object} Result
 */
const bulkUpdateOrderStatus = async (orderIds, status) => {
  try {
    const result = await Order.update(
      { status },
      {
        where: {
          id: {
            [require('sequelize').Op.in]: orderIds
          }
        }
      }
    );
    
    return {
      updatedCount: result[0],
      status,
      orderIds
    };
  } catch (error) {
    throw new ApiError(error.message, 500);
  }
};

/**
 * Export orders
 * @param {Object} options - Export options
 * @returns {String} CSV data
 */
const exportOrders = async (options = {}) => {
  try {
    const { format = 'csv', status, startDate, endDate } = options;
    const { Op } = require('sequelize');
    
    // Build where conditions
    const whereConditions = {};
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (startDate || endDate) {
      whereConditions.createdAt = {};
      if (startDate) whereConditions.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereConditions.createdAt[Op.lte] = new Date(endDate);
    }
    
    // Get orders
    const orders = await Order.findAll({
      where: whereConditions,
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['name']
            }
          ]
        },
        {
          model: User,
          attributes: ['email', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Order ID,Date,Customer,Email,Status,Total Amount,Items,Shipping Address\n';
      const csvRows = orders.map(order => {
        const items = order.OrderItems.map(item => 
          `${item.Product.name} (${item.quantity}x €${item.price})`
        ).join('; ');
        
        const shippingAddress = order.shippingAddress ? 
          `${order.shippingAddress.street}, ${order.shippingAddress.city}` : 'N/A';
        
        return [
          order.id,
          order.createdAt.toISOString().split('T')[0],
          `${order.User.firstName} ${order.User.lastName}`,
          order.User.email,
          order.status,
          `€${order.totalAmount}`,
          items,
          shippingAddress
        ].join(',');
      });
      
      return csvHeader + csvRows.join('\n');
    }
    
    return orders;
  } catch (error) {
    throw new ApiError(error.message, 500);
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updateUserOrderStatus,
  getOrderByIdAdmin,
  getOrderStatistics,
  updateOrderDetails,
  deleteOrder,
  bulkUpdateOrderStatus,
  exportOrders
};