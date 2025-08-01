// Test OAuth with App ID instead of Client ID
console.log('🔍 TESTING OAUTH WITH APP ID');
console.log('='.repeat(50));

const appId = '7ccd23c7-a525-4cb8-8c30-df60652e4603';
const clientId = 'AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA';
const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';

console.log('\n📋 CREDENTIAL COMPARISON:');
console.log('App ID Format:', appId, '(UUID format)');
console.log('Client ID Format:', clientId, '(Base64-like format)');

console.log('\n🔍 DOCUMENTATION SAYS:');
console.log('- App ID and Client ID should be the same in QuickBooks');
console.log('- But you have different values for each');
console.log('- This suggests potential credential mismatch');

console.log('\n🧪 TESTING APP ID AS CLIENT ID:');
const authUrlWithAppId = `https://appcenter.intuit.com/connect/oauth2?client_id=${appId}&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=timetracking-test`;

console.log('Authorization URL with App ID:');
console.log(authUrlWithAppId);

console.log('\n🧪 TESTING ORIGINAL CLIENT ID:');
const authUrlWithClientId = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=timetracking-test`;

console.log('Authorization URL with Client ID:');
console.log(authUrlWithClientId);

console.log('\n💡 NEXT STEPS:');
console.log('1. Try OAuth with App ID (7ccd23c7-a525-4cb8-8c30-df60652e4603)');
console.log('2. Check if this resolves the OAuth error page');
console.log('3. Verify which credential QuickBooks expects for your app');
console.log('4. Update all OAuth endpoints to use correct credential');

console.log('\n🎯 HYPOTHESIS:');
console.log('The OAuth error may be caused by using wrong credential type');
console.log('App ID might be the correct value for client_id parameter');
console.log('This could explain why OAuth returns error page despite correct setup');