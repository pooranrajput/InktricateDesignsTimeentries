// Automated testing of QuickBooks OAuth until it works

const testOAuth = async () => {
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\n🔄 ATTEMPT ${attempts}: Testing QuickBooks OAuth...`);
    
    try {
      // Get OAuth URL
      const authResponse = await fetch('http://localhost:5000/api/quickbooks/auth');
      const authData = await authResponse.json();
      
      console.log('OAuth URL Status:', authResponse.status);
      
      if (authData.authUrl) {
        const url = new URL(authData.authUrl);
        const params = Object.fromEntries(url.searchParams);
        
        console.log('🔍 OAuth URL Analysis:');
        console.log('- Base URL:', url.origin + url.pathname);
        console.log('- Client ID:', params.client_id?.substring(0, 20) + '...');
        console.log('- Redirect URI:', params.redirect_uri);
        console.log('- Realm ID:', params.realmId || 'Not specified');
        
        // Check if URL points to production or sandbox
        const isProduction = url.origin === 'https://appcenter.intuit.com';
        console.log('- Environment:', isProduction ? 'PRODUCTION ✅' : 'SANDBOX ❌');
        
        if (!isProduction) {
          console.log('❌ STILL USING SANDBOX ENDPOINT!');
          console.log('Expected: https://appcenter.intuit.com');
          console.log('Actual:', url.origin);
        } else {
          console.log('✅ PRODUCTION ENDPOINT CONFIRMED');
        }
        
        // Test if the URL is accessible
        try {
          const testResponse = await fetch(authData.authUrl.substring(0, 100), { 
            method: 'HEAD',
            redirect: 'manual'
          });
          console.log('- URL Accessibility:', testResponse.status < 400 ? 'ACCESSIBLE ✅' : 'ERROR ❌');
        } catch (e) {
          console.log('- URL Test Error:', e.message);
        }
      }
      
      // Wait before next attempt
      if (attempts < maxAttempts) {
        console.log(`Waiting 2 seconds before attempt ${attempts + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.log('❌ OAuth test failed:', error.message);
    }
  }
  
  console.log('\n🏁 OAuth testing completed');
};

testOAuth();