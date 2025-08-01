// Debug QuickBooks OAuth error from URL
console.log('🔍 QUICKBOOKS OAUTH ERROR ANALYSIS');
console.log('='.repeat(60));

const errorUrl = 'https://appcenter.intuit.com/app/connect/oauth2/error?client_id=AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA&scope=com.intuit.quickbooks.accounting&redirect_uri=https%3A%2F%2Finkticate-time-tracker-pooranrajput.replit.app%2Fapi%2Fquickbooks%2Fcallback&response_type=code&state=timetracking-reauth&realmId=9130351530529746&locale=en-us';

console.log('\n📋 ERROR URL ANALYSIS:');
const url = new URL(errorUrl);
console.log('Error Path:', url.pathname);
console.log('Client ID:', url.searchParams.get('client_id'));
console.log('Scope:', url.searchParams.get('scope'));
console.log('Redirect URI:', decodeURIComponent(url.searchParams.get('redirect_uri')));
console.log('Response Type:', url.searchParams.get('response_type'));
console.log('State:', url.searchParams.get('state'));
console.log('Realm ID:', url.searchParams.get('realmId'));
console.log('Locale:', url.searchParams.get('locale'));

console.log('\n🚨 POSSIBLE CAUSES OF OAUTH ERROR:');
console.log('1. QuickBooks app is in Development mode and not approved for production use');
console.log('2. Redirect URI not registered in QuickBooks app configuration');
console.log('3. App has been suspended or deactivated');
console.log('4. Client ID does not match any registered QuickBooks app');
console.log('5. Scope "com.intuit.quickbooks.accounting" not enabled for the app');
console.log('6. App configuration mismatch between Development and Production');

console.log('\n💡 QUICKBOOKS APP CONFIGURATION REQUIREMENTS:');
console.log('Required Redirect URI: https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback');
console.log('Required Scope: com.intuit.quickbooks.accounting');
console.log('Required Environment: Production (not Development/Sandbox)');
console.log('Required Status: App must be approved/active in QuickBooks Developer portal');

console.log('\n🔍 IMMEDIATE DEBUGGING STEPS:');
console.log('1. Check QuickBooks Developer Dashboard app status');
console.log('2. Verify redirect URI is exactly registered in QuickBooks app');
console.log('3. Confirm app is approved for production use');
console.log('4. Check if app requires additional approval or verification');
console.log('5. Verify scope permissions are enabled for the app');

console.log('\n🎯 NEXT ACTIONS:');
console.log('1. Login to QuickBooks Developer Dashboard');
console.log('2. Navigate to your app configuration');
console.log('3. Check app status (Development vs Production)');
console.log('4. Verify redirect URI configuration');
console.log('5. Check scope permissions and app approval status');