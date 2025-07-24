// Debug production QuickBooks credentials
console.log('🔍 DEBUGGING PRODUCTION QUICKBOOKS CREDENTIALS');
console.log('='.repeat(60));

console.log('\n📋 Environment Variables:');
console.log('CLIENT_ID length:', process.env.QUICKBOOKS_CLIENT_ID?.length || 'undefined');
console.log('CLIENT_ID first 15:', process.env.QUICKBOOKS_CLIENT_ID?.substring(0, 15) || 'undefined');
console.log('CLIENT_SECRET exists:', !!process.env.QUICKBOOKS_CLIENT_SECRET);
console.log('SANDBOX mode:', process.env.QUICKBOOKS_SANDBOX);

console.log('\n🎯 Expected Values:');
console.log('Expected CLIENT_ID: AB6HieH2iCWWSQejneSCittAKuPHlcipzio09raTAQV5EUtA');
console.log('Expected length: 50 characters');
console.log('Expected start: AB6HieH2iCWWSQej');

console.log('\n🔍 Current vs Expected:');
const current = process.env.QUICKBOOKS_CLIENT_ID || '';
const expected = 'AB6HieH2iCWWSQejneSCittAKuPHlcipzio09raTAQV5EUtA';
console.log('Length match:', current.length === expected.length);
console.log('First 15 match:', current.substring(0, 15) === expected.substring(0, 15));
console.log('Character 11 current:', current.charAt(10));
console.log('Character 11 expected:', expected.charAt(10));

if (current !== expected) {
  console.log('\n❌ CLIENT_ID MISMATCH DETECTED');
  console.log('Current :', current);
  console.log('Expected:', expected);
  
  // Find differences
  for (let i = 0; i < Math.max(current.length, expected.length); i++) {
    if (current.charAt(i) !== expected.charAt(i)) {
      console.log(`Difference at position ${i}: "${current.charAt(i)}" vs "${expected.charAt(i)}"`);
    }
  }
} else {
  console.log('\n✅ CLIENT_ID MATCHES EXPECTED VALUE');
}