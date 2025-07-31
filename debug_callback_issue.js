// Debug the callback handling issue

import fetch from 'node-fetch';

const debugCallback = async () => {
  console.log('DEBUGGING CALLBACK HANDLING ISSUE...');
  
  // Test the callback endpoint directly
  const testCases = [
    {
      name: 'Valid production callback',
      url: 'http://localhost:5000/api/quickbooks/callback?code=TEST123&state=test&realmId=9130351530529746'
    },
    {
      name: 'Missing parameters',
      url: 'http://localhost:5000/api/quickbooks/callback'
    },
    {
      name: 'Missing code',
      url: 'http://localhost:5000/api/quickbooks/callback?state=test&realmId=9130351530529746'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\nTesting: ${testCase.name}`);
    try {
      const response = await fetch(testCase.url, { redirect: 'manual' });
      console.log('Status:', response.status);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.status === 302) {
        const location = response.headers.get('location');
        console.log('Redirect to:', location);
        
        if (location?.includes('undefined')) {
          console.log('❌ FOUND THE BUG: "undefined" in redirect URL');
        }
      } else {
        const body = await response.text();
        console.log('Body:', body.substring(0, 200));
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
  }
};

debugCallback();