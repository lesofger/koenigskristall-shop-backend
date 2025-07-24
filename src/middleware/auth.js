const { verifyAccessToken } = require('../utils/jwt');

/**
 * Middleware to authenticate users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    // Check if the authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Authentication required'
      });
    }
    
    // Check if the authorization header has the correct format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Invalid authorization format'
      });
    }
    
    // Get the token
    const token = parts[1];
    
    // Verify the token
    const decoded = verifyAccessToken(token);
    
    // Set the user in the request object
    req.user = decoded;
    
    // Continue to the next middleware
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Invalid token'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      statusCode: 500,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to authorize admin users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authorizeAdmin = (req, res, next) => {
  // Check if the user is authenticated
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Authentication required'
    });
  }
  
  // Check if the user is an admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      statusCode: 403,
      message: 'Admin access required'
    });
  }
  
  // Continue to the next middleware
  next();
};

module.exports = {
  authenticate,
  authorizeAdmin
};