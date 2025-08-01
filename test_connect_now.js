// Test the Connect QuickBooks with latest fixes

import fetch from 'node-fetch';

const testConnectNow = async () => {
  console.log('TESTING CONNECT QUICKBOOKS WITH LATEST FIXES...');
  
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    // Get the actual OAuth URL being generated
    const response = await fetch('http://localhost:5000/api/quickbooks/auth');
    const data = await response.json();
    
    console.log('CURRENT OAUTH URL:');
    console.log(data.authUrl);
    console.log('');
    
    // Check if sandbox parameter is present
    const url = new URL(data.authUrl);
    const sandboxParam = url.searchParams.get('sandbox');
    
    console.log('SANDBOX PARAMETER CHECK:');
    console.log('sandbox parameter value:', sandboxParam);
    
    if (sandboxParam === 'false') {
      console.log('✅ SANDBOX PARAMETER CORRECTLY SET TO FALSE');
    } else {
      console.log('❌ SANDBOX PARAMETER MISSING OR INCORRECT');
      console.log('Adding sandbox=false parameter manually...');
      
      // Add the sandbox parameter
      url.searchParams.set('sandbox', 'false');
      const fixedUrl = url.toString();
      
      console.log('');
      console.log('FIXED OAUTH URL:');
      console.log(fixedUrl);
      console.log('');
      console.log('USE THIS CORRECTED URL:');
      console.log(fixedUrl);
      
      return fixedUrl;
    }
    
    console.log('');
    console.log('CURRENT URL IS CORRECT - USE THIS:');
    console.log(data.authUrl);
    
    return data.authUrl;
    
  } catch (error) {
    console.log('Error testing connection:', error.message);
    return null;
  }
};

testConnectNow();