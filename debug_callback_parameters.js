// Debug callback parameters to find the undefined value

import fetch from 'node-fetch';

const debugCallback = async () => {
  console.log('DEBUGGING CALLBACK PARAMETERS...');
  
  // Test callback with various parameter combinations
  const testCases = [
    {
      name: 'Complete callback',
      params: '?code=TEST123&state=production&realmId=9130351530529746'
    },
    {
      name: 'Missing state',
      params: '?code=TEST123&realmId=9130351530529746'
    },
    {
      name: 'Missing realmId',
      params: '?code=TEST123&state=production'
    },
    {
      name: 'Empty values',
      params: '?code=&state=&realmId='
    },
    {
      name: 'Undefined values',
      params: '?code=TEST123&state=undefined&realmId=9130351530529746'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\nTesting: ${testCase.name}`);
    try {
      const response = await fetch(`http://localhost:5000/api/quickbooks/callback${testCase.params}`, {
        redirect: 'manual'
      });
      
      console.log('Status:', response.status);
      
      if (response.status === 302) {
        const location = response.headers.get('location');
        console.log('Redirect:', location);
        
        if (location?.includes('undefined')) {
          console.log('❌ FOUND UNDEFINED IN REDIRECT!');
          console.log('This test case exposes the bug:', testCase.name);
        }
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
  }
};

debugCallback();