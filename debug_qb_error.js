// Debug QuickBooks login page error

const testOAuthURL = async () => {
  try {
    // Get the OAuth URL
    const response = await fetch('http://localhost:5000/api/quickbooks/auth');
    const data = await response.json();
    
    console.log('OAuth URL Response Status:', response.status);
    console.log('OAuth URL:', data.authUrl);
    
    if (data.authUrl) {
      const url = new URL(data.authUrl);
      console.log('\n=== OAUTH URL VALIDATION ===');
      console.log('Base URL:', url.origin + url.pathname);
      console.log('Client ID:', url.searchParams.get('client_id')?.substring(0, 20) + '...');
      console.log('Redirect URI:', url.searchParams.get('redirect_uri'));
      console.log('Scope:', url.searchParams.get('scope'));
      console.log('Response Type:', url.searchParams.get('response_type'));
      console.log('State:', url.searchParams.get('state'));
      console.log('Realm ID:', url.searchParams.get('realmId') || 'Not specified');
      
      // Check for common OAuth URL issues
      console.log('\n=== VALIDATION CHECKS ===');
      console.log('Client ID length correct:', url.searchParams.get('client_id')?.length === 50);
      console.log('Redirect URI HTTPS:', url.searchParams.get('redirect_uri')?.startsWith('https://'));
      console.log('Scope valid:', url.searchParams.get('scope') === 'com.intuit.quickbooks.accounting');
      console.log('Response type correct:', url.searchParams.get('response_type') === 'code');
      
      // Common QuickBooks OAuth errors
      console.log('\n=== POSSIBLE QB LOGIN ERRORS ===');
      console.log('1. Invalid Client ID - app not found');
      console.log('2. Redirect URI mismatch - not registered in QB dashboard');
      console.log('3. App disabled or suspended');
      console.log('4. Scope not allowed for app');
      console.log('5. App not approved for production');
    }
    
  } catch (error) {
    console.error('OAuth URL test failed:', error.message);
  }
};

testOAuthURL();