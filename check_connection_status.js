// Direct check of QuickBooks connection status

import fetch from 'node-fetch';

const checkStatus = async () => {
  console.log('🔍 CHECKING QUICKBOOKS CONNECTION STATUS...');
  
  try {
    const response = await fetch('http://localhost:5000/api/quickbooks/status');
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body type:', typeof text);
    console.log('Body starts with:', text.substring(0, 100));
    
    if (text.startsWith('{')) {
      const data = JSON.parse(text);
      console.log('✅ JSON response received');
      console.log('Connected:', data.connected);
      if (data.connected) {
        console.log('Company ID:', data.companyId);
        console.log('✅ QUICKBOOKS IS CONNECTED!');
        return true;
      } else {
        console.log('❌ QuickBooks not connected');
        return false;
      }
    } else {
      console.log('❌ HTML response received (not connected)');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Status check failed:', error.message);
    return false;
  }
};

checkStatus();