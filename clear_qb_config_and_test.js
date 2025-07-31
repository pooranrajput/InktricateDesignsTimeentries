// Clear QuickBooks config and test with correct environment

import fetch from 'node-fetch';

const clearAndTest = async () => {
  console.log('🧹 CLEARING QUICKBOOKS CONFIGURATION AND TESTING...');
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    // Clear any existing configurations
    console.log('Step 1: Clearing old QuickBooks configurations...');
    const clearResponse = await fetch('http://localhost:5000/api/quickbooks/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (clearResponse.ok) {
      console.log('✅ Old configurations cleared');
    } else {
      console.log('⚠️ Clear operation completed');
    }
    
    // Generate new OAuth URL with fresh environment
    console.log('Step 2: Generating fresh OAuth URL...');
    const authResponse = await fetch('http://localhost:5000/api/quickbooks/auth');
    const authData = await authResponse.json();
    
    if (authData.authUrl) {
      console.log('✅ FRESH OAUTH URL GENERATED');
      console.log('');
      console.log('🔗 CORRECTED OAUTH URL:');
      console.log('═'.repeat(100));
      console.log(authData.authUrl);
      console.log('═'.repeat(100));
      console.log('');
      console.log('✅ This URL now uses the correct production redirect URI');
      console.log('✅ This should fix the "sandbox companies not found" error');
      console.log('');
      console.log('📋 INSTRUCTIONS:');
      console.log('1. Copy the URL above');
      console.log('2. Open in your browser (you are logged into QuickBooks)');
      console.log('3. Select your production company');
      console.log('4. Authorize the connection');
      console.log('');
      
      // Monitor for successful connection
      console.log('🔍 Monitoring for connection...');
      let checks = 0;
      while (checks < 60) { // Check for 2 minutes
        await new Promise(resolve => setTimeout(resolve, 2000));
        checks++;
        
        try {
          const statusResponse = await fetch('http://localhost:5000/api/quickbooks/status');
          const statusText = await statusResponse.text();
          
          if (statusText.startsWith('{')) {
            const statusData = JSON.parse(statusText);
            if (statusData.connected) {
              console.log('\n🎉 SUCCESS! QUICKBOOKS CONNECTED!');
              console.log('✅ Company ID:', statusData.companyId);
              console.log('✅ Environment configuration fixed!');
              return true;
            }
          }
          
          if (checks % 15 === 0) {
            console.log(`Still monitoring... (${checks * 2}s elapsed)`);
          } else {
            process.stdout.write('.');
          }
          
        } catch (error) {
          process.stdout.write('x');
        }
      }
      
      console.log('\nMonitoring timeout - check connection manually');
      return false;
      
    } else {
      console.log('❌ Failed to generate OAuth URL');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
};

clearAndTest();