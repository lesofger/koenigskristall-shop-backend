const { Product } = require('../src/models');
const { sequelize } = require('../src/config/database');
const shopData = require('../shopDataNew.js').default;

/**
 * Import products from shopDataNew.js to database
 * @param {Object} options - Import options
 * @param {boolean} options.clearExisting - Whether to clear existing products
 * @param {boolean} options.force - Whether to force sync database
 */
const importProducts = async (options = {}) => {
  const { clearExisting = true, force = false } = options;
  
  try {
    console.log('Starting product import...');
    
    // Sync database to ensure tables exist
    await sequelize.sync({ force });
    console.log('Database synced successfully');
    
    if (clearExisting) {
      // Clear existing products
      const deletedCount = await Product.destroy({ where: {} });
      console.log(` Cleared ${deletedCount} existing products`);
    }
    
    // Import products
    const productsToImport = shopData.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      imageUrl: product.image,
      quantity: product.quantity
    }));
    
    console.log(`Preparing to import ${productsToImport.length} products...`);
    
    // Bulk create products
    const createdProducts = await Product.bulkCreate(productsToImport, {
      ignoreDuplicates: true,
      updateOnDuplicate: ['name', 'description', 'price', 'category', 'imageUrl', 'quantity']
    });
    
    console.log(`Successfully imported ${createdProducts.length} products`);
    
    // Log statistics
    const categories = [...new Set(shopData.map(p => p.category))];
    console.log(`Categories imported: ${categories.length}`);
    console.log(` ${categories.join(', ')}`);
    
    const totalValue = shopData.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    console.log(`Total inventory value: €${totalValue.toFixed(2)}`);
    
    const avgPrice = shopData.reduce((sum, product) => sum + product.price, 0) / shopData.length;
    console.log(`Average product price: €${avgPrice.toFixed(2)}`);
    
    console.log('Product import completed successfully!');
    
    return {
      imported: createdProducts.length,
      categories: categories.length,
      totalValue,
      avgPrice
    };
    
  } catch (error) {
    console.error('❌ Error importing products:', error.message);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`   - ${err.message}`);
      });
    }
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
};

/**
 * Update existing products without clearing
 */
const updateProducts = async () => {
  console.log('Updating existing products...');
  return importProducts({ clearExisting: false });
};

/**
 * Force sync database and import products
 */
const resetAndImport = async () => {
  console.log('Resetting database and importing products...');
  return importProducts({ clearExisting: true, force: true });
};

// Run the import if this script is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'update':
      updateProducts().catch(() => process.exit(1));
      break;
    case 'reset':
      resetAndImport().catch(() => process.exit(1));
      break;
    default:
      importProducts().catch(() => process.exit(1));
  }
}

module.exports = { importProducts, updateProducts, resetAndImport }; 