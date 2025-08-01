// Debug production vs development OAuth differences

console.log('🔍 PRODUCTION VS DEVELOPMENT OAUTH ANALYSIS');

// Check current production environment
console.log('\n=== CURRENT PRODUCTION ENVIRONMENT ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REPLIT_DOMAINS:', process.env.REPLIT_DOMAINS);
console.log('CLIENT_ID:', process.env.QUICKBOOKS_CLIENT_ID);
console.log('CLIENT_SECRET:', process.env.QUICKBOOKS_CLIENT_SECRET ? 'Present' : 'Missing');
console.log('SANDBOX:', process.env.QUICKBOOKS_SANDBOX);

// Test actual authorization URL generation
const clientId = process.env.QUICKBOOKS_CLIENT_ID;
const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';
const baseUrl = 'https://appcenter.intuit.com/connect/oauth2';

const params = new URLSearchParams({
  client_id: clientId,
  scope: 'com.intuit.quickbooks.accounting',
  redirect_uri: redirectUri,
  response_type: 'code',
  state: 'production-debug-test',
  realmId: '9130351530529746'
});

const authUrl = `${baseUrl}?${params.toString()}`;

console.log('\n=== AUTHORIZATION URL ANALYSIS ===');
console.log('Generated URL:', authUrl);
console.log('Client ID in URL:', params.get('client_id'));
console.log('Redirect URI in URL:', params.get('redirect_uri'));
console.log('Scope in URL:', params.get('scope'));
console.log('State in URL:', params.get('state'));

// Test if URL encoding is correct
console.log('\n=== URL ENCODING CHECK ===');
console.log('Raw redirect URI:', redirectUri);
console.log('Encoded redirect URI:', encodeURIComponent(redirectUri));
console.log('URL uses encoded:', authUrl.includes(encodeURIComponent(redirectUri)));

// Check for any environment override issues
console.log('\n=== ENVIRONMENT OVERRIDES CHECK ===');
console.log('All QUICKBOOKS env vars:');
Object.keys(process.env)
  .filter(key => key.startsWith('QUICKBOOKS'))
  .forEach(key => {
    console.log(`${key}:`, process.env[key]);
  });

// Test credentials format
console.log('\n=== CREDENTIAL FORMAT CHECK ===');
const credentials = Buffer.from(`${clientId}:${process.env.QUICKBOOKS_CLIENT_SECRET}`).toString('base64');
console.log('Base64 credentials length:', credentials.length);
console.log('Base64 credentials start:', credentials.substring(0, 30));

// Test with a real authorization code from logs if available
const testTokenExchange = async (code) => {
  try {
    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });
    
    const result = await response.text();
    console.log('\n=== TOKEN EXCHANGE TEST ===');
    console.log('Status:', response.status);
    console.log('Response:', result);
    
  } catch (error) {
    console.log('Token exchange error:', error.message);
  }
};

console.log('\n=== PRODUCTION READINESS CHECK ===');
console.log('All required vars present:', !!(clientId && process.env.QUICKBOOKS_CLIENT_SECRET));
console.log('URL properly formatted:', authUrl.startsWith('https://'));
console.log('Client ID length correct:', clientId?.length === 50);
console.log('Redirect URI HTTPS:', redirectUri.startsWith('https://'));