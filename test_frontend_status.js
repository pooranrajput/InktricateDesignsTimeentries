// Direct test to see if the frontend can access the status endpoint
import { quickbooksService } from './server/quickbooks.ts';
import { db } from './server/db.ts';
import { quickbooksConfig } from './shared/schema.ts';

async function testFrontendAccess() {
  console.log('🔍 TESTING FRONTEND STATUS ACCESS');
  console.log('=================================');
  
  try {
    // Check database directly (like the bypass endpoint does)
    console.log('📊 Checking QuickBooks config in database...');
    const configs = await db.select().from(quickbooksConfig);
    
    if (configs.length === 0) {
      console.log('❌ No QuickBooks configuration found');
      return { connected: false, message: 'No configuration found' };
    }
    
    const config = configs[0];
    console.log('📋 Config found:', {
      companyId: config.companyId,
      hasAccessToken: !!config.accessToken,
      hasRefreshToken: !!config.refreshToken,
      tokenExpiry: config.tokenExpiry,
      sandbox: config.sandbox
    });
    
    const hasValidConfig = config.accessToken && config.refreshToken && 
      (!config.tokenExpiry || new Date() < config.tokenExpiry);
    
    if (hasValidConfig) {
      console.log('✅ QB Status: Connected to company', config.companyId);
      const status = {
        connected: true,
        companyId: config.companyId,
        sandbox: config.sandbox,
        tokenExpiry: config.tokenExpiry,
        isProduction: config.companyId === '9130351530529746',
        message: 'QuickBooks connection active'
      };
      
      console.log('🎯 Frontend should show:', status);
      return status;
    } else {
      console.log('❌ QB Status: Invalid or expired configuration');
      return { 
        connected: false, 
        companyId: config.companyId,
        reason: 'Invalid or expired tokens',
        tokenExpiry: config.tokenExpiry
      };
    }
    
  } catch (error) {
    console.error('❌ Error checking status:', error?.message || error);
    return {
      connected: false,
      error: error?.message || 'Unknown error'
    };
  }
}

// Test the connection status check
testFrontendAccess()
  .then((result) => {
    console.log('\n🎯 RESULT FOR FRONTEND:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.connected) {
      console.log('\n✅ Status shows CONNECTED - frontend should display green status');
    } else {
      console.log('\n❌ Status shows NOT CONNECTED - frontend will show red/disconnected');
    }
  })
  .catch((error) => {
    console.error('Test failed:', error);
  });