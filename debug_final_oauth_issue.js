// Final comprehensive OAuth diagnostic
console.log('🔍 FINAL OAUTH DIAGNOSTIC - ALL CREDENTIAL CHECKS');
console.log('='.repeat(70));

// Test all current configurations
const productionConfig = {
  clientId: 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA',
  clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || 'NOT_SET',
  redirectUri: 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback',
  productionCompanyId: '9130351530529746',
  sandboxCompanyId: '9341455047397094'
};

console.log('\n📋 CURRENT PRODUCTION CONFIGURATION:');
console.log('Client ID:', productionConfig.clientId);
console.log('Client Secret Set:', !!productionConfig.clientSecret && productionConfig.clientSecret !== 'NOT_SET');
console.log('Client Secret Length:', productionConfig.clientSecret?.length || 0);
console.log('Redirect URI:', productionConfig.redirectUri);
console.log('Production Company:', productionConfig.productionCompanyId);
console.log('Sandbox Company:', productionConfig.sandboxCompanyId);

console.log('\n🔑 CREDENTIAL VERIFICATION:');
const credentials = Buffer.from(`${productionConfig.clientId}:${productionConfig.clientSecret}`).toString('base64');
console.log('Base64 Encoded:', credentials.substring(0, 50) + '...');
console.log('Encoding Length:', credentials.length);

console.log('\n🔗 AUTHORIZATION URL TEST:');
const authParams = new URLSearchParams({
  client_id: productionConfig.clientId,
  scope: 'com.intuit.quickbooks.accounting', 
  redirect_uri: productionConfig.redirectUri,
  response_type: 'code',
  state: 'final-diagnostic-test'
});
const authUrl = `https://appcenter.intuit.com/connect/oauth2?${authParams.toString()}`;
console.log('Auth URL:', authUrl);

console.log('\n🎯 TOKEN EXCHANGE TEST SETUP:');
console.log('Token Endpoint: https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer');
console.log('Method: POST');
console.log('Authorization: Basic', credentials.substring(0, 20) + '...');
console.log('Content-Type: application/x-www-form-urlencoded');

console.log('\n🔍 LIKELY REMAINING ISSUES:');
console.log('1. Client Secret mismatch (Replit secret vs QuickBooks app)');
console.log('2. Authorization for wrong company ID');
console.log('3. QuickBooks app configuration issue');
console.log('4. Token request format or headers');

console.log('\n💡 NEXT STEPS:');
console.log('1. Verify Client Secret in Replit matches QuickBooks app exactly');
console.log('2. Use fresh authorization and complete immediately');
console.log('3. Ensure selecting company ID:', productionConfig.productionCompanyId);
console.log('4. Check QuickBooks app status and permissions');