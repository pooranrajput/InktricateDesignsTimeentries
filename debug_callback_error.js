// Debug the callback error to see what's failing

import fetch from 'node-fetch';

const debugCallbackError = async () => {
  console.log('DEBUGGING CALLBACK ERROR...\n');
  
  // Check if there are any recent callback attempts in the logs
  try {
    // Test a callback simulation to see what might be failing
    console.log('Simulating callback with test parameters...');
    
    const testParams = new URLSearchParams({
      code: 'test_auth_code_123',
      realmId: '9130351530529746',  // Your production company ID
      state: 'test_state_123'
    });
    
    console.log('Test callback URL would be:');
    console.log(`https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback?${testParams.toString()}`);
    
    // Since we can't test the actual callback without a real auth code,
    // let's check what specific error handling exists in our callback
    console.log('\nAnalyzing potential callback failure points:');
    console.log('1. Missing code parameter');
    console.log('2. Missing realmId parameter');
    console.log('3. Token exchange failure');
    console.log('4. Database storage failure');
    console.log('5. Redirect failure');
    
    console.log('\nMost likely issue:');
    console.log('The callback received the parameters but failed during token exchange.');
    console.log('This could be due to:');
    console.log('- Client credentials mismatch');
    console.log('- Authorization code expiry');
    console.log('- Network/timeout issues');
    
    // Generate a fresh OAuth URL to get a new auth code
    const response = await fetch('http://localhost:5000/api/quickbooks/auth?debug_callback=true');
    const data = await response.json();
    
    console.log('\nFresh OAuth URL for retry:');
    console.log('='.repeat(80));
    console.log(data.authUrl);
    console.log('='.repeat(80));
    
    return data.authUrl;
    
  } catch (error) {
    console.log('Debug error:', error.message);
  }
};

debugCallbackError();