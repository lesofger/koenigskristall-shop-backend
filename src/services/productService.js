const { Product } = require('../models');
const { ApiError } = require('../middleware/error');
const { Op } = require('sequelize');

/**
 * Get all products
 * @param {Object} query - Query parameters
 * @returns {Array} Array of products
 */
const getAllProducts = async (query = {}) => {
  try {
    const { category, search, limit = 10, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    
    // Build filter conditions
    const whereConditions = {};
    
    // Filter by category if provided
    if (category) {
      whereConditions.category = category;
    }
    
    // Search by name or description if provided
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Validate and set sort parameters
    let orderColumn = 'createdAt';
    let orderDirection = 'DESC';
    
    // Map sortBy to actual column names
    switch (sortBy) {
      case 'price':
        orderColumn = 'price';
        break;
      case 'date':
        orderColumn = 'createdAt';
        break;
      default:
        orderColumn = 'createdAt';
    }
    
    // Set sort order
    orderDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    // Get products
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[orderColumn, orderDirection]]
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    return {
      products,
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
 * Get product by ID
 * @param {Number} id - Product ID
 * @returns {Object} Product
 */
const getProductById = async (id) => {
  try {
    const product = await Product.findByPk(id);
    
    if (!product) {
      throw new ApiError('Product not found', 404);
    }
    
    return product;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

/**
 * Get products by category
 * @param {String} category - Product category
 * @param {Object} query - Query parameters
 * @returns {Array} Array of products
 */
const getProductsByCategory = async (category, query = {}) => {
  try {
    const { limit = 10, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Validate and set sort parameters
    let orderColumn = 'createdAt';
    let orderDirection = 'DESC';
    
    // Map sortBy to actual column names
    switch (sortBy) {
      case 'price':
        orderColumn = 'price';
        break;
      case 'date':
        orderColumn = 'createdAt';
        break;
      default:
        orderColumn = 'createdAt';
    }
    
    // Set sort order
    orderDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    // Get products by category
    const { count, rows: products } = await Product.findAndCountAll({
      where: { category },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[orderColumn, orderDirection]]
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    return {
      products,
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
 * Update product quantity
 * @param {Number} id - Product ID
 * @param {Number} quantity - New quantity
 * @returns {Object} Updated product
 */
const updateProductQuantity = async (id, quantity) => {
  try {
    const product = await Product.findByPk(id);
    
    if (!product) {
      throw new ApiError('Product not found', 404);
    }
    
    product.quantity = quantity;
    await product.save();
    
    return product;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  updateProductQuantity
};