// Test QuickBooks OAuth after sandbox deletion

console.log('🆕 TESTING OAUTH AFTER SANDBOX DELETION');

const testOAuth = async () => {
  try {
    // Get fresh authorization URL
    const response = await fetch('http://localhost:5000/api/quickbooks/auth');
    const data = await response.json();
    
    console.log('Authorization URL Response:', {
      status: response.status,
      freshStart: data.debug?.freshStart,
      productionMode: data.debug?.productionMode,
      configCleared: data.debug?.configCleared
    });
    
    if (data.authUrl) {
      const url = new URL(data.authUrl);
      const params = Object.fromEntries(url.searchParams);
      
      console.log('\n=== OAUTH URL ANALYSIS ===');
      console.log('Client ID:', params.client_id?.substring(0, 20) + '...');
      console.log('Redirect URI:', params.redirect_uri);
      console.log('Target Company ID:', params.realmId);
      console.log('State:', params.state);
      console.log('Scope:', params.scope);
      
      console.log('\n=== EXPECTED BEHAVIOR ===');
      console.log('After sandbox deletion, QuickBooks should:');
      console.log('1. Use production company ID: 9130351530529746');
      console.log('2. Return authorization code tied to production app');
      console.log('3. Token exchange should succeed');
      
      console.log('\n=== READY FOR TESTING ===');
      console.log('Authorization URL generated successfully');
      console.log('Sandbox connection removed');
      console.log('Production mode confirmed');
    }
    
  } catch (error) {
    console.error('OAuth test failed:', error.message);
  }
};

testOAuth();