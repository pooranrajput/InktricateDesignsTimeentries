// Check what error occurred in the callback

import fetch from 'node-fetch';

const checkStatus = async () => {
  console.log('CHECKING QUICKBOOKS CONNECTION STATUS...\n');
  
  try {
    // Check current connection status
    const statusResponse = await fetch('http://localhost:5000/api/quickbooks/status');
    const statusText = await statusResponse.text();
    
    console.log('Status Response:', statusText);
    
    if (statusText.startsWith('{')) {
      const statusData = JSON.parse(statusText);
      if (statusData.connected) {
        console.log('✅ CONNECTION SUCCESSFUL!');
        console.log('Company ID:', statusData.companyId);
        return true;
      } else {
        console.log('❌ Still not connected');
        console.log('Details:', statusData);
      }
    }
    
    // If not connected, the callback likely failed during token exchange
    console.log('\nMost likely callback failure points:');
    console.log('1. Token exchange failed - wrong client credentials');
    console.log('2. Authorization code expired (codes expire quickly)');
    console.log('3. Database insertion failed');
    console.log('4. Network timeout during token exchange');
    
    console.log('\nLet\'s get a fresh auth URL and try again:');
    const authResponse = await fetch('http://localhost:5000/api/quickbooks/auth?fresh=retry');
    const authData = await authResponse.json();
    
    console.log('\nFRESH AUTH URL:');
    console.log('='.repeat(80));
    console.log(authData.authUrl);
    console.log('='.repeat(80));
    
    console.log('\nTROUBLESHOoting TIPS:');
    console.log('- Use this URL immediately (auth codes expire quickly)');
    console.log('- Complete the authorization quickly');
    console.log('- Don\'t refresh or navigate away during the process');
    
    return false;
    
  } catch (error) {
    console.log('Error checking status:', error.message);
    return false;
  }
};

checkStatus();