// Test QuickBooks OAuth with approved app

import fetch from 'node-fetch';

const testApprovedOAuth = async () => {
  console.log('🎉 TESTING APPROVED QUICKBOOKS APP...\n');
  
  try {
    // Clear any existing configs and generate fresh OAuth URL
    await fetch('http://localhost:5000/api/quickbooks/clear', { method: 'POST' });
    
    const response = await fetch('http://localhost:5000/api/quickbooks/auth');
    const data = await response.json();
    
    console.log('PRODUCTION OAUTH URL (APP APPROVED):');
    console.log('='.repeat(80));
    console.log(data.authUrl);
    console.log('='.repeat(80));
    console.log('');
    
    console.log('APP STATUS: ✅ APPROVED BY QUICKBOOKS');
    console.log('EXPECTED BEHAVIOR: OAuth should work without "undefined didn\'t connect" error');
    console.log('');
    
    console.log('IMPORTANT INSTRUCTIONS:');
    console.log('1. Open the URL above in a NEW browser tab');
    console.log('2. Sign in to QuickBooks with your business account');
    console.log('3. SELECT YOUR PRODUCTION COMPANY: ID 9130351530529746');
    console.log('4. Complete the authorization process');
    console.log('5. You should be redirected back successfully');
    console.log('');
    
    console.log('WHAT SUCCESS LOOKS LIKE:');
    console.log('• No "undefined didn\'t connect" error');
    console.log('• Successful authorization with your real business account');
    console.log('• System stores production OAuth tokens');
    console.log('• Ready to create payroll bills for contractors');
    
    return data.authUrl;
    
  } catch (error) {
    console.log('Error:', error.message);
    return null;
  }
};

testApprovedOAuth();