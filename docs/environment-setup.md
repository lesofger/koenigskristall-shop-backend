# Environment Setup for Königskristall Shop Backend

## Required Environment Variables

### Database Configuration
```bash
DB_NAME=koenigskristall_shop
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=3306
DB_DIALECT=mysql
```

### JWT Configuration
```bash
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

### Stripe Configuration
```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

### PayPal Configuration
```bash
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox
```

### SendGrid Configuration (Email Service)
```bash
SENDGRID_API_KEY=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
SENDGRID_FROM_EMAIL=shop@koenigskristall.de
ADMIN_EMAIL=admin@koenigskristall.de
```

### Frontend URL
```bash
FRONTEND_URL=https://koenigskristall-shop.vercel.app
```

### VAT Configuration (for Kleinunternehmerregelung)
```bash
VAT_RATE=0.19
INCLUDE_VAT=false
```

### Server Configuration
```bash
PORT=3000
NODE_ENV=development
```

## Email Service Features

The email service will automatically send:

1. **Payment Confirmation Emails** to customers when:
   - Stripe payment succeeds (via webhook)
   - PayPal payment is captured successfully

2. **Admin Notification Emails** to administrators when:
   - New orders are placed and payments are confirmed

## Email Templates

The system includes professionally designed HTML email templates with:
- Responsive design for mobile and desktop
- Order details with product images
- Shipping information
- Payment method and transaction details
- Professional branding for Königskristall Shop

## Setup Instructions

1. Create a `.env` file in the root directory
2. Copy the environment variables above and fill in your actual values
3. Ensure your SendGrid API key is valid and has sending permissions
4. Configure the `SENDGRID_FROM_EMAIL` to match your verified sender domain
5. Set the `ADMIN_EMAIL` to receive order notifications

## Testing Email Service

To test the email service:
1. Make a test payment through Stripe or PayPal
2. Check the console logs for email sending confirmation
3. Verify emails are received by the customer and admin
4. Check SendGrid dashboard for delivery status 