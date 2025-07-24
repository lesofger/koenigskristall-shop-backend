const productService = require('../services/productService');

/**
 * Get all products
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getAllProducts = async (req, res, next) => {
  try {
    const result = await productService.getAllProducts(req.query);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await productService.getProductById(id);
    
    res.status(200).json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get products by category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getProductsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    
    const result = await productService.getProductsByCategory(category, req.query);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductsByCategory
};