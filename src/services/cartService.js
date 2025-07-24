const { Cart, CartItem, Product } = require('../models');
const { ApiError } = require('../middleware/error');
const { sequelize } = require('../config/database');

/**
 * Get or create a cart for a user
 * @param {Number} userId - User ID
 * @returns {Object} Cart
 */
const getOrCreateCart = async (userId) => {
  try {
    // Find or create cart
    const [cart] = await Cart.findOrCreate({
      where: { userId }
    });
    
    return cart;
  } catch (error) {
    throw new ApiError(error.message, 500);
  }
};

/**
 * Get user's cart with items
 * @param {Number} userId - User ID
 * @returns {Object} Cart with items
 */
const getUserCart = async (userId) => {
  try {
    // Get or create cart
    const cart = await getOrCreateCart(userId);
    
    // Get cart items with product details
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'price', 'imageUrl', 'quantity']
        }
      ]
    });
    
    // Calculate total price
    const totalPrice = cartItems.reduce((total, item) => {
      return total + (item.Product.price * item.quantity);
    }, 0);
    
    return {
      id: cart.id,
      items: cartItems,
      totalPrice,
      itemCount: cartItems.length
    };
  } catch (error) {
    throw new ApiError(error.message, 500);
  }
};

/**
 * Add item to cart
 * @param {Number} userId - User ID
 * @param {Number} productId - Product ID
 * @param {Number} quantity - Quantity
 * @returns {Object} Updated cart
 */
const addItemToCart = async (userId, productId, quantity) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Get product
    const product = await Product.findByPk(productId, { transaction });
    
    if (!product) {
      await transaction.rollback();
      throw new ApiError('Product not found', 404);
    }
    
    // Check if product is in stock
    if (!product.isInStock(quantity)) {
      await transaction.rollback();
      throw new ApiError('Product is out of stock', 400);
    }
    
    // Get or create cart
    const cart = await getOrCreateCart(userId);
    
    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId
      },
      transaction
    });
    
    if (cartItem) {
      // Update quantity
      cartItem.quantity += quantity;
      await cartItem.save({ transaction });
    } else {
      // Create new cart item
      cartItem = await CartItem.create({
        cartId: cart.id,
        productId,
        quantity
      }, { transaction });
    }
    
    await transaction.commit();
    
    // Get updated cart
    return getUserCart(userId);
  } catch (error) {
    await transaction.rollback();
    
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

/**
 * Update cart item quantity
 * @param {Number} userId - User ID
 * @param {Number} itemId - Cart item ID
 * @param {Number} quantity - New quantity
 * @returns {Object} Updated cart
 */
const updateCartItemQuantity = async (userId, itemId, quantity) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Get cart
    const cart = await Cart.findOne({
      where: { userId },
      transaction
    });
    
    if (!cart) {
      await transaction.rollback();
      throw new ApiError('Cart not found', 404);
    }
    
    // Get cart item
    const cartItem = await CartItem.findOne({
      where: {
        id: itemId,
        cartId: cart.id
      },
      transaction
    });
    
    if (!cartItem) {
      await transaction.rollback();
      throw new ApiError('Cart item not found', 404);
    }
    
    // Get product
    const product = await Product.findByPk(cartItem.productId, { transaction });
    
    if (!product) {
      await transaction.rollback();
      throw new ApiError('Product not found', 404);
    }
    
    // Check if product is in stock
    if (!product.isInStock(quantity)) {
      await transaction.rollback();
      throw new ApiError('Product is out of stock', 400);
    }
    
    // Update quantity
    cartItem.quantity = quantity;
    await cartItem.save({ transaction });
    
    await transaction.commit();
    
    // Get updated cart
    return getUserCart(userId);
  } catch (error) {
    await transaction.rollback();
    
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

/**
 * Remove item from cart
 * @param {Number} userId - User ID
 * @param {Number} itemId - Cart item ID
 * @returns {Object} Updated cart
 */
const removeItemFromCart = async (userId, itemId) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Get cart
    const cart = await Cart.findOne({
      where: { userId },
      transaction
    });
    
    if (!cart) {
      await transaction.rollback();
      throw new ApiError('Cart not found', 404);
    }
    
    // Get cart item
    const cartItem = await CartItem.findOne({
      where: {
        id: itemId,
        cartId: cart.id
      },
      transaction
    });
    
    if (!cartItem) {
      await transaction.rollback();
      throw new ApiError('Cart item not found', 404);
    }
    
    // Delete cart item
    await cartItem.destroy({ transaction });
    
    await transaction.commit();
    
    // Get updated cart
    return getUserCart(userId);
  } catch (error) {
    await transaction.rollback();
    
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

/**
 * Clear cart
 * @param {Number} userId - User ID
 * @returns {Object} Empty cart
 */
const clearCart = async (userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Get cart
    const cart = await Cart.findOne({
      where: { userId },
      transaction
    });
    
    if (!cart) {
      await transaction.rollback();
      throw new ApiError('Cart not found', 404);
    }
    
    // Delete all cart items
    await CartItem.destroy({
      where: { cartId: cart.id },
      transaction
    });
    
    await transaction.commit();
    
    // Get updated cart
    return getUserCart(userId);
  } catch (error) {
    await transaction.rollback();
    
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message, 500);
  }
};

module.exports = {
  getUserCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart
};