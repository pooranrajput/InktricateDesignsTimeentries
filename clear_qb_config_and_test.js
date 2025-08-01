// Clear all QuickBooks configurations and test fresh connection

import fetch from 'node-fetch';

const clearAndTest = async () => {
  console.log('CLEARING ALL QUICKBOOKS CONFIGURATIONS...');
  
  try {
    // Clear any cached configurations
    await fetch('http://localhost:5000/api/quickbooks/clear', { method: 'POST' });
    console.log('✅ Cleared cached configurations');
    
    // Wait a moment for clear to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate completely fresh OAuth URL
    console.log('Generating fresh OAuth URL...');
    const response = await fetch(`http://localhost:5000/api/quickbooks/auth?fresh=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const data = await response.json();
    
    console.log('FRESH OAUTH URL:');
    console.log(data.authUrl);
    console.log('');
    
    // Verify correct credentials
    const url = new URL(data.authUrl);
    const clientId = url.searchParams.get('client_id');
    const redirectUri = url.searchParams.get('redirect_uri');
    
    console.log('CREDENTIAL VERIFICATION:');
    console.log('Client ID:', clientId);
    console.log('Redirect URI:', redirectUri);
    console.log('');
    
    // Check if using production credentials
    const correctClientId = clientId === 'AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA';
    const correctRedirectUri = redirectUri === 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';
    
    if (correctClientId && correctRedirectUri) {
      console.log('✅ PRODUCTION CREDENTIALS CONFIRMED');
      console.log('✅ All parameters correct');
      console.log('');
      console.log('READY FOR QUICKBOOKS CONNECTION');
      console.log('Click Connect QuickBooks button now');
    } else {
      console.log('❌ CREDENTIAL MISMATCH:');
      console.log('Expected Client ID: AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA');
      console.log('Actual Client ID:', clientId);
      console.log('Expected Redirect: https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback');
      console.log('Actual Redirect:', redirectUri);
    }
    
  } catch (error) {
    console.log('Error:', error.message);
  }
};

clearAndTest();