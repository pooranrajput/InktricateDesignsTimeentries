// Test QuickBooks token exchange with corrected credentials
import fetch from 'node-fetch';

const CLIENT_ID = 'AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA';
const CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET || 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26cIKEnDU';
const REDIRECT_URI = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';

console.log('🔍 TESTING TOKEN EXCHANGE CONFIGURATION');
console.log('='.repeat(60));

console.log('\n📋 CREDENTIALS CHECK:');
console.log('Client ID:', CLIENT_ID);
console.log('Client Secret (first 10 chars):', CLIENT_SECRET.substring(0, 10) + '...');
console.log('Redirect URI:', REDIRECT_URI);

console.log('\n🔗 TOKEN EXCHANGE ENDPOINT TEST:');
const tokenEndpoint = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

console.log('Token Endpoint:', tokenEndpoint);
console.log('Credentials (base64 length):', credentials.length);

// Test with a fake authorization code to see what error we get
const testAuthCode = 'TEST_CODE_123';
const params = new URLSearchParams({
  grant_type: 'authorization_code',
  code: testAuthCode,
  redirect_uri: REDIRECT_URI
});

console.log('\n🧪 TEST REQUEST DETAILS:');
console.log('Grant Type:', 'authorization_code');
console.log('Test Code:', testAuthCode);
console.log('Redirect URI Match:', REDIRECT_URI);

console.log('\n💡 NEXT STEPS:');
console.log('1. Monitor /api/quickbooks/callback for actual auth code from QuickBooks');
console.log('2. Check if authorization code is being received correctly');
console.log('3. Verify token exchange request format matches QuickBooks API spec');
console.log('4. Test with real authorization code from fresh OAuth attempt');

console.log('\n🔍 AUTHORIZATION URL FOR TESTING:');
const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
authUrl.searchParams.append('client_id', CLIENT_ID);
authUrl.searchParams.append('scope', 'com.intuit.quickbooks.accounting');
authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
authUrl.searchParams.append('response_type', 'code');
authUrl.searchParams.append('state', 'timetracking-test');
authUrl.searchParams.append('realmId', '9130351530529746');

console.log(authUrl.toString());