// Test QuickBooks OAuth with direct production URL construction

const testDirectProductionOAuth = async () => {
  console.log('🔄 TESTING DIRECT PRODUCTION OAUTH...');
  
  // Force production environment variables
  process.env.QUICKBOOKS_SANDBOX = 'false';
  delete process.env.INTUIT_SANDBOX;
  delete process.env.QB_SANDBOX;
  
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';
  
  // Direct production OAuth URL - completely bypass any libraries
  const directProductionURL = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=direct-production-test`;
  
  console.log('Direct Production OAuth URL:');
  console.log(directProductionURL);
  
  // Test our application's OAuth endpoint
  try {
    const response = await fetch('http://localhost:5000/api/quickbooks/auth');
    const data = await response.json();
    
    console.log('\nOur App OAuth URL:');
    console.log(data.authUrl);
    
    // Compare URLs to see if they match
    const ourURL = new URL(data.authUrl);
    const directURL = new URL(directProductionURL);
    
    console.log('\n=== URL COMPARISON ===');
    console.log('Direct URL base:', directURL.origin + directURL.pathname);
    console.log('App URL base:', ourURL.origin + ourURL.pathname);
    console.log('URLs match:', (directURL.origin + directURL.pathname) === (ourURL.origin + ourURL.pathname));
    
    console.log('\n=== PARAMETERS COMPARISON ===');
    const directParams = Object.fromEntries(directURL.searchParams);
    const appParams = Object.fromEntries(ourURL.searchParams);
    
    console.log('Client ID match:', directParams.client_id === appParams.client_id);
    console.log('Redirect URI match:', directParams.redirect_uri === appParams.redirect_uri);
    console.log('Scope match:', directParams.scope === appParams.scope);
    
    if (directParams.client_id === appParams.client_id && 
        directParams.redirect_uri === appParams.redirect_uri &&
        directParams.scope === appParams.scope) {
      console.log('\n✅ OAUTH URLS ARE IDENTICAL - PRODUCTION CONFIRMED');
      console.log('The issue is not with our URL generation.');
      console.log('The "sandbox companies" error suggests:');
      console.log('1. QuickBooks user account has no production companies');
      console.log('2. App is still configured as sandbox in QB dashboard');
      console.log('3. Browser has cached sandbox authorization');
    } else {
      console.log('\n❌ OAUTH URLS DIFFER - NEED TO INVESTIGATE');
    }
    
  } catch (error) {
    console.log('Error testing OAuth:', error.message);
  }
};

testDirectProductionOAuth();