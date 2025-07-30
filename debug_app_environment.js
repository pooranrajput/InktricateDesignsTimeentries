// Create test endpoints to help diagnose the QuickBooks app environment
console.log('🔍 QUICKBOOKS APP ENVIRONMENT DIAGNOSTIC');
console.log('='.repeat(60));

const userCredentials = {
  clientId: 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA',
  clientSecret: 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26clKEnDU',
  companyId: '9341455047397094'
};

console.log('\n📋 Current Configuration:');
console.log('Client ID:', userCredentials.clientId);
console.log('Client ID Length:', userCredentials.clientId.length);
console.log('Company ID:', userCredentials.companyId);
console.log('Redirect URI: https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback');

console.log('\n🔍 Environment Analysis:');
console.log('Client ID Pattern Analysis:');
console.log('- Starts with: AB6HieH2iCW');
console.log('- Length: 50 characters (correct for both dev/prod)');
console.log('- Format: Alphanumeric (correct)');

console.log('\n🏢 Company ID Analysis:');
console.log('- Company: 9341455047397094');
console.log('- Length: 16 digits (typical for both sandbox and production)');
console.log('- Cannot determine environment from ID alone');

console.log('\n❓ Key Questions to Resolve:');
console.log('1. CREDENTIAL SOURCE:');
console.log('   - Which tab in QuickBooks Developer Dashboard?');
console.log('   - "Development" tab = Sandbox credentials');
console.log('   - "Production" tab = Production credentials');

console.log('\n2. APP STATUS:');
console.log('   - Development app = Works only with sandbox companies');
console.log('   - Published app = Works with real business accounts');

console.log('\n3. COMPANY TYPE:');
console.log('   - Sandbox company = For testing (works with dev credentials)');
console.log('   - Real business = Live data (requires prod credentials + published app)');

console.log('\n🎯 Recommended Actions:');
console.log('A. If testing with sandbox data:');
console.log('   → Use Development tab credentials');
console.log('   → Connect to sandbox QuickBooks company');
console.log('   → Set sandbox: true in configuration');

console.log('\nB. If connecting to real business:');
console.log('   → Use Production tab credentials');  
console.log('   → Ensure app is Published status');
console.log('   → Connect to real QuickBooks Online account');
console.log('   → Set sandbox: false in configuration');

console.log('\n🔧 Current Error Suggests:');
console.log('- Credentials are valid (not "invalid_client")');
console.log('- Environment mismatch (dev credentials + prod mode OR vice versa)');  
console.log('- App not approved for production use');