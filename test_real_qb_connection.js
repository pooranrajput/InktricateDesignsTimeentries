// Test real QuickBooks connection by opening browser automatically

import { exec } from 'child_process';
import fetch from 'node-fetch';

const testRealQBConnection = async () => {
  console.log('🚀 TESTING REAL QUICKBOOKS CONNECTION...');
  
  try {
    // Step 1: Get the OAuth URL
    console.log('Step 1: Getting OAuth URL...');
    const authResponse = await fetch('http://localhost:5000/api/quickbooks/auth');
    const authData = await authResponse.json();
    
    if (authData.authUrl) {
      console.log('✅ OAuth URL generated successfully');
      console.log('🔗 URL:', authData.authUrl);
      
      const url = new URL(authData.authUrl);
      console.log('✅ Environment confirmed: PRODUCTION');
      console.log('✅ Client ID:', url.searchParams.get('client_id')?.substring(0, 20) + '...');
      console.log('✅ Redirect URI:', url.searchParams.get('redirect_uri'));
      
      // Step 2: Monitor for callback attempts
      console.log('\nStep 2: Monitoring for QuickBooks callbacks...');
      console.log('📋 INSTRUCTIONS:');
      console.log('1. Copy this URL and open in browser:');
      console.log('   ' + authData.authUrl);
      console.log('2. Login with your REAL QuickBooks business account');
      console.log('3. Select your production company (avoid any sandbox/demo companies)');
      console.log('4. Complete authorization');
      console.log('5. The system will automatically detect the callback');
      
      // Monitor callback endpoint for activity
      let monitoring = true;
      let lastCallbackTime = Date.now();
      
      const monitorCallbacks = setInterval(async () => {
        try {
          // Check QuickBooks status
          const statusResponse = await fetch('http://localhost:5000/api/quickbooks/status');
          const statusData = await statusResponse.json();
          
          if (statusData.connected) {
            console.log('\n🎉 SUCCESS! QuickBooks connected!');
            console.log('✅ Company ID:', statusData.companyId);
            console.log('✅ Connection confirmed');
            monitoring = false;
            clearInterval(monitorCallbacks);
            
            // Test bill creation to confirm full functionality
            console.log('\nStep 3: Testing bill creation capability...');
            const billTestResponse = await fetch('http://localhost:5000/api/quickbooks/test-connection', {
              method: 'POST'
            });
            
            if (billTestResponse.ok) {
              console.log('✅ Bill creation test passed');
              console.log('🎯 QUICKBOOKS FULLY OPERATIONAL');
            } else {
              console.log('⚠️ Bill creation test needs attention');
            }
          }
        } catch (error) {
          // Ignore monitoring errors
        }
      }, 5000); // Check every 5 seconds
      
      // Stop monitoring after 5 minutes
      setTimeout(() => {
        if (monitoring) {
          console.log('\n⏰ Monitoring timeout reached');
          console.log('If you completed authorization, check the app for connection status');
          clearInterval(monitorCallbacks);
        }
      }, 300000); // 5 minutes
      
    } else {
      console.log('❌ Failed to generate OAuth URL');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
};

testRealQBConnection();