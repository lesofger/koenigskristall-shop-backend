const User = require('./User');
const Product = require('./Product');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

// Define relationships between models

// User and Cart (One-to-One)
User.hasOne(Cart, { foreignKey: 'userId', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'userId' });

// Cart and CartItem (One-to-Many)
Cart.hasMany(CartItem, { foreignKey: 'cartId', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });

// Product and CartItem (One-to-Many)
Product.hasMany(CartItem, { foreignKey: 'productId' });
CartItem.belongsTo(Product, { foreignKey: 'productId' });

// User and Order (One-to-Many)
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

// Order and OrderItem (One-to-Many)
Order.hasMany(OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// Product and OrderItem (One-to-Many)
Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

module.exports = {
  User,
  Product,
  Cart,
  CartItem,
  Order,
  OrderItem
};