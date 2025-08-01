// Debug QuickBooks OAuth configuration
import fetch from 'node-fetch';

// Test the OAuth URL construction
const clientId = 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA';
const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';
const scope = 'com.intuit.quickbooks.accounting';
const state = 'test-connection';

// Construct the OAuth URL properly
const oauthUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
oauthUrl.searchParams.set('client_id', clientId);
oauthUrl.searchParams.set('scope', scope);
oauthUrl.searchParams.set('redirect_uri', redirectUri);
oauthUrl.searchParams.set('response_type', 'code');
oauthUrl.searchParams.set('state', state);

console.log('Constructed OAuth URL:');
console.log(oauthUrl.toString());
console.log('\nURL Parameters:');
console.log('- client_id:', clientId);
console.log('- redirect_uri:', redirectUri);
console.log('- scope:', scope);
console.log('- response_type: code');
console.log('- state:', state);

// Test if redirect URI is accessible
console.log('\nTesting redirect URI accessibility...');
fetch(redirectUri + '?test=true')
  .then(response => {
    console.log('Redirect URI test status:', response.status);
    return response.text();
  })
  .then(text => {
    console.log('Redirect URI responds with:', text.substring(0, 100) + '...');
  })
  .catch(error => {
    console.log('Redirect URI test failed:', error.message);
  });