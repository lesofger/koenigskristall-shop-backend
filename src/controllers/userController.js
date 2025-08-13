const { User } = require('../models');
const { ApiError } = require('../middleware/error');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Get all users with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      const decodedSearch = decodeURIComponent(search);
      whereClause[Op.or] = [
        sequelize.where(sequelize.fn('LOWER', sequelize.col('firstName')), 'LIKE', `%${decodedSearch.toLowerCase()}%`),
        sequelize.where(sequelize.fn('LOWER', sequelize.col('lastName')), 'LIKE', `%${decodedSearch.toLowerCase()}%`),
        sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), 'LIKE', `%${decodedSearch.toLowerCase()}%`)
      ];
    }

    if (role && ['customer', 'admin'].includes(role)) {
      whereClause.role = role;
    }

    let orderClause;
    if (sortBy === 'email') {
      orderClause = [
        [sequelize.fn('LOWER', sequelize.col('email')), 'ASC']
      ];
    } else {
      orderClause = [[sortBy, sortOrder.toUpperCase()]];
    }

    let { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: orderClause,
      limit: sortBy === 'email' ? undefined : parseInt(limit), // Don't limit for email sorting
      offset: sortBy === 'email' ? 0 : parseInt(offset) // Don't offset for email sorting
    });

    if (sortBy === 'email') {
      users = users.sort((a, b) => {
        const emailA = a.email.toLowerCase();
        const emailB = b.email.toLowerCase();
        
        const usernameA = emailA.split('@')[0];
        const usernameB = emailB.split('@')[0];
        
        const numA = parseInt(usernameA.match(/\d+/)?.[0] || '0');
        const numB = parseInt(usernameB.match(/\d+/)?.[0] || '0');
        
        if (numA !== numB) {
          return sortOrder.toUpperCase() === 'ASC' ? numA - numB : numB - numA;
        } else {
          return sortOrder.toUpperCase() === 'ASC' 
            ? usernameA.localeCompare(usernameB) 
            : usernameB.localeCompare(usernameA);
        }
      });
      
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      users = users.slice(startIndex, endIndex);
    }

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers: count,
          usersPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const createUser = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role = 'customer' } = req.body;

    if (!email || !password || !firstName || !lastName) {
      throw new ApiError('Email, password, firstName, and lastName are required', 400);
    }

    if (role && !['customer', 'admin'].includes(role)) {
      throw new ApiError('Role must be either "customer" or "admin"', 400);
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ApiError('User with this email already exists', 409);
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role
    });

    res.status(201).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (role && !['customer', 'admin'].includes(role)) {
      throw new ApiError('Role must be either "customer" or "admin"', 400);
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new ApiError('User with this email already exists', 409);
      }
    }

    await user.update({
      email: email || user.email,
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      role: role || user.role
    });

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      throw new ApiError('Password is required', 400);
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    await user.update({ password });

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (req.user.id === parseInt(id)) {
      throw new ApiError('Cannot delete your own account', 400);
    }

    await user.destroy();

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getUserStatistics = async (req, res, next) => {
  try {
    const totalUsers = await User.count();
    const customerCount = await User.count({ where: { role: 'customer' } });
    const adminCount = await User.count({ where: { role: 'admin' } });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await User.count({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        customerCount,
        adminCount,
        recentUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export users to CSV
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const exportUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    const csvHeader = 'ID,Email,First Name,Last Name,Role,Created At,Updated At\n';
    const csvRows = users.map(user => {
      return `${user.id},"${user.email}","${user.firstName}","${user.lastName}","${user.role}","${user.createdAt}","${user.updatedAt}"`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  getUserStatistics,
  exportUsers
}; 