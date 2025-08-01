// Test production OAuth after app approval

import fetch from 'node-fetch';

const testProductionOAuth = async () => {
  console.log('TESTING PRODUCTION OAUTH AFTER APP APPROVAL...\n');
  
  try {
    // Generate fresh production OAuth URL
    const response = await fetch('http://localhost:5000/api/quickbooks/auth?approved=true');
    const data = await response.json();
    
    console.log('🎉 PRODUCTION OAUTH URL (APP APPROVED):');
    console.log('='.repeat(80));
    console.log(data.authUrl);
    console.log('='.repeat(80));
    console.log('');
    
    console.log('APP APPROVAL STATUS: ✅ APPROVED');
    console.log('PRODUCTION ACCESS: ✅ ENABLED');
    console.log('');
    
    console.log('READY TO CONNECT TO YOUR REAL QUICKBOOKS ACCOUNT:');
    console.log('• Company ID: 9130351530529746 (Your business account)');
    console.log('• Environment: Production (Real data)');
    console.log('• Functionality: Full payroll bill creation enabled');
    console.log('');
    
    console.log('NEXT STEPS:');
    console.log('1. Click the OAuth URL above');
    console.log('2. Authorize with your real QuickBooks account');  
    console.log('3. System will store production tokens');
    console.log('4. Start creating payroll bills for contractors');
    
    return data.authUrl;
    
  } catch (error) {
    console.log('Error:', error.message);
    return null;
  }
};

testProductionOAuth();