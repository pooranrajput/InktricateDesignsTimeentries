// Test the callback with real parameters to see exact error
import fetch from 'node-fetch';

async function testRealCallback() {
  try {
    // Test with a realistic callback URL
    const testUrl = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback?code=Q0116291492899XrDaDGGz6tLXv8EFhCa93A8kHVpd1hKFJI5k&state=test&realmId=9130351530529746';
    
    console.log('Testing callback URL:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 302) {
      console.log('Redirect location:', response.headers.get('location'));
    }
    
    const body = await response.text();
    console.log('Response body:', body);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testRealCallback();