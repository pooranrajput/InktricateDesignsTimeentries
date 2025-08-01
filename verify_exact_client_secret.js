// Verify the exact Client Secret being used
console.log('🔍 CLIENT SECRET VERIFICATION');
console.log('='.repeat(50));

const envSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
const expectedSecret = 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26clKEnDU';

console.log('\n📋 Secret Comparison:');
console.log('Environment Secret:', envSecret || 'NOT_SET');
console.log('Expected Secret:', expectedSecret);
console.log('Secrets Match:', envSecret === expectedSecret);

if (envSecret && expectedSecret) {
  console.log('\n🔬 Character-by-Character Analysis:');
  for (let i = 0; i < Math.max(envSecret.length, expectedSecret.length); i++) {
    const envChar = envSecret[i] || 'MISSING';
    const expChar = expectedSecret[i] || 'MISSING';
    const match = envChar === expChar;
    
    if (!match) {
      console.log(`Position ${i}: ENV='${envChar}', EXPECTED='${expChar}' ❌`);
    }
  }
  
  console.log('\nLength Check:');
  console.log('Environment Length:', envSecret.length);
  console.log('Expected Length:', expectedSecret.length);
}

console.log('\n🔑 Base64 Test:');
if (envSecret) {
  const clientId = 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA';
  const credentials = Buffer.from(`${clientId}:${envSecret}`).toString('base64');
  console.log('Generated Credentials:', credentials.substring(0, 30) + '...');
}

console.log('\n🎯 Action Required:');
if (envSecret !== expectedSecret) {
  console.log('❌ CLIENT SECRET MISMATCH DETECTED');
  console.log('The Replit secret does not match the expected production secret');
  console.log('This is likely the cause of the "invalid_grant" error');
} else {
  console.log('✅ Client Secret matches - issue may be elsewhere');
}