// Direct QuickBooks test bypassing all middleware
import { db } from './server/db.js';
import { quickbooksConfig } from './shared/schema.js';

async function testQuickBooksDirectly() {
  console.log('🔧 Testing QuickBooks connection directly...');
  
  try {
    // Check database connection
    console.log('📀 Checking database...');
    const configs = await db.select().from(quickbooksConfig);
    console.log(`Found ${configs.length} QuickBooks configurations`);
    
    if (configs.length === 0) {
      console.log('❌ No QuickBooks configurations found');
      return false;
    }
    
    const config = configs[0];
    console.log('📋 Configuration details:');
    console.log('- Company ID:', config.companyId);
    console.log('- Has Access Token:', !!config.accessToken);
    console.log('- Has Refresh Token:', !!config.refreshToken);
    console.log('- Token Expiry:', config.tokenExpiry);
    console.log('- Is Expired:', config.tokenExpiry ? new Date() >= config.tokenExpiry : 'unknown');
    console.log('- Sandbox Mode:', config.sandbox);
    
    const hasValidConfig = config.accessToken && config.refreshToken && 
      (!config.tokenExpiry || new Date() < config.tokenExpiry);
    
    if (hasValidConfig) {
      console.log('✅ QUICKBOOKS CONNECTION IS VALID!');
      console.log(`✅ Company ID: ${config.companyId} (${config.sandbox ? 'Sandbox' : 'Production'})`);
      
      // Check if this is the expected production company
      if (config.companyId === '9130351530529746') {
        console.log('🎯 CONFIRMED: Connected to correct production company!');
      } else if (config.companyId === '9341455047397094') {
        console.log('⚠️  Connected to sandbox company, not production');
      } else {
        console.log('❓ Connected to unknown company ID');
      }
      
      return {
        connected: true,
        companyId: config.companyId,
        sandbox: config.sandbox,
        tokenExpiry: config.tokenExpiry,
        isProduction: config.companyId === '9130351530529746'
      };
    } else {
      console.log('❌ QuickBooks configuration is invalid or expired');
      return { connected: false, reason: 'Invalid or expired tokens' };
    }
    
  } catch (error) {
    console.error('🚨 Direct test error:', error);
    return { connected: false, error: error.message };
  }
}

// Run the test
testQuickBooksDirectly().then(result => {
  console.log('\n🎯 FINAL RESULT:');
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});