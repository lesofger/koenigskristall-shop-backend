const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered'),
    defaultValue: 'pending',
    allowNull: false
  },
  paymentIntentId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shippingAddress: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      isValidAddress(value) {
        if (!value.street || !value.city || !value.state || !value.zipCode || !value.country) {
          throw new Error('Shipping address must include street, city, state, zipCode, and country');
        }
      }
    }
  }
}, {
  timestamps: true
});

module.exports = Order;