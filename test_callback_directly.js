// Test the callback endpoint directly to see what's happening

const testCallback = async () => {
  console.log('🔍 Testing QuickBooks callback endpoint directly...\n');
  
  // Test with sample parameters that would come from QuickBooks
  const testParams = new URLSearchParams({
    code: 'test_authorization_code_12345',
    state: 'test-state',
    realmId: '9130351530529746'  // Your production company ID
  });
  
  try {
    const response = await fetch(`http://localhost:5000/api/quickbooks/callback?${testParams.toString()}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CallbackTest/1.0)'
      }
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 302) {
      console.log('Redirect Location:', response.headers.get('location'));
    }
    
    const body = await response.text();
    console.log('Response Body:', body);
    
  } catch (error) {
    console.error('Test Error:', error.message);
  }
  
  console.log('\n🔍 This test shows how the callback handler responds to sample parameters');
  console.log('The real issue might be in the QuickBooks authorization step before the callback');
};

testCallback();