// Test with the correct Client ID after restart

import fetch from 'node-fetch';

const testCorrectClientId = async () => {
  console.log('TESTING WITH CORRECT PRODUCTION CLIENT ID...\n');
  
  try {
    // Clear configuration and force fresh start
    console.log('1. Clearing old configuration...');
    await fetch('http://localhost:5000/api/quickbooks/clear', { method: 'POST' });
    
    // Generate OAuth URL with correct credentials
    console.log('2. Generating OAuth URL with correct production credentials...');
    const authResponse = await fetch('http://localhost:5000/api/quickbooks/auth?force_production=true');
    const authData = await authResponse.json();
    
    console.log('3. VERIFYING CORRECT CLIENT ID:');
    const urlObj = new URL(authData.authUrl);
    const clientId = urlObj.searchParams.get('client_id');
    
    console.log('Generated Client ID:', clientId);
    console.log('Expected Client ID: AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA');
    console.log('Client IDs match:', clientId === 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA');
    console.log('');
    
    if (clientId === 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA') {
      console.log('✅ SUCCESS: Using correct production Client ID');
      console.log('');
      console.log('CORRECTED PRODUCTION OAUTH URL:');
      console.log('='.repeat(100));
      console.log(authData.authUrl);
      console.log('='.repeat(100));
      console.log('');
      console.log('This URL should now work with your QuickBooks integration!');
    } else {
      console.log('❌ ERROR: Still using wrong Client ID');
      console.log('System needs to be forced to use QUICKBOOKS_PRODUCTION_CLIENT_ID');
    }
    
    return {
      status: clientId === 'AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA' ? 'success' : 'needs_fix',
      authUrl: authData.authUrl,
      clientId: clientId
    };
    
  } catch (error) {
    console.log('Error testing correct Client ID:', error.message);
    return null;
  }
};

// Wait for server to start, then test
setTimeout(testCorrectClientId, 3000);