// Test with the actual auth code from the logs to see the exact error

const realAuthCode = 'XAB11753988923orSs9H5orobNh056mn29JfSyypK2IbsnfvkN';
const clientId = 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA';
const clientSecret = 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26clKEnDU';
const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';

console.log('🔍 TESTING WITH REAL AUTHORIZATION CODE FROM LOGS');

const testExactTokenExchange = async () => {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  console.log('Using exact same parameters as logs:');
  console.log('- Auth code:', realAuthCode);
  console.log('- Client ID:', clientId);
  console.log('- Client Secret:', clientSecret.substring(0, 10) + '...');
  console.log('- Redirect URI:', redirectUri);
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: realAuthCode,
    redirect_uri: redirectUri
  });
  
  try {
    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    });
    
    const result = await response.text();
    console.log('\nResponse Status:', response.status);
    console.log('Response Body:', result);
    
    // Try to parse as JSON
    try {
      const jsonResult = JSON.parse(result);
      console.log('Parsed JSON:', jsonResult);
      
      if (jsonResult.error === 'invalid_client') {
        console.log('\n🚨 INVALID CLIENT ERROR CONFIRMED');
        console.log('This suggests one of:');
        console.log('1. Authorization code was generated for different client');
        console.log('2. Authorization code has expired');
        console.log('3. Different OAuth app/environment mismatch');
        console.log('4. Some other configuration issue on QuickBooks side');
      }
    } catch (e) {
      console.log('Response is not JSON:', result);
    }
    
  } catch (error) {
    console.error('Request failed:', error);
  }
};

// Also check authorization code format
console.log('\n🔍 AUTHORIZATION CODE ANALYSIS:');
console.log('Code format:', realAuthCode);
console.log('Code length:', realAuthCode.length);
console.log('Code prefix:', realAuthCode.substring(0, 5));
console.log('Code looks valid:', /^XAB\d{11}[A-Za-z0-9]{36}$/.test(realAuthCode));

testExactTokenExchange();