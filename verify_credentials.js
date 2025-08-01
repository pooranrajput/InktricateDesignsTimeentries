// Verify that our hardcoded credentials are correctly formatted
const correctClientId = 'AB6HieH2iCWQSQejneSCittAKuPHlcipzio09raTAQV5EUtA';
const correctClientSecret = 'szxQeCSAH2uQ3SpXAFKG0pezNOsNgF26oIKZnDU';

console.log('Credential Verification:');
console.log('Client ID:', correctClientId);
console.log('Client ID Length:', correctClientId.length);
console.log('Position 12 character:', correctClientId.charAt(11), '(should be Q)');
console.log('Client Secret:', correctClientSecret);
console.log('Client Secret Length:', correctClientSecret.length);

const credentials = Buffer.from(`${correctClientId}:${correctClientSecret}`).toString('base64');
console.log('Base64 Credentials:', credentials);
console.log('Base64 Length:', credentials.length);

// Test if these credentials match any known patterns
console.log('\nFormat Analysis:');
console.log('Client ID starts with:', correctClientId.substring(0, 10));
console.log('Client Secret starts with:', correctClientSecret.substring(0, 10));
console.log('Combined string:', `${correctClientId}:${correctClientSecret}`.substring(0, 50) + '...');