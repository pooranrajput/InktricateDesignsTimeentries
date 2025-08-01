// Test the Connect QuickBooks button API endpoint directly

const testButtonAPI = async () => {
  console.log('🔍 Testing "Connect to QuickBooks" Button API...\n');
  
  try {
    // Test the exact API call the button makes
    const response = await fetch('http://localhost:5000/api/quickbooks/auth?fresh=' + Date.now(), {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response Data:', data);
      
      if (data.authUrl) {
        console.log('\n🎯 SUCCESS: API returns OAuth URL');
        console.log('🔗 OAuth URL:', data.authUrl);
        
        // Verify it's the correct URL
        if (data.authUrl.includes('AB6HieH2iCWWSQ8jneSCIctfIAKuPHIcujzio09raTAQV5EUtA')) {
          console.log('✅ URL contains correct Client ID');
        } else {
          console.log('❌ URL contains wrong Client ID');
        }
        
        console.log('\n📝 CONCLUSION:');
        console.log('The API endpoint works correctly.');
        console.log('The "Connect to QuickBooks" button should work.');
        console.log('If it doesn\'t work in the browser, check:');
        console.log('1. Browser console for JavaScript errors');
        console.log('2. Network tab for failed requests');
        console.log('3. Authentication state (admin login required)');
        
      } else {
        console.log('❌ No authUrl in response');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
};

testButtonAPI();