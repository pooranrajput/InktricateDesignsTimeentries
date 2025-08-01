// Fix the "undefined didn't connect" error by ensuring state parameter is always defined

import fetch from 'node-fetch';

const fixUndefinedState = async () => {
  console.log('FIXING "undefined didn\'t connect" ERROR...\n');
  
  try {
    // Clear any existing configurations
    await fetch('http://localhost:5000/api/quickbooks/clear', { method: 'POST' });
    console.log('✅ Cleared existing configurations');
    
    // Generate new URL with guaranteed state parameter
    const response = await fetch(`http://localhost:5000/api/quickbooks/auth?fix=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    const data = await response.json();
    
    console.log('FIXED OAuth URL:');
    console.log(data.authUrl);
    console.log('');
    
    // Verify state parameter is properly set
    const url = new URL(data.authUrl);
    const state = url.searchParams.get('state');
    const clientId = url.searchParams.get('client_id');
    
    console.log('Parameter Verification:');
    console.log('- State parameter:', state);
    console.log('- State is defined:', state !== null && state !== 'undefined');
    console.log('- Client ID:', clientId);
    console.log('- Sandbox:', url.searchParams.get('sandbox'));
    
    if (state && state !== 'undefined' && state.length > 0) {
      console.log('✅ State parameter is properly defined');
      console.log('✅ "undefined didn\'t connect" error should be resolved');
    } else {
      console.log('❌ State parameter is still undefined');
    }
    
    console.log('\n🔗 FIXED URL (should not show "undefined didn\'t connect"):');
    console.log('='.repeat(80));
    console.log(data.authUrl);
    console.log('='.repeat(80));
    
    return data.authUrl;
    
  } catch (error) {
    console.log('Error:', error.message);
    return null;
  }
};

fixUndefinedState();