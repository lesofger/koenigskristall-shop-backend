const { body, param, query, validationResult } = require('express-validator');

/**
 * Validate request based on validation rules
 * @returns {Function} Middleware function
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

/**
 * User registration validation rules
 */
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim(),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .trim()
];

/**
 * User login validation rules
 */
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Order creation validation rules
 */
const orderValidation = [
  body('shippingAddress')
    .notEmpty()
    .withMessage('Shipping address is required')
    .isObject()
    .withMessage('Shipping address must be an object'),
  body('shippingAddress.street')
    .notEmpty()
    .withMessage('Street is required'),
  body('shippingAddress.city')
    .notEmpty()
    .withMessage('City is required'),
  body('shippingAddress.state')
    .notEmpty()
    .withMessage('State is required'),
  body('shippingAddress.zipCode')
    .notEmpty()
    .withMessage('Zip code is required'),
  body('shippingAddress.country')
    .notEmpty()
    .withMessage('Country is required'),
  body('paymentIntentId')
    .notEmpty()
    .withMessage('Payment intent ID is required')
];

/**
 * Order status update validation rules
 */
const orderStatusValidation = [
  body('status')
    .isIn(['pending', 'processing', 'shipped', 'delivered'])
    .withMessage('Status must be one of: pending, processing, shipped, delivered')
];

/**
 * Product quantity update validation rules
 */
const productQuantityValidation = [
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer')
];

/**
 * User creation validation rules
 */
const createUserValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim(),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .trim(),
  body('role')
    .optional()
    .isIn(['customer', 'admin'])
    .withMessage('Role must be either "customer" or "admin"')
];

/**
 * User update validation rules
 */
const updateUserValidation = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('firstName')
    .optional()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .trim(),
  body('lastName')
    .optional()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .trim(),
  body('role')
    .optional()
    .isIn(['customer', 'admin'])
    .withMessage('Role must be either "customer" or "admin"')
];

/**
 * User password update validation rules
 */
const updatePasswordValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

/**
 * User ID parameter validation
 */
const userIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

/**
 * User query parameters validation
 */
const userQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['customer', 'admin'])
    .withMessage('Role filter must be either "customer" or "admin"'),
  query('sortBy')
    .optional()
    .isIn(['id', 'email', 'firstName', 'lastName', 'role', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be either "ASC" or "DESC"')
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  orderValidation,
  orderStatusValidation,
  productQuantityValidation,
  createUserValidation,
  updateUserValidation,
  updatePasswordValidation,
  userIdValidation,
  userQueryValidation
};