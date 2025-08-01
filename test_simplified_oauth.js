// Test with simplified OAuth parameters to isolate issue
const clientId = 'AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA';
const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';

console.log('🧪 SIMPLIFIED OAUTH TEST');
console.log('='.repeat(40));

// Test 1: Minimal parameters
const minimalUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

console.log('\n🔗 Test 1 - Minimal OAuth URL:');
console.log(minimalUrl);

// Test 2: Different state parameter
const stateTestUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=test123`;

console.log('\n🔗 Test 2 - Different State:');
console.log(stateTestUrl);

// Test 3: Check for URL encoding issues
console.log('\n🔍 URL Encoding Analysis:');
console.log('Original redirect:', redirectUri);
console.log('Encoded redirect:', encodeURIComponent(redirectUri));
console.log('Client ID length:', clientId.length);
console.log('Client ID chars 20-25:', clientId.substring(20, 25));

console.log('\n💡 Next Steps:');
console.log('1. Try minimal OAuth URL first');
console.log('2. If that fails, try different state parameter');
console.log('3. Check if domain is accessible externally');
console.log('4. Consider trying development mode temporarily');