// Minimal QuickBooks OAuth test to isolate the issue

const clientId = process.env.QUICKBOOKS_CLIENT_ID;
const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;

console.log('🔍 MINIMAL OAUTH TEST');
console.log('Client ID:', clientId);
console.log('Client Secret:', clientSecret);

// Test the exact same request that's failing
const testTokenExchange = async (authCode) => {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  console.log('\n🔍 Testing token exchange with minimal request...');
  console.log('Authorization header:', `Basic ${credentials.substring(0, 30)}...`);
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: authCode,
    redirect_uri: 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback'
  });
  
  try {
    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    });
    
    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
    if (response.status === 401) {
      console.log('\n🚨 INVALID CLIENT CONFIRMED');
      console.log('This suggests:');
      console.log('1. Client ID/Secret mismatch with QuickBooks app config');
      console.log('2. App not properly configured for production');
      console.log('3. Authorization code generated with different app');
    } else {
      console.log('\n✅ TOKEN EXCHANGE SUCCESSFUL');
    }
    
  } catch (error) {
    console.error('Request failed:', error);
  }
};

// Use a dummy auth code for initial test (will fail but shows request format)
console.log('\n📋 Test with dummy code (expected to fail but validates request format):');
testTokenExchange('DUMMY_CODE_FOR_FORMAT_TEST');