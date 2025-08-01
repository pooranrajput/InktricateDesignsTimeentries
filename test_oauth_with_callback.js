// Test complete OAuth flow automatically

const testCompleteOAuth = async () => {
  console.log('🔄 TESTING COMPLETE OAUTH FLOW AUTOMATICALLY...');
  
  try {
    // Step 1: Get OAuth URL
    const authResponse = await fetch('http://localhost:5000/api/quickbooks/auth');
    const authData = await authResponse.json();
    
    console.log('✅ OAuth URL Generated:', authData.authUrl ? 'SUCCESS' : 'FAILED');
    
    if (authData.authUrl) {
      const url = new URL(authData.authUrl);
      console.log('- Environment:', url.origin === 'https://appcenter.intuit.com' ? 'PRODUCTION' : 'SANDBOX');
      
      // Test with a mock authorization code to see the callback behavior
      console.log('\n🔄 TESTING CALLBACK WITH PRODUCTION COMPANY ID...');
      
      // Simulate what QuickBooks would send back for production
      const mockProductionCallback = 'http://localhost:5000/api/quickbooks/callback?code=MOCK_PROD_CODE&state=test&realmId=9130351530529746';
      
      try {
        const callbackResponse = await fetch(mockProductionCallback);
        console.log('Callback Response Status:', callbackResponse.status);
        
        if (callbackResponse.status === 302) {
          const location = callbackResponse.headers.get('location');
          console.log('Redirect Location:', location);
          
          if (location?.includes('quickbooks=success')) {
            console.log('✅ PRODUCTION OAUTH FLOW WORKING');
          } else if (location?.includes('quickbooks=error')) {
            console.log('❌ OAuth error detected in redirect');
          }
        }
      } catch (callbackError) {
        console.log('Callback test error:', callbackError.message);
      }
    }
    
  } catch (error) {
    console.log('❌ OAuth flow test failed:', error.message);
  }
};

testCompleteOAuth();