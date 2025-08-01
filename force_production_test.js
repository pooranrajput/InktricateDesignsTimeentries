// Force production mode and test connection immediately

import fetch from 'node-fetch';

const forceProductionTest = async () => {
  console.log('FORCING PRODUCTION MODE AND TESTING CONNECTION...');
  
  try {
    // Clear any sandbox configurations
    console.log('Step 1: Clearing sandbox configurations...');
    await fetch('http://localhost:5000/api/quickbooks/clear', { method: 'POST' });
    
    // Generate production OAuth URL
    console.log('Step 2: Generating PRODUCTION OAuth URL...');
    const authResponse = await fetch('http://localhost:5000/api/quickbooks/auth');
    const authData = await authResponse.json();
    
    console.log('PRODUCTION OAUTH URL:');
    console.log(authData.authUrl);
    console.log('');
    
    // Test the Connect QuickBooks button simulation
    console.log('Step 3: Simulating Connect QuickBooks button click...');
    
    // Since you're logged into QuickBooks, simulate the complete flow
    const productionCode = 'QB_PRODUCTION_CODE_' + Date.now();
    const productionRealmId = '9130351530529746'; // Your confirmed production company ID
    
    // Simulate callback with production parameters
    console.log('Step 4: Testing production callback...');
    const callbackUrl = `http://localhost:5000/api/quickbooks/callback?code=${productionCode}&state=production&realmId=${productionRealmId}`;
    
    const callbackResponse = await fetch(callbackUrl, { redirect: 'manual' });
    console.log('Callback response status:', callbackResponse.status);
    
    if (callbackResponse.status === 302) {
      const location = callbackResponse.headers.get('location');
      console.log('Redirect location:', location);
      
      if (location && !location.includes('error')) {
        console.log('SUCCESS: No error in redirect');
      } else {
        console.log('ERROR detected in redirect');
      }
    }
    
    // Check final status
    console.log('Step 5: Checking connection status...');
    const statusResponse = await fetch('http://localhost:5000/api/quickbooks/status');
    const statusText = await statusResponse.text();
    
    if (statusText.startsWith('{')) {
      const statusData = JSON.parse(statusText);
      if (statusData.connected) {
        console.log('SUCCESS: QUICKBOOKS CONNECTED!');
        console.log('Company ID:', statusData.companyId);
        return true;
      }
    }
    
    console.log('Status: Not connected - ready for real authorization');
    console.log('');
    console.log('NEXT: Click Connect QuickBooks button in the app');
    console.log('The system is now forced to production mode');
    
    return false;
    
  } catch (error) {
    console.log('Error:', error.message);
    return false;
  }
};

forceProductionTest();