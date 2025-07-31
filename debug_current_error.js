// Debug the current credential issue

console.log('🔍 CURRENT CREDENTIAL DEBUG');

const expectedClientId = 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA';
const expectedClientSecret = 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26clKEnDU';

const actualClientId = process.env.QUICKBOOKS_CLIENT_ID;
const actualClientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;

console.log('Expected vs Actual:');
console.log('Client ID Expected:', expectedClientId);
console.log('Client ID Actual:  ', actualClientId);
console.log('Client ID Match:   ', actualClientId === expectedClientId);

console.log('\nClient Secret Expected:', expectedClientSecret);
console.log('Client Secret Actual:  ', actualClientSecret);
console.log('Client Secret Match:   ', actualClientSecret === expectedClientSecret);

console.log('\nLength Comparison:');
console.log('Client ID - Expected:', expectedClientId.length, 'Actual:', actualClientId?.length);
console.log('Client Secret - Expected:', expectedClientSecret.length, 'Actual:', actualClientSecret?.length);

if (actualClientSecret !== expectedClientSecret) {
  console.log('\n🚨 CLIENT SECRET MISMATCH:');
  console.log('Expected first 10:', expectedClientSecret.substring(0, 10));
  console.log('Actual first 10:  ', actualClientSecret?.substring(0, 10));
  
  if (actualClientSecret && expectedClientSecret) {
    console.log('First character - Expected:', expectedClientSecret[0], 'Actual:', actualClientSecret[0]);
  }
}