// Generate OAuth URL with debug logging enabled

import fetch from 'node-fetch';

const generateDebugOAuthUrl = async () => {
  console.log('GENERATING DEBUG OAUTH URL WITH ENHANCED ERROR LOGGING...\n');
  
  try {
    // Clear configurations
    await fetch('http://localhost:5000/api/quickbooks/clear', { method: 'POST' });
    
    // Generate fresh URL
    const response = await fetch('http://localhost:5000/api/quickbooks/auth?debug=callback');
    const data = await response.json();
    
    console.log('DEBUG OAUTH URL WITH ENHANCED CALLBACK LOGGING:');
    console.log('='.repeat(80));
    console.log(data.authUrl);
    console.log('='.repeat(80));
    
    console.log('\nDEBUG FEATURES ENABLED:');
    console.log('✅ Enhanced error logging in callback');
    console.log('✅ Request parameter logging');
    console.log('✅ Token exchange error details');
    console.log('✅ Database operation logging');
    
    console.log('\nIMPORTANT:');
    console.log('- Use this URL in a NEW browser tab');
    console.log('- Watch the server console for detailed error logs');
    console.log('- Complete authorization quickly (codes expire fast)');
    
    return data.authUrl;
    
  } catch (error) {
    console.log('Error:', error.message);
  }
};

generateDebugOAuthUrl();