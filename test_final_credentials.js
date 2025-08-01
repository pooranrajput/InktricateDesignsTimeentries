// Test with exact credentials provided by user
const correctClientId = 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA';
const correctClientSecret = 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26clKEnDU';

console.log('🔍 Final Production Credentials:');
console.log('Client ID:', correctClientId);
console.log('Client ID Length:', correctClientId.length);
console.log('Position 12 character:', correctClientId.charAt(11));
console.log('Client Secret:', correctClientSecret);
console.log('Client Secret Length:', correctClientSecret.length);

// Generate base64 for API
const credentials = Buffer.from(`${correctClientId}:${correctClientSecret}`).toString('base64');
console.log('\n🔑 Base64 Credentials:', credentials);

// Generate final authorization URL
const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';
const params = new URLSearchParams({
    client_id: correctClientId,
    scope: 'com.intuit.quickbooks.accounting',
    redirect_uri: redirectUri,
    response_type: 'code',
    state: 'timetracking-reauth'
});

const authUrl = `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
console.log('\n🎯 FINAL AUTHORIZATION URL:');
console.log(authUrl);