require('dotenv').config();

module.exports = {
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_here',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // Password hashing configuration
  password: {
    saltRounds: 10 // Number of salt rounds for bcrypt
  },
  
  // Stripe configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  }
};