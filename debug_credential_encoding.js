// Debug credential encoding to find the exact issue
const userClientId = 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA';
const userClientSecret = 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26clKEnDU';

console.log('🔍 CREDENTIAL DEBUGGING');
console.log('='.repeat(60));

console.log('\n📋 User Provided Credentials:');
console.log('Client ID:', userClientId);
console.log('Client Secret:', userClientSecret);
console.log('Client ID Length:', userClientId.length);
console.log('Client Secret Length:', userClientSecret.length);

// Generate base64 encoding
const credentials = Buffer.from(`${userClientId}:${userClientSecret}`).toString('base64');
console.log('\n🔑 Base64 Encoding:');
console.log('Credentials:', credentials);
console.log('Length:', credentials.length);

// Test the exact same process as the server
console.log('\n🧪 Server Process Simulation:');
const simulatedCredentials = Buffer.from(`${userClientId}:${userClientSecret}`).toString('base64');
console.log('Simulated Base64:', simulatedCredentials);
console.log('Match:', credentials === simulatedCredentials);

// Decode to verify
const decoded = Buffer.from(credentials, 'base64').toString('ascii');
console.log('\n🔍 Decoded Verification:');
console.log('Decoded:', decoded);
const [decodedId, decodedSecret] = decoded.split(':');
console.log('Decoded Client ID:', decodedId);
console.log('Decoded Secret:', decodedSecret);
console.log('ID Match:', decodedId === userClientId);  
console.log('Secret Match:', decodedSecret === userClientSecret);

// Check for any hidden characters
console.log('\n🔬 Character Analysis:');
console.log('Client ID chars:', userClientId.split('').map((c, i) => `${i}: ${c}`).slice(0, 15));
console.log('Secret chars:', userClientSecret.split('').map((c, i) => `${i}: ${c}`).slice(0, 10));