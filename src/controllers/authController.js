const authService = require('../services/authService');
const { ApiError } = require('../middleware/error');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    const result = await authService.register({
      email,
      password,
      firstName,
      lastName
    });
    
    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const result = await authService.login(email, password);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new ApiError('Refresh token is required', 400);
    }
    
    const result = await authService.refreshToken(refreshToken);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = (req, res) => {
  // In a stateless JWT authentication system, the client is responsible for
  // discarding the tokens. The server doesn't need to do anything.
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

module.exports = {
  register,
  login,
  refreshToken,
  logout
};