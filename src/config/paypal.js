const paypal = require('@paypal/checkout-server-sdk');

// PayPal configuration
const paypalConfig = {
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  mode: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox'
};

// Configure PayPal environment
let environment;
if (paypalConfig.mode === 'live') {
  environment = new paypal.core.LiveEnvironment(paypalConfig.clientId, paypalConfig.clientSecret);
} else {
  environment = new paypal.core.SandboxEnvironment(paypalConfig.clientId, paypalConfig.clientSecret);
}

// Create PayPal client
const paypalClient = new paypal.core.PayPalHttpClient(environment);

module.exports = {
  paypalClient,
  paypalConfig
}; 