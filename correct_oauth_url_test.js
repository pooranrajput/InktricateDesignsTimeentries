// Generate the correct OAuth URL without the problematic sandbox parameter

import fetch from 'node-fetch';

const generateCorrectOAuthUrl = async () => {
  console.log('GENERATING CORRECT OAUTH URL (without sandbox parameter)...\n');
  
  try {
    // Clear existing configurations
    await fetch('http://localhost:5000/api/quickbooks/clear', { method: 'POST' });
    
    // Generate new URL using the fixed endpoint
    const response = await fetch(`http://localhost:5000/api/quickbooks/auth?corrected=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    const data = await response.json();
    
    console.log('CORRECTED OAuth URL:');
    console.log('='.repeat(80));
    console.log(data.authUrl);
    console.log('='.repeat(80));
    console.log('');
    
    // Verify the URL structure
    const url = new URL(data.authUrl);
    console.log('URL Parameters:');
    console.log('- Client ID:', url.searchParams.get('client_id'));
    console.log('- Scope:', url.searchParams.get('scope'));
    console.log('- Redirect URI:', url.searchParams.get('redirect_uri'));
    console.log('- Response Type:', url.searchParams.get('response_type'));
    console.log('- State:', url.searchParams.get('state'));
    console.log('- Sandbox Parameter:', url.searchParams.get('sandbox') || 'NOT PRESENT (CORRECT!)');
    
    console.log('\n✅ KEY FIX APPLIED:');
    console.log('- Removed sandbox parameter from OAuth URL');
    console.log('- QuickBooks OAuth 2.0 doesn\'t use sandbox parameter in authorization URL');
    console.log('- Sandbox vs Production is determined by Client ID and API endpoints, not URL parameter');
    
    console.log('\n📋 THIS SHOULD RESOLVE:');
    console.log('- "undefined didn\'t connect" error');
    console.log('- QuickBooks OAuth parameter confusion');
    console.log('- App recognition issues');
    
    return data.authUrl;
    
  } catch (error) {
    console.log('Error:', error.message);
    return null;
  }
};

generateCorrectOAuthUrl();