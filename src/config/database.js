const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Get the database path from environment variables or use a default path
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

// Create a new Sequelize instance with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true, // Add createdAt and updatedAt timestamps to models
    underscored: false, // Use camelCase for automatically generated attributes
  }
});

// Test the database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = {
  sequelize,
  testConnection
};