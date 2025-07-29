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

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  orderValidation,
  orderStatusValidation,
  productQuantityValidation
};