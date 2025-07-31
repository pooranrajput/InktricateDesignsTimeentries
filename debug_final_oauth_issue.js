// Final OAuth debugging - check if there's still a mismatch

console.log('🔍 FINAL OAUTH DEBUGGING');

// Check what's actually in environment variables
const envClientId = process.env.QUICKBOOKS_CLIENT_ID;
const envClientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;

console.log('Environment Variables:');
console.log('- Client ID:', envClientId);
console.log('- Client ID Length:', envClientId?.length);
console.log('- Client Secret:', envClientSecret);
console.log('- Client Secret Length:', envClientSecret?.length);

// Check if they match what user provided
const userProvidedClientId = 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA';
const userProvidedSecret = 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26clKEnDU';

console.log('\nUser Provided Credentials:');
console.log('- Client ID:', userProvidedClientId);
console.log('- Client ID Length:', userProvidedClientId.length);
console.log('- Client Secret:', userProvidedSecret);
console.log('- Client Secret Length:', userProvidedSecret.length);

console.log('\nComparison:');
console.log('- Client ID Match:', envClientId === userProvidedClientId);
console.log('- Client Secret Match:', envClientSecret === userProvidedSecret);

if (envClientId !== userProvidedClientId) {
  console.log('\n🚨 CLIENT ID MISMATCH DETAILS:');
  console.log('Env:  ', envClientId);
  console.log('User: ', userProvidedClientId);
  
  // Find the differences
  if (envClientId && userProvidedClientId) {
    for (let i = 0; i < Math.max(envClientId.length, userProvidedClientId.length); i++) {
      if (envClientId[i] !== userProvidedClientId[i]) {
        console.log(`Difference at position ${i}: env='${envClientId[i]}' vs user='${userProvidedClientId[i]}'`);
      }
    }
  }
}

if (envClientSecret !== userProvidedSecret) {
  console.log('\n🚨 CLIENT SECRET MISMATCH DETAILS:');
  console.log('Env:  ', envClientSecret);
  console.log('User: ', userProvidedSecret);
}