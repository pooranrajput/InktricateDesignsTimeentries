// Debug production app OAuth flow with current configuration
console.log('🔍 PRODUCTION APP OAUTH DEBUGGING');
console.log('='.repeat(50));

console.log('\n✅ VERIFIED CONFIGURATION:');
console.log('App Status: In Production (confirmed by user)');
console.log('Client ID: AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA');
console.log('Redirect URI: https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback');
console.log('Scope: com.intuit.quickbooks.accounting');

console.log('\n🧪 POTENTIAL REMAINING ISSUES:');
console.log('1. SSL Certificate validation on redirect domain');
console.log('2. QuickBooks internal caching of old app configuration');
console.log('3. Specific character encoding in Client ID');
console.log('4. Subdomain or domain validation issues');
console.log('5. OAuth state parameter validation');

console.log('\n🔧 DEBUGGING APPROACHES:');
console.log('1. Test with simplified OAuth parameters');
console.log('2. Verify SSL certificate on callback domain');
console.log('3. Try different state parameter');
console.log('4. Check if domain is accessible from QuickBooks servers');
console.log('5. Test with development mode temporarily');

console.log('\n💡 IMMEDIATE TESTS:');
console.log('- Test callback endpoint accessibility');
console.log('- Verify HTTPS certificate validity');
console.log('- Check domain resolution from external sources');
console.log('- Test OAuth with minimal parameters');