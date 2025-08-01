// Setup production QuickBooks after app approval

import fetch from 'node-fetch';

const setupProductionQuickBooks = async () => {
  console.log('SETTING UP PRODUCTION QUICKBOOKS AFTER APPROVAL...\n');
  
  try {
    // Clear any existing configurations to start fresh
    console.log('1. Clearing existing configurations...');
    await fetch('http://localhost:5000/api/quickbooks/clear', { method: 'POST' });
    
    // Generate production OAuth URL
    console.log('2. Generating production OAuth URL...');
    const response = await fetch('http://localhost:5000/api/quickbooks/auth?production=true');
    const data = await response.json();
    
    console.log('PRODUCTION QUICKBOOKS OAUTH URL:');
    console.log('='.repeat(80));
    console.log(data.authUrl);
    console.log('='.repeat(80));
    console.log('');
    
    console.log('NEXT STEPS:');
    console.log('1. Use this URL to connect to your REAL QuickBooks business account');
    console.log('2. Select your production company (ID: 9130351530529746)');
    console.log('3. Complete the authorization');
    console.log('4. System will automatically store production tokens');
    console.log('');
    
    console.log('WHAT THIS ENABLES:');
    console.log('✅ Connect to your real business QuickBooks account');
    console.log('✅ Create actual payroll bills for contractors');
    console.log('✅ Proper 1099 tracking for tax purposes');
    console.log('✅ Streamlined wedding industry contractor payments');
    console.log('✅ Integration with your existing QuickBooks data');
    
    return data.authUrl;
    
  } catch (error) {
    console.log('Error setting up production QuickBooks:', error.message);
    return null;
  }
};

setupProductionQuickBooks();