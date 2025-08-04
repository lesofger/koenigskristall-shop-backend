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
4000 0025 0000 3155
DE89370400440532013000 // SEPA
"DE89370400440532013000", // Commerzbank (sofort)
"DE89370400440532013001", // Deutsche Bank
"DE89370400440532013002", // Sparkasse
"DE89370400440532013003", // Volksbank
"DE89370400440532013004"  // Postbank

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


## License

ISC