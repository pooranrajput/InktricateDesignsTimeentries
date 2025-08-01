// Create a test OAuth URL that points to our debug server instead of the real callback

import fetch from 'node-fetch';

const createTestOAuthUrl = () => {
  console.log('CREATING TEST OAUTH URL FOR DEBUGGING...\n');
  
  // Use our test server as redirect URI to capture exactly what QuickBooks sends
  const testRedirectUri = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co:3002/test-callback`;
  
  // Generate test OAuth URL with the same parameters as production
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const state = `debug-test-${Date.now()}`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'com.intuit.quickbooks.accounting',
    redirect_uri: testRedirectUri,
    response_type: 'code',
    state: state,
    sandbox: 'false'
  });
  
  const testOAuthUrl = `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
  
  console.log('TEST OAUTH URL GENERATED:');
  console.log('='.repeat(80));
  console.log(testOAuthUrl);
  console.log('='.repeat(80));
  console.log('');
  console.log('DEBUGGING PLAN:');
  console.log('1. Start the test callback server (run bypass_test_callback.js)');
  console.log('2. Use the URL above to authorize with QuickBooks');
  console.log('3. Our test server will capture exactly what QuickBooks sends');
  console.log('4. We can see if the "undefined" is coming from QuickBooks or our code');
  console.log('');
  console.log('Parameters in this test URL:');
  console.log('- Client ID:', clientId.substring(0, 20) + '...');
  console.log('- State:', state);
  console.log('- Redirect URI:', testRedirectUri);
  console.log('- Sandbox: false');
  
  return testOAuthUrl;
};

// Actually, let's use a simpler approach that doesn't require external servers
const createSimpleTestUrl = () => {
  console.log('\n=== SIMPLIFIED DEBUGGING APPROACH ===\n');
  
  // The issue might be that the QuickBooks app itself has some configuration problem
  // Let's create a URL that uses minimal parameters to see if that works
  
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';
  const state = `minimal-test-${Date.now()}`;
  
  // Test with minimal parameters
  const minimalParams = new URLSearchParams({
    client_id: clientId,
    scope: 'com.intuit.quickbooks.accounting',
    redirect_uri: redirectUri,
    response_type: 'code',
    state: state
    // Removing sandbox parameter to see if that's causing issues
  });
  
  const minimalUrl = `https://appcenter.intuit.com/connect/oauth2?${minimalParams.toString()}`;
  
  console.log('MINIMAL TEST URL (without sandbox parameter):');
  console.log('='.repeat(80));
  console.log(minimalUrl);
  console.log('='.repeat(80));
  console.log('');
  console.log('If this doesn\'t work, the issue is likely in the QuickBooks app configuration itself.');
  console.log('The "undefined didn\'t connect" error suggests QuickBooks can\'t identify the app properly.');
  
  return minimalUrl;
};

createTestOAuthUrl();
createSimpleTestUrl();