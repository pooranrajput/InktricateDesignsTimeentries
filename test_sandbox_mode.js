// Test if the credentials work in sandbox mode instead of production
const http = require('http');

const clientId = 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA';
const clientSecret = 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26clKEnDU';
const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';

console.log('🧪 TESTING SANDBOX VS PRODUCTION MODE');
console.log('='.repeat(60));

// Test 1: Generate sandbox authorization URL
console.log('\n🏖️ Sandbox Authorization URL:');
const sandboxParams = new URLSearchParams({
    client_id: clientId,
    scope: 'com.intuit.quickbooks.accounting',
    redirect_uri: redirectUri,
    response_type: 'code',
    state: 'timetracking-sandbox-test'
});
const sandboxAuthUrl = `https://appcenter.intuit.com/connect/oauth2?${sandboxParams.toString()}`;
console.log(sandboxAuthUrl);

// Test 2: Generate production authorization URL
console.log('\n🏢 Production Authorization URL:');
const prodParams = new URLSearchParams({
    client_id: clientId,
    scope: 'com.intuit.quickbooks.accounting',
    redirect_uri: redirectUri,
    response_type: 'code',
    state: 'timetracking-production-test'
});
const prodAuthUrl = `https://appcenter.intuit.com/connect/oauth2?${prodParams.toString()}`;
console.log(prodAuthUrl);

console.log('\n🔍 Analysis:');
console.log('If credentials are for sandbox app:');
console.log('- Authorization URL will work but only with sandbox companies');
console.log('- Token exchange will fail in production mode');
console.log('- Need to set sandbox: true in configuration');

console.log('\n🎯 Next Steps:');
console.log('1. Try the sandbox URL to see if it accepts the credentials');
console.log('2. Check if your QuickBooks app is configured for Production or Development');
console.log('3. Ensure the app environment matches the credentials being used');