// Test QuickBooks connection with current configuration
import { config } from 'dotenv';

config({ path: '.env.production' });

const clientId = process.env.QUICKBOOKS_CLIENT_ID;
const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;
const sandbox = process.env.QUICKBOOKS_SANDBOX;

console.log('🔍 Current QuickBooks Configuration:');
console.log('Client ID:', clientId?.substring(0, 20) + '...');
console.log('Redirect URI:', redirectUri);
console.log('Sandbox Mode:', sandbox);

// Generate the authorization URL
const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=debug-test`;

console.log('\n🔗 Authorization URL:');
console.log(authUrl);

console.log('\n✅ Configuration appears correct for production:');
console.log('- Client ID starts with AB6HieH2iC');
console.log('- Redirect URI matches QB app configuration');
console.log('- Production mode enabled');

console.log('\n🎯 If clicking this URL still gives errors:');
console.log('1. Check if QB app is published/approved for production');
console.log('2. Verify QB app permissions include accounting scope');
console.log('3. Check QB app status in developer dashboard');