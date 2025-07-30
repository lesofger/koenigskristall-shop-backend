# Koenigskristall Shop Backend

A RESTful API backend for an e-commerce application built with Express.js and SQLite.

## Features

- User authentication with JWT tokens (including refresh tokens)
- Product management
- Shopping cart functionality
- Payment processing with Stripe
- Order management
- Admin dashboard for inventory and order management

## Tech Stack

- Node.js
- Express.js
- SQLite (with Sequelize ORM)
- JWT for authentication
- Stripe for payment processing

## Getting Started

- stripe login
- stripe listen --forward-to localhost:3000/api/payments/webhook
- stripe trigger payment_intent.succeeded: Trigger events with the CLI

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lesofger/koenigskristall-shop-backend.git
cd koenigskristall-shop-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
DB_PATH=./database.sqlite
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

4. Start the server:
```bash
npm run dev
```

## API Documentation

### Authentication

#### Register a new user
```
POST /api/auth/register
```
Request body:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```
POST /api/auth/login
```
Request body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Refresh token
```
POST /api/auth/refresh-token
```
Request body:
```json
{
  "refreshToken": "your_refresh_token"
}
```

#### Logout
```
POST /api/auth/logout
```

### Products

#### Get all products
```
GET /api/products
```
Query parameters:
- `category`: Filter by category
- `search`: Search by name or description
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

#### Get product by ID
```
GET /api/products/:id
```

#### Get products by category
```
GET /api/products/category/:category
```
Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Cart

#### Get user's cart
```
GET /api/cart
```

#### Add item to cart
```
POST /api/cart/items
```
Request body:
```json
{
  "productId": 1,
  "quantity": 2
}
```

#### Update cart item quantity
```
PUT /api/cart/items/:id
```
Request body:
```json
{
  "quantity": 3
}
```

#### Remove item from cart
```
DELETE /api/cart/items/:id
```

#### Clear cart
```
DELETE /api/cart/clear
```

### Payments

#### Create payment intent
```
POST /api/payments/create-payment-intent
```

#### Stripe webhook
```
POST /api/payments/webhook
```

### Orders

#### Create order
```
POST /api/orders
```
Request body:
```json
{
  "paymentIntentId": "pi_123456789",
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

#### Get user's orders
```
GET /api/orders
```
Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

#### Get order by ID
```
GET /api/orders/:id
```

### Admin

#### Get all orders
```
GET /api/admin/orders
```
Query parameters:
- `status`: Filter by status
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

#### Update order status
```
PUT /api/admin/orders/:id/status
```
Request body:
```json
{
  "status": "processing"
}
```

#### Get all products with inventory details
```
GET /api/admin/products
```
Query parameters:
- `category`: Filter by category
- `search`: Search by name or description
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

#### Update product quantity
```
PUT /api/admin/products/:id/quantity
```
Request body:
```json
{
  "quantity": 100
}
```

## License

ISC