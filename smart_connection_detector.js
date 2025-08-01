// Smart connection detector - detects real QuickBooks connections

import fetch from 'node-fetch';

const smartDetector = async () => {
  console.log('🎯 SMART QUICKBOOKS CONNECTION DETECTOR ACTIVE');
  
  // Generate the OAuth URL you need to use
  const authResponse = await fetch('http://localhost:5000/api/quickbooks/auth');
  const authData = await authResponse.json();
  
  console.log('\n📋 QUICK SETUP INSTRUCTIONS:');
  console.log('1. Copy this URL: ' + authData.authUrl);
  console.log('2. Open in browser (you are already logged into QuickBooks)');
  console.log('3. Select your production company and authorize');
  console.log('4. System will automatically detect successful connection');
  
  console.log('\n🔍 Monitoring for connection...');
  
  let checks = 0;
  while (checks < 100) { // Check for 200 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    checks++;
    
    try {
      const statusResponse = await fetch('http://localhost:5000/api/quickbooks/status');
      const statusText = await statusResponse.text();
      
      if (statusText.startsWith('{')) {
        const statusData = JSON.parse(statusText);
        if (statusData.connected) {
          console.log('\n🎉 CONNECTION SUCCESSFUL!');
          console.log('Company ID:', statusData.companyId);
          console.log('Status: CONNECTED');
          return true;
        }
      }
      
      if (checks % 10 === 0) {
        console.log(`Still waiting... (${checks * 2}s)`);
      } else {
        process.stdout.write('.');
      }
      
    } catch (error) {
      process.stdout.write('x');
    }
  }
  
  console.log('\nTimeout reached. Check connection manually.');
  return false;
};

smartDetector();