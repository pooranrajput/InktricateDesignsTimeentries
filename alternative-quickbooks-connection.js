// Alternative QuickBooks connection methods
// Since callback URI has config issues, let's explore other options

const alternativeApproaches = {
  
  // Method 1: QuickBooks OAuth Playground
  playground: {
    url: 'https://developer.intuit.com/app/developer/playground',
    description: 'Official Intuit OAuth playground - generates tokens manually',
    steps: [
      '1. Go to OAuth playground',
      '2. Enter your Client ID and Secret',
      '3. Select QuickBooks Online scope',
      '4. Get tokens directly from playground',
      '5. Manually insert tokens into database'
    ]
  },

  // Method 2: Different redirect URI patterns that might work
  commonRedirectUris: [
    'https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl', // Playground redirect
    'https://appcenter.intuit.com/playground/oauth_callback',        // Alternative playground
    'https://oauth.intuit.com/oauth2/callback',                      // Generic callback
    'urn:ietf:wg:oauth:2.0:oob'                                     // Out-of-band flow
  ],

  // Method 3: Localhost tunneling (if needed for development)
  tunnel: {
    description: 'Use ngrok or similar to create https tunnel',
    example: 'https://abc123.ngrok.io/api/quickbooks/callback'
  }
};

console.log('Alternative QuickBooks Connection Methods:');
console.log(JSON.stringify(alternativeApproaches, null, 2));

// Test if any common redirect URIs might work
console.log('\nTesting alternative OAuth URLs...');

alternativeApproaches.commonRedirectUris.forEach((redirectUri, index) => {
  const testUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
  testUrl.searchParams.set('client_id', 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA');
  testUrl.searchParams.set('scope', 'com.intuit.quickbooks.accounting');
  testUrl.searchParams.set('redirect_uri', redirectUri);
  testUrl.searchParams.set('response_type', 'code');
  testUrl.searchParams.set('state', `test-${index}`);
  
  console.log(`\nMethod ${index + 1}: ${redirectUri}`);
  console.log(`Test URL: ${testUrl.toString()}`);
});