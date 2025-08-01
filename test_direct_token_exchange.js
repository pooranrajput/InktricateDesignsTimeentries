// Test direct token exchange with sample authorization code format
const https = require('https');

console.log('🧪 TESTING DIRECT TOKEN EXCHANGE PROCESS');
console.log('='.repeat(60));

const config = {
  clientId: 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA',
  clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || 'NOT_SET',
  redirectUri: 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback',
  tokenEndpoint: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
};

console.log('\n📋 Configuration Check:');
console.log('Client ID:', config.clientId);
console.log('Client Secret Length:', config.clientSecret.length);
console.log('Redirect URI:', config.redirectUri);
console.log('Token Endpoint:', config.tokenEndpoint);

// Generate base64 credentials
const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
console.log('\n🔑 Credentials:');
console.log('Base64:', credentials.substring(0, 30) + '...');
console.log('Length:', credentials.length);

// Test the exact request format
console.log('\n🔍 Token Exchange Request Format:');
console.log('POST', config.tokenEndpoint);
console.log('Headers:');
console.log('  Authorization: Basic', credentials.substring(0, 20) + '...');
console.log('  Content-Type: application/x-www-form-urlencoded');
console.log('  Accept: application/json');

console.log('\nBody (with sample code):');
const sampleParams = new URLSearchParams({
  grant_type: 'authorization_code',
  code: 'SAMPLE_AUTHORIZATION_CODE_HERE',
  redirect_uri: config.redirectUri
});
console.log('  ' + sampleParams.toString());

console.log('\n🎯 Expected QuickBooks Response:');
console.log('Success (200):');
console.log('  {');
console.log('    "access_token": "...",');
console.log('    "refresh_token": "...",');
console.log('    "expires_in": 3600,');
console.log('    "token_type": "bearer"');
console.log('  }');

console.log('\nError (400):');
console.log('  {');
console.log('    "error": "invalid_grant",');
console.log('    "error_description": "Incorrect Token type or clientID"');
console.log('  }');

console.log('\n🔧 Potential Issues:');
console.log('1. Authorization code expired (10 minute limit)');
console.log('2. Authorization code already used');
console.log('3. Wrong company ID selected during authorization');
console.log('4. QuickBooks app configuration mismatch');
console.log('5. Base64 encoding issue');

console.log('\n💡 Debugging Strategy:');
console.log('1. Generate fresh authorization URL');
console.log('2. Complete OAuth immediately (don\'t wait)');
console.log('3. Select correct company ID: 9130351530529746');
console.log('4. Check server logs for exact error details');