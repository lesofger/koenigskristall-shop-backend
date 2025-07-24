const app = require('./app');
const { sequelize, testConnection } = require('./config/database');
require('dotenv').config();

// Get port from environment variables or use default
const PORT = process.env.PORT || 3000;

// Sync database models
const syncDatabase = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync all models with the database
    // In development, you might want to use { force: true } to drop tables and recreate them
    // In production, use { alter: true } or no options to preserve data
    const syncOptions = process.env.NODE_ENV === 'development' 
      ? { alter: true } 
      : {};
    
    await sequelize.sync(syncOptions);
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Failed to sync database:', error);
    process.exit(1);
  }
};

// Start the server
const startServer = async () => {
  try {
    // Sync database before starting the server
    await syncDatabase();
    
    // Start listening for requests
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Start the server
startServer();