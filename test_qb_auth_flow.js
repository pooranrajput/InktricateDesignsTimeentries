// Test QuickBooks authentication flow to understand what's happening
import { config } from 'dotenv';

config({ path: '.env.production' });

console.log('🔍 Testing QuickBooks Authentication Flow...');

// Check current configuration
const clientId = process.env.QUICKBOOKS_CLIENT_ID;
const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;

console.log('\n📋 Current Configuration:');
console.log('Client ID:', clientId?.substring(0, 15) + '...');
console.log('Redirect URI:', redirectUri);

// Generate test authorization URL
const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
authUrl.searchParams.set('client_id', clientId);
authUrl.searchParams.set('scope', 'com.intuit.quickbooks.accounting');
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('state', 'debug-test');

console.log('\n🔗 Authorization URL:');
console.log(authUrl.toString());

console.log('\n🤔 Possible Reasons for No Company Selection:');
console.log('1. Your QuickBooks account only has access to one company');
console.log('2. The authorization flow goes directly to that company');
console.log('3. The company might be sandbox even though you expect production');
console.log('4. QuickBooks app might not be properly configured for multiple companies');

console.log('\n💡 What should happen when you click the URL:');
console.log('1. QuickBooks login page loads');
console.log('2. You sign in with your credentials');
console.log('3. QuickBooks shows permissions screen');
console.log('4. After granting permissions, it redirects to our callback');
console.log('5. Our system processes the response and completes authentication');

console.log('\n🎯 Next steps:');
console.log('- Check what happens when you click the authorization URL');
console.log('- Look at the QuickBooks page that loads');
console.log('- Note any error messages or unexpected behavior');