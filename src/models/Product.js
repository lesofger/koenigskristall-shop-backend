const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}, {
  timestamps: true
});

/**
 * Check if product is in stock
 * @param {Number} quantity - Quantity to check
 * @returns {Boolean} True if product is in stock, false otherwise
 */
Product.prototype.isInStock = function(quantity = 1) {
  return this.quantity >= quantity;
};

/**
 * Reduce product quantity
 * @param {Number} quantity - Quantity to reduce
 * @param {Object} transaction - Optional transaction object
 * @returns {Promise} Promise that resolves when the product is updated
 */
Product.prototype.reduceQuantity = async function(quantity = 1, transaction = null) {
  if (!this.isInStock(quantity)) {
    throw new Error('Product is out of stock');
  }
  
  this.quantity -= quantity;
  return this.save({ transaction });
};

/**
 * Increase product quantity
 * @param {Number} quantity - Quantity to increase
 * @returns {Promise} Promise that resolves when the product is updated
 */
Product.prototype.increaseQuantity = async function(quantity = 1) {
  this.quantity += quantity;
  return this.save();
};

module.exports = Product;