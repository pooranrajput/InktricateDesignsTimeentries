// Debug the actual request being made when Connect QuickBooks is clicked

import fetch from 'node-fetch';

const debugActualRequest = async () => {
  console.log('DEBUGGING ACTUAL CONNECT QUICKBOOKS REQUEST...');
  
  try {
    // Generate the URL that's actually being used
    const response = await fetch('http://localhost:5000/api/quickbooks/auth');
    const data = await response.json();
    
    console.log('ACTUAL OAUTH URL BEING GENERATED:');
    console.log(data.authUrl);
    console.log('');
    
    // Parse the URL to check parameters
    const url = new URL(data.authUrl);
    console.log('URL BREAKDOWN:');
    console.log('Base URL:', url.origin + url.pathname);
    console.log('Parameters:');
    
    for (const [key, value] of url.searchParams.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    console.log('');
    
    // Check for sandbox indicators
    const hasSandboxParam = url.searchParams.has('sandbox');
    const sandboxValue = url.searchParams.get('sandbox');
    
    console.log('SANDBOX CHECK:');
    console.log('Has sandbox parameter:', hasSandboxParam);
    console.log('Sandbox value:', sandboxValue);
    
    // Check if using production base URL
    const isProductionURL = url.hostname === 'appcenter.intuit.com';
    console.log('Using production URL:', isProductionURL);
    
    console.log('');
    console.log('DIAGNOSIS:');
    
    if (isProductionURL && sandboxValue === 'false') {
      console.log('✅ URL is correctly configured for production');
    } else if (!isProductionURL) {
      console.log('❌ URL is using sandbox base URL');
    } else if (sandboxValue !== 'false') {
      console.log('❌ Sandbox parameter not set to false');
    }
    
    console.log('');
    console.log('COPY THIS URL AND OPEN IN BROWSER:');
    console.log(data.authUrl);
    
  } catch (error) {
    console.log('Error:', error.message);
  }
};

debugActualRequest();