const { sequelize } = require('../src/config/database');

/**
 * Reset database completely (development only)
 */
const resetDatabase = async () => {
  try {
    console.log('Resetting database...');
    
    // Force sync will drop all tables and recreate them
    await sequelize.sync({ force: true });
    
    console.log('Database reset successfully');
    console.log('All tables have been dropped and recreated');
    console.log('All data has been lost');
    
  } catch (error) {
    console.error('Failed to reset database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the reset if this script is executed directly
if (require.main === module) {
  resetDatabase();
}

module.exports = resetDatabase; 