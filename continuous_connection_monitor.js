// Continuous monitoring for QuickBooks connection

import fetch from 'node-fetch';

const continuousMonitor = async () => {
  console.log('🔄 STARTING CONTINUOUS QUICKBOOKS CONNECTION MONITORING...');
  console.log('This will keep running until connection is established.\n');
  
  let attempts = 0;
  const maxAttempts = 1000; // Run for a very long time
  
  // Generate fresh OAuth URL for user
  try {
    const authResponse = await fetch('http://localhost:5000/api/quickbooks/auth');
    const authData = await authResponse.json();
    
    if (authData.authUrl) {
      console.log('🔗 FRESH OAUTH URL GENERATED:');
      console.log('Copy this URL and complete authorization in your browser:');
      console.log('═'.repeat(80));
      console.log(authData.authUrl);
      console.log('═'.repeat(80));
      console.log('');
      console.log('Since you are logged into QuickBooks, this should work immediately.');
      console.log('Select your production company and authorize the connection.');
      console.log('');
      console.log('Monitoring for connection...');
    }
  } catch (error) {
    console.log('Failed to generate OAuth URL:', error.message);
    return;
  }
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      // Check connection status
      const statusResponse = await fetch('http://localhost:5000/api/quickbooks/status');
      const statusText = await statusResponse.text();
      
      // Check if we got JSON (connected) or HTML (not connected)
      if (statusText.startsWith('{')) {
        const statusData = JSON.parse(statusText);
        
        if (statusData.connected) {
          console.log('\n🎉 SUCCESS! QUICKBOOKS CONNECTED!');
          console.log('✅ Company ID:', statusData.companyId);
          console.log('✅ Connection established at:', new Date().toISOString());
          console.log('✅ Total monitoring time:', Math.round(attempts * 2), 'seconds');
          console.log('');
          console.log('🎯 QUICKBOOKS IS NOW READY FOR BILL CREATION');
          return true;
        }
      }
      
      // Show progress every 30 seconds
      if (attempts % 15 === 0) {
        const minutes = Math.floor(attempts * 2 / 60);
        const seconds = (attempts * 2) % 60;
        console.log(`⏱️ Still monitoring... (${minutes}m ${seconds}s elapsed)`);
        
        // Generate a fresh OAuth URL every 5 minutes in case the old one expired
        if (attempts % 150 === 0) {
          try {
            const freshAuthResponse = await fetch('http://localhost:5000/api/quickbooks/auth');
            const freshAuthData = await freshAuthResponse.json();
            
            if (freshAuthData.authUrl) {
              console.log('🔄 Fresh OAuth URL generated (previous may have expired):');
              console.log(freshAuthData.authUrl);
            }
          } catch (e) {
            // Continue with old URL
          }
        }
      } else {
        process.stdout.write('.');
      }
      
    } catch (error) {
      if (attempts % 15 === 0) {
        console.log('⚠️ Monitoring error:', error.message);
      }
    }
    
    // Wait 2 seconds between checks
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n⏰ Maximum monitoring time reached');
  console.log('Please try the OAuth URL manually if not completed');
  return false;
};

// Start monitoring
continuousMonitor().then(success => {
  if (success) {
    console.log('\n✅ MONITORING COMPLETE - QUICKBOOKS CONNECTED');
    process.exit(0);
  } else {
    console.log('\n❌ MONITORING TIMEOUT - CONNECTION NOT ESTABLISHED');
    process.exit(1);
  }
}).catch(error => {
  console.log('\n❌ MONITORING FAILED:', error.message);
  process.exit(1);
});