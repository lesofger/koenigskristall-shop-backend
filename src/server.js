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
    // In development, use safe sync to avoid constraint violations
    // In production, use { alter: true } or no options to preserve data
    const syncOptions = process.env.NODE_ENV === 'development' 
      ? { force: false, alter: false } 
      : {};
    
    await sequelize.sync(syncOptions);
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Failed to sync database:', error);
    
    // If sync fails, try to force sync in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Attempting to force sync database...');
      try {
        await sequelize.sync({ force: true });
        console.log('Database force synchronized successfully');
      } catch (forceError) {
        console.error('Failed to force sync database:', forceError);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
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