// Debug the OAuth state parameter issue
console.log('🔍 OAUTH STATE PARAMETER DEBUGGING');
console.log('='.repeat(50));

// The URL from your error message
const userErrorUrl = 'https://appcenter.intuit.com/app/connect/oauth2/error?client_id=AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA&scope=com.intuit.quickbooks.accounting&redirect_uri=https%3A%2F%2Finkticate-time-tracker-pooranrajput.replit.app%2Fapi%2Fquickbooks%2Fcallback&response_type=code&state=timetracking-oauth-state&locale=en-us';

console.log('\n📋 ANALYSIS OF YOUR ERROR URL:');
const errorUrl = new URL(userErrorUrl);
const errorParams = errorUrl.searchParams;

console.log('Base URL:', errorUrl.origin + errorUrl.pathname);
console.log('Client ID:', errorParams.get('client_id'));
console.log('Scope:', errorParams.get('scope'));
console.log('Redirect URI:', errorParams.get('redirect_uri'));
console.log('Response Type:', errorParams.get('response_type'));
console.log('State:', errorParams.get('state'));
console.log('Locale:', errorParams.get('locale'));

console.log('\n🔍 STATE PARAMETER ANALYSIS:');
console.log('State present:', !!errorParams.get('state'));
console.log('State value:', errorParams.get('state'));
console.log('State length:', errorParams.get('state')?.length);

console.log('\n💡 POTENTIAL ISSUES:');
console.log('1. URL encoding problem in frontend');
console.log('2. Double encoding of state parameter');
console.log('3. Frontend opening wrong URL version');
console.log('4. QuickBooks caching old state-less URL');

console.log('\n🔧 SOLUTION APPROACHES:');
console.log('1. Check frontend URL opening logic');
console.log('2. Test direct URL access');
console.log('3. Clear browser cache/cookies');
console.log('4. Try different state parameter value');