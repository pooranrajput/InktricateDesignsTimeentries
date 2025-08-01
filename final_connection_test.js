// Final connection test with monitoring

import fetch from 'node-fetch';

const finalConnectionTest = async () => {
  console.log('🎯 FINAL QUICKBOOKS CONNECTION TEST');
  console.log('OAuth URL now includes sandbox=false parameter');
  console.log('This should resolve the "no sandbox companies found" error\n');
  
  let monitoring = true;
  let startTime = Date.now();
  let lastUpdate = Date.now();
  
  const monitor = setInterval(async () => {
    try {
      const statusResponse = await fetch('http://localhost:5000/api/quickbooks/status');
      const statusText = await statusResponse.text();
      
      if (statusText.startsWith('{')) {
        const statusData = JSON.parse(statusText);
        if (statusData.connected) {
          clearInterval(monitor);
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          
          console.log('\n🎉🎉🎉 SUCCESS! QUICKBOOKS CONNECTED! 🎉🎉🎉');
          console.log('✅ Company ID:', statusData.companyId);
          console.log('✅ Total time:', elapsed, 'seconds');
          console.log('✅ "No sandbox companies found" error RESOLVED!');
          console.log('✅ Production connection established!');
          
          monitoring = false;
          process.exit(0);
        }
      }
      
      // Show progress every 15 seconds
      if (Date.now() - lastUpdate > 15000) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`⏱️ Monitoring... (${elapsed}s elapsed) - Click Connect QuickBooks when ready`);
        lastUpdate = Date.now();
      }
      
    } catch (error) {
      // Continue monitoring
    }
  }, 2000);
  
  // Show initial instructions
  console.log('📋 INSTRUCTIONS:');
  console.log('1. Click "Connect QuickBooks" button in the app');
  console.log('2. You should NOT see "no sandbox companies found" error');
  console.log('3. Select your production company and authorize');
  console.log('4. System will automatically detect successful connection');
  console.log('');
  console.log('🔍 Monitoring for connection...');
  
  // Stop monitoring after 5 minutes
  setTimeout(() => {
    if (monitoring) {
      clearInterval(monitor);
      console.log('\n⏰ Monitoring timeout reached');
      console.log('If you encountered issues, let me know the exact error message');
      process.exit(1);
    }
  }, 300000);
};

finalConnectionTest();