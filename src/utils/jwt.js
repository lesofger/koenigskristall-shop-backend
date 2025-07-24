const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/auth');

/**
 * Generate an access token for a user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      role: user.role 
    },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
};

/**
 * Generate a refresh token for a user
 * @param {Object} user - User object
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpiresIn }
  );
};

/**
 * Verify an access token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    throw error;
  }
};

/**
 * Verify a refresh token
 * @param {String} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.refreshSecret);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};