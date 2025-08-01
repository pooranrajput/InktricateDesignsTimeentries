// Let's test the manual auth endpoint which should work
import fetch from 'node-fetch';

async function testManualAuth() {
  console.log('Testing manual auth endpoint...');
  
  const response = await fetch('https://inkticate-time-tracker-pooranrajput.replit.app/api/manual-quickbooks-auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: 'test_code_123',
      realmId: '9130351530529746'
    })
  });
  
  console.log('Response status:', response.status);
  const result = await response.json();
  console.log('Response:', result);
}

testManualAuth();