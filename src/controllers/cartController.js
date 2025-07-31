const { Cart, CartItem, Product } = require('../models');
const { ApiError } = require('../middleware/error');

/**
 * Get user's cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Find or create cart for user
    let cart = await Cart.findOne({ where: { userId } });
    
    if (!cart) {
      cart = await Cart.create({ userId });
    }
    
    // Get cart items with product details
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'description', 'price', 'category', 'imageUrl', 'quantity']
        }
      ]
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        cartId: cart.id,
        items: cartItems.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          product: item.Product
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;
    
    if (!productId) {
      throw new ApiError('Product ID is required', 400);
    }
    
    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new ApiError('Product not found', 404);
    }
    
    // Check if product is in stock
    if (!product.isInStock(quantity)) {
      throw new ApiError('Product is out of stock', 400);
    }
    
    // Find or create cart for user
    let cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      cart = await Cart.create({ userId });
    }
    
    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      where: { cartId: cart.id, productId }
    });
    
    if (cartItem) {
      // Update quantity
      cartItem.quantity += quantity;
      await cartItem.save();
    } else {
      // Create new cart item
      cartItem = await CartItem.create({
        cartId: cart.id,
        productId,
        quantity
      });
    }
    
    // Get updated cart item with product details
    const updatedCartItem = await CartItem.findOne({
      where: { id: cartItem.id },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'description', 'price', 'category', 'imageUrl', 'quantity']
        }
      ]
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        id: updatedCartItem.id,
        productId: updatedCartItem.productId,
        quantity: updatedCartItem.quantity,
        product: updatedCartItem.Product
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update cart item quantity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    
    if (quantity < 1) {
      throw new ApiError('Quantity must be at least 1', 400);
    }
    
    // Find cart item
    const cartItem = await CartItem.findOne({
      where: { id: cartItemId },
      include: [
        {
          model: Cart,
          where: { userId }
        },
        {
          model: Product
        }
      ]
    });
    
    if (!cartItem) {
      throw new ApiError('Cart item not found', 404);
    }
    
    // Check if product is in stock
    if (!cartItem.Product.isInStock(quantity)) {
      throw new ApiError('Product is out of stock', 400);
    }
    
    // Update quantity
    cartItem.quantity = quantity;
    await cartItem.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        id: cartItem.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        product: cartItem.Product
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { cartItemId } = req.params;
    
    // Find cart item
    const cartItem = await CartItem.findOne({
      where: { id: cartItemId },
      include: [
        {
          model: Cart,
          where: { userId }
        }
      ]
    });
    
    if (!cartItem) {
      throw new ApiError('Cart item not found', 404);
    }
    
    // Delete cart item
    await cartItem.destroy();
    
    res.status(200).json({
      status: 'success',
      message: 'Item removed from cart'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Find user's cart
    const cart = await Cart.findOne({ where: { userId } });
    
    if (cart) {
      // Delete all cart items
      await CartItem.destroy({ where: { cartId: cart.id } });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Cart cleared'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
}; 