// Debug script to check redirect URI configuration
const https = require('https');
const { URLSearchParams } = require('url');

console.log('🔍 Debugging QuickBooks Redirect URI Configuration...');

// Check what redirect URI we're using
const currentRedirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';
console.log('🔗 Current Redirect URI:', currentRedirectUri);

// Common redirect URI patterns to test
const possibleRedirectUris = [
  'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback',
  'https://inkticate-time-tracker-pooranrajput.replit.app/callback',
  'https://inkticate-time-tracker-pooranrajput.replit.app/auth/quickbooks/callback',
  'https://inkticate-time-tracker-pooranrajput.replit.app/oauth/quickbooks/callback'
];

console.log('🔍 Possible Redirect URIs that might be configured in QuickBooks app:');
possibleRedirectUris.forEach((uri, index) => {
  console.log(`${index + 1}. ${uri}`);
});

// Test the QuickBooks app info endpoint (if available)
const clientId = process.env.QUICKBOOKS_CLIENT_ID;
console.log('\n🔧 QuickBooks App Details:');
console.log('Client ID:', clientId?.substring(0, 10) + '...');
console.log('Environment:', process.env.QUICKBOOKS_SANDBOX === 'true' ? 'Sandbox' : 'Production');

console.log('\n💡 SOLUTION:');
console.log('The QuickBooks app configuration likely has a different redirect URI than what we are using.');
console.log('You need to check the QuickBooks Developer Dashboard and ensure the redirect URI matches exactly:');
console.log('Expected:', currentRedirectUri);