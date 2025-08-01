// Test direct URL generation bypassing all caches

import fetch from 'node-fetch';

const testDirectUrl = async () => {
  console.log('TESTING DIRECT URL GENERATION...\n');
  
  try {
    console.log('Environment Check:');
    console.log('QUICKBOOKS_CLIENT_ID exists:', !!process.env.QUICKBOOKS_CLIENT_ID);
    console.log('QUICKBOOKS_CLIENT_SECRET exists:', !!process.env.QUICKBOOKS_CLIENT_SECRET);
    console.log('QUICKBOOKS_SANDBOX:', process.env.QUICKBOOKS_SANDBOX);
    console.log('');
    
    // Test 1: Clear all configurations
    console.log('1. Clearing all QuickBooks configurations...');
    await fetch('http://localhost:5000/api/quickbooks/clear', { method: 'POST' });
    
    // Test 2: Generate fresh URL with multiple cache-busting parameters
    console.log('2. Generating completely fresh URL...');
    const timestamp = Date.now();
    const response = await fetch(`http://localhost:5000/api/quickbooks/auth?bypass=${timestamp}&fresh=true&nocache=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    const data = await response.json();
    
    console.log('3. URL Analysis:');
    console.log('Full URL:', data.authUrl);
    console.log('');
    
    const url = new URL(data.authUrl);
    console.log('URL Components:');
    console.log('- Client ID:', url.searchParams.get('client_id'));
    console.log('- Redirect URI:', url.searchParams.get('redirect_uri'));
    console.log('- Sandbox:', url.searchParams.get('sandbox'));
    console.log('- State:', url.searchParams.get('state'));
    console.log('- Scope:', url.searchParams.get('scope'));
    console.log('');
    
    // Verify production credentials
    const clientId = url.searchParams.get('client_id');
    const redirectUri = url.searchParams.get('redirect_uri');
    const sandbox = url.searchParams.get('sandbox');
    
    console.log('4. Verification:');
    
    if (clientId === 'AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA') {
      console.log('✅ Client ID is CORRECT production ID');
    } else {
      console.log('❌ Client ID is WRONG:', clientId);
      console.log('Expected: AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA');
    }
    
    if (redirectUri === 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback') {
      console.log('✅ Redirect URI is CORRECT');
    } else {
      console.log('❌ Redirect URI is WRONG:', redirectUri);
    }
    
    if (sandbox === 'false') {
      console.log('✅ Sandbox parameter is CORRECT (false)');
    } else {
      console.log('❌ Sandbox parameter is WRONG:', sandbox);
    }
    
    console.log('');
    console.log('5. FINAL TEST URL (copy and use directly):');
    console.log('='.repeat(80));
    console.log(data.authUrl);
    console.log('='.repeat(80));
    
    if (clientId === 'AB6HieH2iCWWSQ8jneSCittfIAKuPHIcujzio09raTAQV5EUtA' && 
        redirectUri === 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback' &&
        sandbox === 'false') {
      console.log('');
      console.log('✅ ALL PARAMETERS CORRECT - This URL should work!');
      console.log('Copy the URL above and paste it in your browser');
    } else {
      console.log('');
      console.log('❌ Parameters still incorrect - investigating further...');
    }
    
  } catch (error) {
    console.log('Error:', error.message);
  }
};

testDirectUrl();