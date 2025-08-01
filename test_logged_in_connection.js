// Test QuickBooks connection when user is already logged in

import fetch from 'node-fetch';

const testLoggedInConnection = async () => {
  console.log('🔄 TESTING CONNECTION WITH LOGGED-IN QUICKBOOKS SESSION...');
  
  try {
    // Step 1: Check current status
    console.log('Step 1: Checking current connection status...');
    let statusResponse = await fetch('http://localhost:5000/api/quickbooks/status');
    let statusData;
    
    try {
      statusData = await statusResponse.json();
      if (statusData.connected) {
        console.log('✅ ALREADY CONNECTED!');
        console.log('Company ID:', statusData.companyId);
        return true;
      } else {
        console.log('Status: Not connected, attempting connection...');
      }
    } catch (e) {
      console.log('Status: Checking connection state...');
    }
    
    // Step 2: Trigger OAuth flow (this should use existing browser session)
    console.log('Step 2: Triggering OAuth with existing QuickBooks session...');
    const authResponse = await fetch('http://localhost:5000/api/quickbooks/auth');
    const authData = await authResponse.json();
    
    if (authData.authUrl) {
      console.log('✅ OAuth URL generated');
      console.log('URL:', authData.authUrl);
      
      // Since you're logged in, this URL should work directly
      console.log('\n🎯 SIMULATING USER INTERACTION WITH LOGGED-IN SESSION...');
      console.log('With your existing QB login, this URL should redirect directly');
      
      // Let's monitor for any automatic callback
      console.log('\nMonitoring for automatic connection...');
      
      let checks = 0;
      while (checks < 20) { // Check for 40 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        checks++;
        
        try {
          const checkResponse = await fetch('http://localhost:5000/api/quickbooks/status');
          const checkData = await checkResponse.json();
          
          if (checkData.connected) {
            console.log('\n🎉 CONNECTION SUCCESSFUL!');
            console.log('Company ID:', checkData.companyId);
            console.log('Connected at:', new Date().toISOString());
            return true;
          }
        } catch (e) {
          // Continue checking
        }
        
        process.stdout.write('.');
      }
      
      console.log('\n⏰ No automatic connection detected');
      console.log('The OAuth URL is ready, but requires manual browser interaction');
      
    } else {
      console.log('❌ Failed to generate OAuth URL');
    }
    
    // Final status check
    console.log('\nFinal status check...');
    const finalResponse = await fetch('http://localhost:5000/api/quickbooks/status');
    try {
      const finalData = await finalResponse.json();
      if (finalData.connected) {
        console.log('✅ CONNECTED!');
        return true;
      } else {
        console.log('❌ Not connected');
      }
    } catch (e) {
      console.log('Status check returned non-JSON response');
    }
    
    return false;
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
};

testLoggedInConnection().then(connected => {
  console.log('\n📊 FINAL RESULT:');
  if (connected) {
    console.log('✅ QUICKBOOKS IS CONNECTED TO THE APP');
  } else {
    console.log('❌ QUICKBOOKS IS NOT CONNECTED TO THE APP');
    console.log('Manual authorization still required');
  }
});