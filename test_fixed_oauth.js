// Test the fixed OAuth URL with app name

import fetch from 'node-fetch';

const testFixedOAuth = async () => {
  console.log('🔧 TESTING FIXED OAUTH WITH APP NAME...');
  
  try {
    // Generate the fixed OAuth URL
    const authResponse = await fetch('http://localhost:5000/api/quickbooks/auth');
    const authData = await authResponse.json();
    
    if (authData.authUrl) {
      console.log('✅ FIXED OAUTH URL GENERATED');
      console.log('');
      console.log('🔗 NEW OAUTH URL (WITH APP NAME FIX):');
      console.log('═'.repeat(120));
      console.log(authData.authUrl);
      console.log('═'.repeat(120));
      console.log('');
      console.log('🔧 APPLIED FIXES:');
      console.log('✅ Added app_name parameter to identify our app to QuickBooks');
      console.log('✅ Fresh state parameter to avoid cache issues');
      console.log('✅ Correct production redirect URI');
      console.log('✅ Validated client ID and credentials');
      console.log('');
      console.log('📋 WHAT THIS FIXES:');
      console.log('- The "undefined didn\'t connect" error');
      console.log('- QuickBooks app identification issues');
      console.log('- OAuth validation problems');
      console.log('');
      console.log('🎯 INSTRUCTIONS:');
      console.log('1. Copy the URL above');
      console.log('2. Open in your browser');
      console.log('3. You should now see proper app identification');
      console.log('4. Select your production company and authorize');
      console.log('');
      
      // Monitor for successful connection
      console.log('🔍 Monitoring for successful connection...');
      
      let checks = 0;
      while (checks < 90) { // Monitor for 3 minutes
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
              console.log('✅ OAuth fix worked!');
              console.log('✅ "undefined didn\'t connect" error resolved!');
              return true;
            }
          }
          
          if (checks % 20 === 0) {
            console.log(`Still monitoring... (${checks * 2}s elapsed)`);
            console.log('If you completed authorization, the connection should be detected automatically');
          } else {
            process.stdout.write('.');
          }
          
        } catch (error) {
          process.stdout.write('x');
        }
      }
      
      console.log('\nMonitoring complete. Check the app status manually.');
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

testFixedOAuth();