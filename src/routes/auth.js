const express = require('express');
const { register, login, refreshToken, logout } = require('../controllers/authController');
const { registerValidation, loginValidation, validate } = require('../utils/validation');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidation, validate, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post('/login', loginValidation, validate, login);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout a user
 * @access  Public
 */
router.post('/logout', logout);

module.exports = router;