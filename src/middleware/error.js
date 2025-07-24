/**
 * Global error handling middleware
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Default status code and message
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log the error
  console.error(`Error: ${message}`);
  console.error(err.stack);
  
  // Send the error response
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 Not Found middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Route not found: ${req.originalUrl}`
  });
};

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  /**
   * Create a new API error
   * @param {String} message - Error message
   * @param {Number} statusCode - HTTP status code
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  ApiError
};