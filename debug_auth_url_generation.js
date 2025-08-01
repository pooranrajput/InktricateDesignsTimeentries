// Debug why QuickBooks still returns sandbox after deletion

console.log('🔍 ANALYZING WHY SANDBOX PERSISTS AFTER DELETION');

// Check if the authorization URL is actually requesting the right company
const clientId = process.env.QUICKBOOKS_CLIENT_ID;
const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';

// Test different URL formations
console.log('\n=== TESTING DIFFERENT OAUTH URL STRATEGIES ===');

// Strategy 1: Current approach (with realmId)
const url1 = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=test1&realmId=9130351530529746`;

// Strategy 2: Without realmId (let QuickBooks choose)
const url2 = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=test2`;

// Strategy 3: Force company selection
const url3 = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=test3&realmId=9130351530529746&forceConnect=true`;

console.log('Strategy 1 (with realmId):', url1);
console.log('\nStrategy 2 (no realmId):', url2);
console.log('\nStrategy 3 (force connect):', url3);

console.log('\n=== POSSIBLE ISSUES ===');
console.log('1. Browser cache still has sandbox authorization');
console.log('2. QuickBooks account has multiple companies');
console.log('3. App is still configured as sandbox in QB dashboard');
console.log('4. Authorization code was generated before sandbox deletion');
console.log('5. Need to clear browser cookies completely');

console.log('\n=== NEXT DEBUGGING STEPS ===');
console.log('1. Try authorization in completely different browser');
console.log('2. Check if QB app is in Production mode in developer dashboard');
console.log('3. Try without realmId parameter to force company selection');
console.log('4. Verify the app Client ID matches QB dashboard exactly');

// Check environment variables for any sandbox references
console.log('\n=== ENVIRONMENT CHECK ===');
console.log('QUICKBOOKS_SANDBOX:', process.env.QUICKBOOKS_SANDBOX);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Client ID length:', clientId?.length);
console.log('Redirect URI source:', process.env.QUICKBOOKS_REDIRECT_URI || 'hardcoded');

console.log('\n=== RECOMMENDATION ===');
console.log('Try Strategy 2 (without realmId) to force company selection dialog');