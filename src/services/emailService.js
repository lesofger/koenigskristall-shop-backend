const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
console.log("api key========>", process.env.SENDGRID_API_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send payment confirmation email to customer
 * @param {Object} order - Order object with user and items
 * @param {String} paymentMethod - Payment method used (stripe/paypal)
 * @param {String} transactionId - Payment transaction ID
 * @returns {Object} Email result
 */
const sendPaymentConfirmationEmail = async (order, paymentMethod, transactionId) => {
  try {
    if (!order || !order.User || !order.User.email) {
      throw new Error('Invalid order data for email');
    }

    const user = order.User;
    const items = order.OrderItems || [];
    
    // Calculate total items count
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Format items for email
    const itemsList = items.map(item => {
      const product = item.Product;
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <img src="${product.imageUrl || ''}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${product.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">€${item.price.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">€${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    // Format shipping address
    const shippingAddress = order.shippingAddress ? `
      <p><strong>Shipping Address:</strong></p>
      <p>
        ${order.shippingAddress.street}<br>
        ${order.shippingAddress.city}${order.shippingAddress.state ? ', ' + order.shippingAddress.state : ''}<br>
        ${order.shippingAddress.zipCode}<br>
        ${order.shippingAddress.country || 'Germany'}
      </p>
    ` : '';

    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Zahlungsbestätigung - Koenigskristall Shop</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: bold; }
          .items-table td { padding: 10px; }
          .total { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .success-icon { font-size: 48px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>Zahlung erfolgreich!</h1>
            <p>Danke für deine Bestellung bei Koenigskristall</p>
          </div>
          
          <div class="content">
            <p>Dear ${user.firstName} ${user.lastName},</p>
            
            <p>Deine Zahlung wurde erfolgreich verarbeitet und deine Bestellung ist nun bestätigt!</p>
            
            <div class="order-details">
              <h3>Bestelldetails</h3>
              <p><strong>Bestell ID:</strong> #${order.id}</p>
              <p><strong>Bestelldatum:</strong> ${new Date(order.createdAt).toLocaleDateString('de-DE')}</p>
              <p><strong>Bezahlmethode:</strong> ${
  paymentMethod === 'credit_card' ? 'Credit Card' : 
  paymentMethod === 'bank_transfer' ? 'Bank Transfer (SEPA)' : 
  paymentMethod === 'paypal' ? 'PayPal' : 
  'Credit Card' // fallback
}</p>
              <p><strong>Transaktions ID:</strong> ${transactionId}</p>
              
              <h4>Deine Kristalle:</h4>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
              </table>
              
              <div class="total">
                <p><strong>Zwischensumme:</strong> €${(order.totalAmount - 4.49).toFixed(2)}</p>
                <p><strong>Lieferkosten:</strong> €4.49</p>
                <p><strong>Gesamtsumme:</strong> €${order.totalAmount.toFixed(2)}</p>
              </div>
            </div>
            
            ${shippingAddress}
            
            <p><strong>Wie geht es weiter?</strong></p>
            <ul>
              <li>Ich werde deine Bestellung bearbeiten und zum versenden vorbereiten</li>
              <li>Danach erhälst du von mir eine Bestätigung, das dein Paket versendet wurde</li>
              <li>Dann wirst du in 2-3 Tagen, deinen Kristall in den Händen halten</li>
            </ul>
            
            <p>Wenn du fragen zu deiner Bestellung haben solltest, zögere nicht, mich zu kontaktieren.</p>
            
            <p>Danke, dass du mir dein Vertrauen gibst!</p>
            
            <p>Liebe Grüße,<br>Maja von Koenigskristall</p>
          </div>
          
          <div class="footer">
            <p>Diese email wurde gesendet an ${user.email}</p>
            <p>© ${new Date().getFullYear()} Koenigskristall Shop. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const msg = {
      to: user.email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'shop@koenigskristall.de',
        name: 'Königskristall Shop'
      },
      subject: `Payment Confirmed - Order #${order.id}`,
      html: emailContent,
      text: `Payment Confirmed for Order #${order.id}\n\nDear ${user.firstName} ${user.lastName},\n\nYour payment has been successfully processed and your order is now confirmed!\n\nOrder Details:\nOrder ID: #${order.id}\nOrder Date: ${new Date(order.createdAt).toLocaleDateString('de-DE')}\nPayment Method: ${
  paymentMethod === 'credit_card' ? 'Credit Card' : 
  paymentMethod === 'bank_transfer' ? 'Bank Transfer (SEPA)' : 
  paymentMethod === 'paypal' ? 'PayPal' : 
  'Credit Card' // fallback
}\nTransaction ID: ${transactionId}\n\nTotal Amount: €${order.totalAmount.toFixed(2)}\n\nThank you for choosing Königskristall Shop!\n\nBest regards,\nThe Königskristall Team`
    };

    const result = await sgMail.send(msg);
    
    console.log(`Payment confirmation email sent successfully to ${user.email} for order #${order.id}`);
    
    return {
      success: true,
      messageId: result[0].headers['x-message-id'],
      email: user.email,
      orderId: order.id
    };

  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    throw new Error(`Failed to send payment confirmation email: ${error.message}`);
  }
};

/**
 * Send admin notification email for new order
 * @param {Object} order - Order object with user and items
 * @param {String} paymentMethod - Payment method used
 * @param {String} transactionId - Payment transaction ID
 * @returns {Object} Email result
 */
const sendAdminOrderNotification = async (order, paymentMethod, transactionId) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@koenigskristall-shop.com';
    console.log("adminEmail========>", adminEmail);

    if (!adminEmail) {
      console.log('Admin email not configured, skipping admin notification');
      return { success: false, reason: 'Admin email not configured' };
    }

    const user = order.User;
    const items = order.OrderItems || [];
    
    const itemsList = items.map(item => {
      const product = item.Product;
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${product.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">€${item.price.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">€${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Neue Bestellung  - Koenigskristall Shop</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: bold; }
          .items-table td { padding: 10px; }
          .total { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🛍️ New Order Received</h2>
          </div>
          
          <div class="content">
            <p>Eine neue Bestellung kam gerade rein, die Zahlung wurde bestätigt!</p>
            
            <div class="order-details">
              <h3>Order Information</h3>
              <p><strong>Bestell ID:</strong> #${order.id}</p>
              <p><strong>Bestelldatum:</strong> ${new Date(order.createdAt).toLocaleDateString('de-DE')}</p>
              <p><strong>Bezahlmethode:</strong> ${paymentMethod === 'stripe' ? 'Credit Card' : 'PayPal'}</p>
              <p><strong>Transaktions ID:</strong> ${transactionId}</p>
              
              <h4>Customer Information</h4>
              <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              
              <h4>Order Items</h4>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Menge</th>
                    <th>Preis</th>
                    <th>Gesamtsumme</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
              </table>
              
              <div class="total">
                <p><strong>Gesamtsumme:</strong> €${order.totalAmount.toFixed(2)}</p>
              </div>
            </div>
            
            <p>Maja bitte bearbeite die Bestellung und bearbeite den status der Bestellung im Adminbereich</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const msg = {
      to: adminEmail,
      from: {
        email: 'no-reply@koenigskristall.de',
        name: 'Königskristall Shop System'
      },
      subject: `New Order #${order.id} - Payment Confirmed`,
      html: emailContent,
      text: `New Order #${order.id} - Payment Confirmed\n\nA new order has been placed and payment has been confirmed!\n\nOrder ID: #${order.id}\nCustomer: ${user.firstName} ${user.lastName}\nEmail: ${user.email}\nTotal Amount: €${order.totalAmount.toFixed(2)}\n\nPlease process this order and update the status accordingly.`
    };

    const result = await sgMail.send(msg);
    
    console.log(`Admin notification email sent successfully for order #${order.id}`);
    
    return {
      success: true,
      messageId: result[0].headers['x-message-id'],
      email: adminEmail,
      orderId: order.id
    };

  } catch (error) {
    console.error('Error sending admin notification email:', error);
    // Don't throw error for admin notification failure
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendPaymentConfirmationEmail,
  sendAdminOrderNotification
}; 
