// Analyze the exact request being made based on logs

const loggedRequest = {
  url: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
  method: 'POST',
  authHeader: 'Basic QUI2SGllSDJpQ1dXU1E4...',
  bodyParams: 'grant_type=authorization_code&code=XAB11753988923orSs9H5orobNh056mn29JfSyypK2IbsnfvkN&redirect_uri=https%3A%2F%2Finkticate-time-tracker-pooranrajput.replit.app%2Fapi%2Fquickbooks%2Fcallback',
  clientIdUsed: 'AB6HieH2iCWWSQ8jneSC...',
  secretUsed: 'ezxQeCSAH2...'
};

console.log('🔍 ANALYZING ACTUAL REQUEST FROM LOGS');

// Decode the auth header to see what credentials are being sent
const authHeaderDecoded = Buffer.from('QUI2SGllSDJpQ1dXU1E4am5lU0NJY3RmSUFLdVBISWN1anppbzA5cmFUQVFWNUVVdEE6ZXp4UWVDU0FIMnVRM1NwWEFGS0cwcGV6Tk9zTmdGSTI2Y2xLRW5EVQ==', 'base64').toString();
console.log('Auth header decoded:', authHeaderDecoded);

const [clientIdFromHeader, secretFromHeader] = authHeaderDecoded.split(':');
console.log('Client ID from auth header:', clientIdFromHeader);
console.log('Client Secret from auth header:', secretFromHeader);

// Compare with expected values
const expectedClientId = 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA';
const expectedSecret = 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26clKEnDU';

console.log('\n🔍 CREDENTIAL COMPARISON:');
console.log('Expected Client ID:  ', expectedClientId);
console.log('Actual Client ID:    ', clientIdFromHeader);
console.log('Client ID matches:   ', clientIdFromHeader === expectedClientId);

console.log('\nExpected Secret:     ', expectedSecret);
console.log('Actual Secret:       ', secretFromHeader);
console.log('Secret matches:      ', secretFromHeader === expectedSecret);

// Analyze redirect URI from body params
const bodyParams = new URLSearchParams(loggedRequest.bodyParams);
const redirectUriFromBody = bodyParams.get('redirect_uri');
console.log('\n🔍 REDIRECT URI ANALYSIS:');
console.log('Redirect URI in request:', redirectUriFromBody);

// Check for any character differences
if (clientIdFromHeader !== expectedClientId) {
  console.log('\n🚨 CLIENT ID DIFFERENCES:');
  for (let i = 0; i < Math.max(clientIdFromHeader.length, expectedClientId.length); i++) {
    if (clientIdFromHeader[i] !== expectedClientId[i]) {
      console.log(`Position ${i}: actual='${clientIdFromHeader[i]}' vs expected='${expectedClientId[i]}'`);
    }
  }
}

if (secretFromHeader !== expectedSecret) {
  console.log('\n🚨 CLIENT SECRET DIFFERENCES:');
  for (let i = 0; i < Math.max(secretFromHeader.length, expectedSecret.length); i++) {
    if (secretFromHeader[i] !== expectedSecret[i]) {
      console.log(`Position ${i}: actual='${secretFromHeader[i]}' vs expected='${expectedSecret[i]}'`);
    }
  }
}