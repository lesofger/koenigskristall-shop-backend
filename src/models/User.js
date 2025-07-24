const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const { password: passwordConfig } = require('../config/auth');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('customer', 'admin'),
    defaultValue: 'customer',
    allowNull: false
  }
}, {
  timestamps: true,
  hooks: {
    // Hash password before saving
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, passwordConfig.saltRounds);
      }
    },
    // Hash password before updating
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, passwordConfig.saltRounds);
      }
    }
  }
});

/**
 * Compare password with hashed password
 * @param {String} password - Password to compare
 * @returns {Boolean} True if password matches, false otherwise
 */
User.prototype.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

/**
 * Get user data without sensitive information
 * @returns {Object} User data without password
 */
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;