// Debug why QuickBooks keeps returning sandbox company ID

console.log('🔍 DEBUGGING SANDBOX CONNECTION ISSUE');

// The problem: Authorization codes come with sandbox company ID 9341455047397094
// Expected: Production company ID 9130351530529746

console.log('\n=== AUTHORIZATION CODE ANALYSIS ===');
console.log('Received Company ID: 9341455047397094 (Sandbox)');
console.log('Expected Company ID: 9130351530529746 (Production)');
console.log('Issue: QuickBooks is defaulting to sandbox connection');

console.log('\n=== POSSIBLE CAUSES ===');
console.log('1. Active sandbox app connection in QuickBooks dashboard');
console.log('2. Browser cached sandbox authorization');
console.log('3. QuickBooks user account has active sandbox app');
console.log('4. App is configured as sandbox in QB dashboard');

console.log('\n=== IMMEDIATE SOLUTION OPTIONS ===');
console.log('Option 1: Disconnect sandbox app in QuickBooks "Manage Apps" section');
console.log('Option 2: Clear browser cache/cookies for QuickBooks');
console.log('Option 3: Use different browser/incognito for OAuth');
console.log('Option 4: Check if app is set to Production in QB dashboard');

console.log('\n=== CHECKING CURRENT OAUTH URL ===');
const clientId = process.env.QUICKBOOKS_CLIENT_ID;
const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';

const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=debug-test&realmId=9130351530529746`;

console.log('Generated OAuth URL:', authUrl);
console.log('Target Company ID in URL:', '9130351530529746');
console.log('Client ID in URL:', clientId);

console.log('\n=== DIAGNOSIS ===');
console.log('The OAuth flow generates correct URL with production company ID');
console.log('But QuickBooks returns sandbox company ID in callback');
console.log('This indicates an existing sandbox connection overriding the request');

console.log('\n=== NEXT STEPS ===');
console.log('1. Check QuickBooks account "Manage Apps" section');
console.log('2. Disconnect any existing sandbox connections');
console.log('3. Try OAuth in incognito/private browser');
console.log('4. Verify app is in Production mode in QB dashboard');