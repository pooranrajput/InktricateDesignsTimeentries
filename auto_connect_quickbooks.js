// Auto-monitor for QuickBooks connection attempts

import fetch from 'node-fetch';

const autoConnectQuickBooks = async () => {
  console.log('AUTO-MONITORING QUICKBOOKS CONNECTION...');
  console.log('Production mode forced at all levels.');
  console.log('Ready to detect when you click Connect QuickBooks.\n');
  
  let lastStatusCheck = Date.now();
  let connectionAttempts = 0;
  
  const monitor = setInterval(async () => {
    try {
      // Check connection status
      const statusResponse = await fetch('http://localhost:5000/api/quickbooks/status');
      const statusText = await statusResponse.text();
      
      if (statusText.startsWith('{')) {
        const statusData = JSON.parse(statusText);
        if (statusData.connected) {
          clearInterval(monitor);
          console.log('\n🎉 SUCCESS! QUICKBOOKS CONNECTED!');
          console.log('Company ID:', statusData.companyId);
          console.log('Connection established successfully!');
          process.exit(0);
        }
      }
      
      // Every 10 seconds, show status
      if (Date.now() - lastStatusCheck > 10000) {
        console.log(`Monitoring... (${Math.floor((Date.now() - startTime) / 1000)}s elapsed)`);
        console.log('Click "Connect QuickBooks" button in the app when ready');
        lastStatusCheck = Date.now();
      }
      
    } catch (error) {
      // Connection error - continue monitoring
      process.stdout.write('x');
    }
  }, 1000); // Check every second
  
  const startTime = Date.now();
  
  // Stop monitoring after 10 minutes
  setTimeout(() => {
    clearInterval(monitor);
    console.log('\nMonitoring timeout reached');
    process.exit(1);
  }, 600000);
};

autoConnectQuickBooks();