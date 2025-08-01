// Debug the entire OAuth flow step by step

const debugOAuthFlow = async () => {
  console.log('🔍 DEBUGGING QUICKBOOKS OAUTH FLOW\n');
  
  // Step 1: Test the auth endpoint
  console.log('STEP 1: Testing /api/quickbooks/auth endpoint');
  try {
    const authResponse = await fetch('http://localhost:5000/api/quickbooks/auth', {
      method: 'GET'
    });
    
    console.log('Auth Status:', authResponse.status);
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('Auth URL Generated:', authData.authUrl);
      
      // Parse the generated URL
      const url = new URL(authData.authUrl);
      console.log('Client ID in URL:', url.searchParams.get('client_id'));
      console.log('Redirect URI in URL:', url.searchParams.get('redirect_uri'));
      console.log('State in URL:', url.searchParams.get('state'));
      
    } else {
      const errorText = await authResponse.text();
      console.log('Auth Error:', errorText);
    }
  } catch (error) {
    console.log('Auth Request Failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Step 2: Check environment variables
  console.log('STEP 2: Environment Variable Check');
  console.log('QUICKBOOKS_PRODUCTION_CLIENT_ID length:', process.env.QUICKBOOKS_PRODUCTION_CLIENT_ID?.length || 'NOT SET');
  console.log('QUICKBOOKS_PRODUCTION_CLIENT_SECRET length:', process.env.QUICKBOOKS_PRODUCTION_CLIENT_SECRET?.length || 'NOT SET');
  
  console.log('\n' + '='.repeat(50));
  
  // Step 3: Compare with your working URL
  console.log('STEP 3: URL Comparison');
  const yourWorkingURL = 'https://appcenter.intuit.com/connect/oauth2?client_id=AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA&scope=com.intuit.quickbooks.accounting&redirect_uri=https%3A%2F%2Finkticate-time-tracker-pooranrajput.replit.app%2Fapi%2Fquickbooks%2Fcallback&response_type=code&state=corrected-client-id';
  
  const workingURL = new URL(yourWorkingURL);
  console.log('Your Working URL Client ID:', workingURL.searchParams.get('client_id'));
  console.log('Environment Client ID:', process.env.QUICKBOOKS_PRODUCTION_CLIENT_ID);
  console.log('Client IDs Match:', workingURL.searchParams.get('client_id') === process.env.QUICKBOOKS_PRODUCTION_CLIENT_ID);
  
  console.log('\n🎯 ANALYSIS:');
  console.log('- If auth endpoint fails → server/environment issue');
  console.log('- If Client IDs don\'t match → environment variable issue');
  console.log('- If both work → issue is in QuickBooks authorization or callback processing');
};

debugOAuthFlow();