// Comprehensive credential debugging script

console.log('🔍 COMPREHENSIVE CREDENTIAL ANALYSIS');

// Test multiple credential combinations to identify the correct one
const testCredentials = [
  {
    name: 'Current Hardcoded',
    clientId: 'AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA',
    clientSecret: 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26cIKEnDU'
  },
  {
    name: 'Character 12 Fixed (Q instead of W)',
    clientId: 'AB6HieH2iCWQSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA',
    clientSecret: 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26cIKEnDU'
  },
  {
    name: 'Environment Variables',
    clientId: process.env.QUICKBOOKS_CLIENT_ID || 'NOT_SET',
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || 'NOT_SET'
  }
];

testCredentials.forEach((cred, index) => {
  console.log(`\n${index + 1}. ${cred.name}:`);
  console.log(`   Client ID: ${cred.clientId}`);
  console.log(`   Client Secret: ${cred.clientSecret}`);
  console.log(`   Client ID Length: ${cred.clientId.length}`);
  console.log(`   Secret Length: ${cred.clientSecret.length}`);
  
  if (cred.clientId !== 'NOT_SET' && cred.clientSecret !== 'NOT_SET') {
    const base64 = Buffer.from(`${cred.clientId}:${cred.clientSecret}`).toString('base64');
    console.log(`   Base64: ${base64.substring(0, 30)}...`);
    console.log(`   Base64 Length: ${base64.length}`);
  }
});

console.log('\n🔍 POTENTIAL ISSUES:');
console.log('1. Client ID character 12: W vs Q mismatch');
console.log('2. Environment variable override');
console.log('3. QuickBooks app configuration mismatch');
console.log('4. Authorization vs token exchange credential mismatch');

console.log('\n🔍 NEXT STEPS:');
console.log('- Test with corrected Client ID (Q instead of W)');
console.log('- Verify QuickBooks dashboard shows same credentials');
console.log('- Check if environment variables override hardcoded values');