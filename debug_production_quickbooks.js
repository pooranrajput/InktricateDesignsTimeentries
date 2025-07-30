// Debug production QuickBooks connection with exact company ID verification
const https = require('https');

const PRODUCTION_CREDENTIALS = {
  clientId: 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA',
  clientSecret: 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26clKEnDU',
  companyId: '9341455047397094'
};

console.log('🏢 PRODUCTION QUICKBOOKS DIAGNOSTIC');
console.log('='.repeat(60));

console.log('\n📋 Production Configuration:');
console.log('Environment: PRODUCTION (approved app)');
console.log('Client ID:', PRODUCTION_CREDENTIALS.clientId);
console.log('Company ID:', PRODUCTION_CREDENTIALS.companyId);
console.log('Expected: Real QuickBooks Online business account');

// Test production authorization URL
console.log('\n🔗 Production Authorization URL:');
const authParams = new URLSearchParams({
  client_id: PRODUCTION_CREDENTIALS.clientId,
  scope: 'com.intuit.quickbooks.accounting',
  redirect_uri: 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback',
  response_type: 'code',
  state: 'production-test'
});

const authUrl = `https://appcenter.intuit.com/connect/oauth2?${authParams.toString()}`;
console.log(authUrl);

// Verify base64 encoding for production
console.log('\n🔑 Production Credentials Encoding:');
const credentials = Buffer.from(`${PRODUCTION_CREDENTIALS.clientId}:${PRODUCTION_CREDENTIALS.clientSecret}`).toString('base64');
console.log('Base64 Credentials:', credentials.substring(0, 50) + '...');

// Test company ID format
console.log('\n🏢 Company ID Analysis:');
console.log('Company ID:', PRODUCTION_CREDENTIALS.companyId);
console.log('Length:', PRODUCTION_CREDENTIALS.companyId.length);
console.log('Type:', typeof PRODUCTION_CREDENTIALS.companyId);
console.log('Is Numeric:', /^\d+$/.test(PRODUCTION_CREDENTIALS.companyId));

console.log('\n🎯 Expected Flow for Production:');
console.log('1. User clicks authorization URL above');
console.log('2. Logs into REAL QuickBooks Online business account');
console.log('3. Authorizes app for company ID:', PRODUCTION_CREDENTIALS.companyId);
console.log('4. Gets redirected with authorization code');
console.log('5. Token exchange should succeed with production credentials');

console.log('\n🔍 Potential Issues:');
console.log('- Company ID mismatch: Auth for different company than expected');
console.log('- Token expiry: Authorization code used after expiration (10 minutes)');
console.log('- Multiple auth attempts: Previous codes invalidate new ones');

console.log('\n💡 Production Test Recommendation:');
console.log('Generate fresh authorization code and complete OAuth flow immediately');
console.log('Ensure QuickBooks company matches expected ID:', PRODUCTION_CREDENTIALS.companyId);