// Generate OAuth URL with the correct Client ID manually

const generateCorrectOAuthURL = () => {
  console.log('GENERATING CORRECT OAUTH URL WITH PROPER CLIENT ID...\n');
  
  // Use the correct production Client ID you provided
  const correctClientId = 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA';
  const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';
  const scope = 'com.intuit.quickbooks.accounting';
  const state = 'corrected-client-id-test';
  
  // Construct the correct OAuth URL
  const baseUrl = 'https://appcenter.intuit.com/connect/oauth2';
  const params = new URLSearchParams({
    client_id: correctClientId,
    scope: scope,
    redirect_uri: redirectUri,
    response_type: 'code',
    state: state
  });
  
  const correctOAuthUrl = `${baseUrl}?${params.toString()}`;
  
  console.log('CORRECT CLIENT ID VERIFICATION:');
  console.log('Client ID:', correctClientId);
  console.log('Character at position 11:', correctClientId.charAt(10)); // Should be 'I'
  console.log('Length:', correctClientId.length);
  console.log('');
  
  console.log('CORRECTED PRODUCTION OAUTH URL:');
  console.log('='.repeat(100));
  console.log(correctOAuthUrl);
  console.log('='.repeat(100));
  console.log('');
  
  console.log('TEST THIS URL:');
  console.log('This URL uses your correct production Client ID and should work');
  console.log('with your approved app and configured redirect URIs.');
  console.log('');
  
  console.log('EXPECTED RESULT:');
  console.log('✅ QuickBooks authorization page (not error page)');
  console.log('✅ Ability to connect to your business account');
  console.log('✅ Successful OAuth flow completion');
  
  return correctOAuthUrl;
};

generateCorrectOAuthURL();