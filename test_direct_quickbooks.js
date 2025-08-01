// Direct test of QuickBooks service bypassing Vite
const { QuickBooksService } = require('./server/quickbooks');

async function testQuickBooksDirectly() {
  console.log('🔧 Testing QuickBooks service directly (bypassing Vite)...');
  
  try {
    const qbService = new QuickBooksService();
    console.log('✅ QuickBooks service instantiated');
    
    const result = await qbService.testConnection();
    console.log('🔍 Direct test result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ QUICKBOOKS CONNECTION WORKING DIRECTLY!');
      console.log('📋 Company Info:', result.companyInfo);
    } else {
      console.log('❌ QuickBooks connection failed:', result.error);
    }
    
  } catch (error) {
    console.error('🚨 Direct test error:', error.message);
    console.error(error.stack);
  }
}

testQuickBooksDirectly();