const { User } = require('../models');
const { ApiError } = require('../middleware/error');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

/**
 * Register a new user
 * @param {Object} userData - User data
 * @returns {Object} User data and tokens
 */
const register = async (userData) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      throw new ApiError('Email already in use', 400);
    }
    
    // Create new user
    const user = await User.create({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'customer' // Default role is customer
    });
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    return {
      user: user.toJSON(),
      accessToken,
      refreshToken
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

/**
 * Login a user
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Object} User data and tokens
 */
const login = async (email, password) => {
  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new ApiError('Invalid email or password', 401);
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError('Invalid email or password', 401);
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    return {
      user: user.toJSON(),
      accessToken,
      refreshToken
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

/**
 * Refresh access token
 * @param {String} refreshToken - Refresh token
 * @returns {Object} New access token and refresh token
 */
const refreshToken = async (token) => {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(token);
    
    // Find user by ID
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new ApiError(`Invalid refresh token ${token} |||||| ${decoded}`, 401);
    }
    
    // Generate new tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    return {
      accessToken,
      refreshToken
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError('Refresh token expired', 402);
    }
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError('Invalid refresh token', 401);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

module.exports = {
  register,
  login,
  refreshToken
};