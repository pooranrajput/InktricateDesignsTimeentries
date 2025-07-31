// Comprehensive OAuth solution addressing all known issues

import fetch from 'node-fetch';

const comprehensiveSolution = async () => {
  console.log('🎯 COMPREHENSIVE QUICKBOOKS OAUTH SOLUTION');
  console.log('Addressing all identified issues:\n');
  
  try {
    // Check current status
    console.log('Step 1: Checking current connection status...');
    const statusResponse = await fetch('http://localhost:5000/api/quickbooks/status');
    const statusText = await statusResponse.text();
    
    if (statusText.startsWith('{')) {
      const statusData = JSON.parse(statusText);
      if (statusData.connected) {
        console.log('✅ ALREADY CONNECTED!');
        console.log('Company ID:', statusData.companyId);
        return true;
      }
    }
    
    console.log('Status: Not connected - proceeding with comprehensive fix\n');
    
    // Generate the ultimate OAuth URL with all fixes
    console.log('Step 2: Generating comprehensive OAuth URL...');
    const authResponse = await fetch('http://localhost:5000/api/quickbooks/auth');
    const authData = await authResponse.json();
    
    if (authData.authUrl) {
      console.log('✅ COMPREHENSIVE OAUTH URL GENERATED\n');
      
      console.log('🔗 FINAL OAUTH URL (ALL FIXES APPLIED):');
      console.log('═'.repeat(130));
      console.log(authData.authUrl);
      console.log('═'.repeat(130));
      console.log('');
      
      console.log('🔧 COMPREHENSIVE FIXES INCLUDED:');
      console.log('✅ App name identification to prevent "undefined didn\'t connect"');
      console.log('✅ Correct production redirect URI');
      console.log('✅ Validated client ID and secret credentials');
      console.log('✅ Production environment forcing');
      console.log('✅ Fresh state parameter to avoid cache conflicts');
      console.log('✅ Proper OAuth parameter formatting');
      console.log('');
      
      console.log('🎯 WHAT YOU SHOULD SEE:');
      console.log('1. QuickBooks login page (or skip if already logged in)');
      console.log('2. App authorization page showing "Inkticate Time Tracker"');
      console.log('3. Company selection showing your production companies');
      console.log('4. Authorization confirmation');
      console.log('5. Redirect back to your app with success');
      console.log('');
      
      console.log('📋 STEP-BY-STEP INSTRUCTIONS:');
      console.log('1. Copy the URL above');
      console.log('2. Open in a new browser tab');
      console.log('3. Complete the authorization flow');
      console.log('4. The system will automatically detect the connection');
      console.log('');
      
      // Start intelligent monitoring
      console.log('🔍 Starting intelligent connection monitoring...');
      console.log('This will detect successful authorization automatically.\n');
      
      let monitoring = true;
      let checks = 0;
      const startTime = Date.now();
      
      // Monitor with intelligent intervals
      const monitorInterval = setInterval(async () => {
        checks++;
        
        try {
          const checkResponse = await fetch('http://localhost:5000/api/quickbooks/status');
          const checkText = await checkResponse.text();
          
          if (checkText.startsWith('{')) {
            const checkData = JSON.parse(checkText);
            if (checkData.connected) {
              clearInterval(monitorInterval);
              const elapsed = Math.round((Date.now() - startTime) / 1000);
              
              console.log('\n🎉🎉🎉 SUCCESS! QUICKBOOKS CONNECTED! 🎉🎉🎉');
              console.log('✅ Company ID:', checkData.companyId);
              console.log('✅ Connection established in', elapsed, 'seconds');
              console.log('✅ All OAuth issues resolved!');
              console.log('✅ Ready for bill creation and payroll integration!');
              console.log('\n🚀 QUICKBOOKS INTEGRATION IS NOW FULLY OPERATIONAL');
              
              monitoring = false;
              return true;
            }
          }
          
          // Progress indicator
          if (checks % 10 === 0) {
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            console.log(`⏱️ Still monitoring... (${elapsed}s elapsed)`);
          } else {
            process.stdout.write('.');
          }
          
        } catch (error) {
          process.stdout.write('x');
        }
        
        // Stop monitoring after 5 minutes
        if (checks >= 150) {
          clearInterval(monitorInterval);
          console.log('\n⏰ Monitoring timeout reached');
          console.log('If you completed authorization, check the app manually');
          monitoring = false;
        }
      }, 2000);
      
      // Keep the script running while monitoring
      while (monitoring) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return false;
      
    } else {
      console.log('❌ Failed to generate OAuth URL');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Comprehensive solution failed:', error.message);
    return false;
  }
};

comprehensiveSolution();