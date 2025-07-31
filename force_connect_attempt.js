// Force a connection attempt by opening the OAuth URL

import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const forceConnect = async () => {
  console.log('🚀 FORCING QUICKBOOKS CONNECTION ATTEMPT...');
  
  try {
    // Generate OAuth URL
    console.log('Generating OAuth URL...');
    const authResponse = await fetch('http://localhost:5000/api/quickbooks/auth');
    const authData = await authResponse.json();
    
    if (authData.authUrl) {
      console.log('✅ OAuth URL generated');
      console.log('🔗 URL:', authData.authUrl);
      
      // Since you're logged into QuickBooks, this URL should work
      console.log('\n📋 ACTION REQUIRED:');
      console.log('1. Copy this URL and open in your browser:');
      console.log('   ' + authData.authUrl);
      console.log('2. Since you are already logged into QuickBooks,');
      console.log('   it should immediately show your company selection');
      console.log('3. Select your production company and authorize');
      console.log('');
      
      // Monitor for connection
      console.log('Monitoring for connection...');
      let attempts = 0;
      while (attempts < 30) { // Monitor for 1 minute
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        
        try {
          const statusResponse = await fetch('http://localhost:5000/api/quickbooks/status');
          const statusText = await statusResponse.text();
          
          if (statusText.startsWith('{')) {
            const statusData = JSON.parse(statusText);
            if (statusData.connected) {
              console.log('\n🎉 SUCCESS! QUICKBOOKS CONNECTED!');
              console.log('Company ID:', statusData.companyId);
              console.log('Connection time:', new Date().toISOString());
              return true;
            }
          }
        } catch (e) {
          // Continue monitoring
        }
        
        if (attempts % 5 === 0) {
          console.log(`Still monitoring... (${attempts * 2} seconds elapsed)`);
        }
      }
      
      console.log('\n⏰ Monitoring timeout');
      console.log('If you completed authorization, check the app manually');
      
    } else {
      console.log('❌ Failed to generate OAuth URL');
    }
    
  } catch (error) {
    console.log('❌ Force connect failed:', error.message);
  }
  
  // Final status check
  console.log('\nFinal connection check...');
  try {
    const finalResponse = await fetch('http://localhost:5000/api/quickbooks/status');
    const finalText = await finalResponse.text();
    
    if (finalText.startsWith('{')) {
      const finalData = JSON.parse(finalText);
      if (finalData.connected) {
        console.log('✅ FINAL RESULT: CONNECTED');
        return true;
      }
    }
    console.log('❌ FINAL RESULT: NOT CONNECTED');
  } catch (e) {
    console.log('❌ Final check failed');
  }
  
  return false;
};

forceConnect();