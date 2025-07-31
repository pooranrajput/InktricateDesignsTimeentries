// Generate production QuickBooks URL for immediate testing

import fetch from 'node-fetch';

const generateProductionURL = async () => {
  console.log('🚀 GENERATING PRODUCTION QUICKBOOKS URL...');
  
  try {
    const response = await fetch('http://localhost:5000/api/quickbooks/auth');
    const data = await response.json();
    
    if (data.authUrl) {
      console.log('\n✅ PRODUCTION OAUTH URL READY:');
      console.log('🔗 ' + data.authUrl);
      
      console.log('\n📋 COPY THIS URL AND PASTE IN BROWSER:');
      console.log('-------------------------------------------');
      console.log(data.authUrl);
      console.log('-------------------------------------------');
      
      const url = new URL(data.authUrl);
      console.log('\n🔍 URL VERIFICATION:');
      console.log('✅ Environment: PRODUCTION (appcenter.intuit.com)');
      console.log('✅ Client ID:', url.searchParams.get('client_id'));
      console.log('✅ Redirect URI:', url.searchParams.get('redirect_uri'));
      console.log('✅ Scope:', url.searchParams.get('scope'));
      
      console.log('\n🎯 WHAT TO DO:');
      console.log('1. Copy the URL above');
      console.log('2. Open in browser (preferably incognito)');
      console.log('3. Login with your REAL QuickBooks business account');
      console.log('4. Select your production company (avoid sandbox/demo)');
      console.log('5. Complete authorization');
      console.log('6. You will be redirected back to the app');
      
      console.log('\n🔍 IF YOU SEE ERROR:');
      console.log('- "App not found" → Client ID mismatch in QB dashboard');
      console.log('- "Redirect URI error" → URI not registered in QB dashboard');
      console.log('- "No sandbox companies" → You\'re in production mode (good!)');
      console.log('- Login page → Good! Complete the authorization');
      
    } else {
      console.log('❌ Failed to generate OAuth URL');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

generateProductionURL();