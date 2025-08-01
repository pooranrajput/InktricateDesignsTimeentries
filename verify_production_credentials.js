// Verify the exact credentials from the screenshot
const screenshotClientId = 'AB6HieH2iCWWSQSjneSCittAKuPHlcipzio09raTAQV5EUtA';
const screenshotClientSecret = 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgF26oIKZnDU';

console.log('Production Credentials from Screenshot:');
console.log('Client ID:', screenshotClientId);
console.log('Client ID Length:', screenshotClientId.length);
console.log('Position 12 character:', screenshotClientId.charAt(11), '(actual from screenshot)');
console.log('Client Secret:', screenshotClientSecret);
console.log('Client Secret Length:', screenshotClientSecret.length);

// Generate base64 credentials
const credentials = Buffer.from(`${screenshotClientId}:${screenshotClientSecret}`).toString('base64');
console.log('\nBase64 Encoded Credentials:', credentials);
console.log('Base64 Length:', credentials.length);

// Generate authorization URL with these exact credentials
const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';
const params = new URLSearchParams({
    client_id: screenshotClientId,
    scope: 'com.intuit.quickbooks.accounting',
    redirect_uri: redirectUri,
    response_type: 'code',
    state: 'timetracking-reauth'
});

const authUrl = `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
console.log('\nCorrect Authorization URL:');
console.log(authUrl);