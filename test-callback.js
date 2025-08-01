// Simple callback test to see the exact error
import fetch from 'node-fetch';

async function testCallback() {
  try {
    const response = await fetch('https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback?code=QB_TEST&state=test&realmId=9130351530529746', {
      redirect: 'manual'
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Body:', await response.text());
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCallback();