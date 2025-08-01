// Debug the callback state parameter issue

import fetch from 'node-fetch';

const debugCallbackState = async () => {
  console.log('DEBUGGING CALLBACK STATE PARAMETER ISSUE...\n');
  
  // Create a test callback URL to see what parameters are being received
  console.log('Creating test callback simulation...\n');
  
  // Test what happens when we simulate the callback with various state values
  const testCases = [
    { state: 'fresh-start-1753994751863', desc: 'Current valid state' },
    { state: 'undefined', desc: 'Undefined as string' },
    { state: null, desc: 'Null state' },
    { state: '', desc: 'Empty string state' }
  ];
  
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.desc}`);
    
    const testUrl = new URLSearchParams({
      code: 'test_code_123',
      realmId: '9130351530529746',
      state: testCase.state || ''
    });
    
    try {
      // Don't actually call the callback, just analyze the URL
      console.log(`- State parameter: "${testCase.state}"`);
      console.log(`- State is undefined: ${testCase.state === undefined}`);
      console.log(`- State is null: ${testCase.state === null}`);
      console.log(`- State is "undefined": ${testCase.state === 'undefined'}`);
      console.log(`- State length: ${testCase.state?.length || 0}`);
      console.log('');
    } catch (error) {
      console.log(`- Error with ${testCase.desc}:`, error.message);
    }
  }
  
  // Now let's check if the issue is in our current OAuth URL generation
  console.log('Checking current OAuth URL state parameter...\n');
  
  try {
    const response = await fetch('http://localhost:5000/api/quickbooks/auth?debug=state');
    const data = await response.json();
    
    const url = new URL(data.authUrl);
    const state = url.searchParams.get('state');
    
    console.log('Current OAuth URL Analysis:');
    console.log('- Full URL:', data.authUrl);
    console.log('- State parameter extracted:', state);
    console.log('- State type:', typeof state);
    console.log('- State length:', state?.length);
    console.log('- State is valid:', state && state !== 'undefined' && state.length > 0);
    
    // The issue might be that QuickBooks is somehow not preserving our state parameter
    // or our callback handler is not processing it correctly
    
    console.log('\n=== POTENTIAL ISSUES ===');
    console.log('1. QuickBooks might be corrupting the state parameter during OAuth flow');
    console.log('2. Our callback handler might not be reading the state parameter correctly');
    console.log('3. There might be URL encoding/decoding issues');
    console.log('4. The QuickBooks app configuration might have issues with state parameter');
    
    console.log('\n=== SOLUTION ATTEMPT ===');
    console.log('Let me create a callback handler that logs everything it receives...');
    
  } catch (error) {
    console.log('Error:', error.message);
  }
};

debugCallbackState();