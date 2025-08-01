// Debug script to analyze the invalid_client error

const clientId = 'AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA';
const clientSecret = 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26cIKEnDU';

console.log('🔍 Credential Analysis:');
console.log('Client ID:', clientId);
console.log('Client ID Length:', clientId.length);
console.log('Client ID Char 12:', clientId.charAt(11));

console.log('\nClient Secret:', clientSecret);
console.log('Client Secret Length:', clientSecret.length);

console.log('\nBase64 Encoding Test:');
const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
console.log('Credentials:', credentials);
console.log('Credentials Length:', credentials.length);

console.log('\nDecoding Test:');
const decoded = Buffer.from(credentials, 'base64').toString();
console.log('Decoded:', decoded);
console.log('Matches Original:', decoded === `${clientId}:${clientSecret}`);

// Test authorization code issue
console.log('\n🔍 POTENTIAL ISSUE ANALYSIS:');
console.log('1. Authorization URL uses Client ID:', clientId.substring(0, 15) + '...');
console.log('2. Token exchange uses Client ID:', clientId.substring(0, 15) + '...');
console.log('3. Both should match exactly');

console.log('\n🚨 POSSIBLE CAUSES:');
console.log('- Authorization code was generated with different credentials');
console.log('- QuickBooks app configuration issue');
console.log('- Client ID/Secret encoding problem');
console.log('- Production vs Sandbox credential mismatch');