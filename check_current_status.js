// Quick check of current connection status

import fetch from 'node-fetch';

const checkStatus = async () => {
  console.log('Checking QuickBooks connection status...');
  
  try {
    const response = await fetch('http://localhost:5000/api/quickbooks/status');
    const text = await response.text();
    
    if (text.startsWith('{')) {
      const data = JSON.parse(text);
      if (data.connected) {
        console.log('✅ CONNECTED!');
        console.log('Company ID:', data.companyId);
        return true;
      } else {
        console.log('❌ Not connected');
        return false;
      }
    } else {
      console.log('❌ Not connected (HTML response)');
      return false;
    }
  } catch (error) {
    console.log('Error checking status:', error.message);
    return false;
  }
};

checkStatus();