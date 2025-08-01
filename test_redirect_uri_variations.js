// Test different redirect URI variations to find the correct one

import fetch from 'node-fetch';

const testRedirectVariations = async () => {
  console.log('TESTING REDIRECT URI VARIATIONS FOR OAUTH ERROR...\n');
  
  const variations = [
    // Original
    'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback',
    
    // With trailing slash
    'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback/',
    
    // Different case
    'https://inkticate-time-tracker-pooranrajput.replit.app/api/QuickBooks/callback',
    
    // Without https
    'http://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback',
    
    // Different path structure
    'https://inkticate-time-tracker-pooranrajput.replit.app/quickbooks/callback',
    'https://inkticate-time-tracker-pooranrajput.replit.app/api/qb/callback',
    'https://inkticate-time-tracker-pooranrajput.replit.app/oauth/callback',
    
    // Replit-specific variations
    'https://inkticate-time-tracker-pooranrajput--5000.repl.co/api/quickbooks/callback',
    'https://5000-inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback'
  ];
  
  console.log('REDIRECT URI VARIATIONS TO TEST IN DASHBOARD:');
  console.log('='.repeat(80));
  
  variations.forEach((uri, index) => {
    console.log(`${index + 1}. ${uri}`);
  });
  
  console.log('='.repeat(80));
  console.log('');
  
  console.log('TESTING INSTRUCTIONS:');
  console.log('1. Go to developer.intuit.com → Your App → Production → Keys & OAuth');
  console.log('2. In "Redirect URIs" section, try adding these variations one by one');
  console.log('3. Save each configuration and test OAuth URL');
  console.log('4. The correct URI will allow successful OAuth connection');
  console.log('');
  
  console.log('MOST LIKELY CANDIDATES:');
  console.log('✓ Exact match: https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback');
  console.log('✓ With slash: https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback/');
  console.log('✓ Replit format: https://5000-inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback');
  console.log('');
  
  // Test current server endpoint
  try {
    console.log('TESTING CURRENT SERVER ENDPOINT...');
    const testResponse = await fetch('http://localhost:5000/api/quickbooks/callback', {
      method: 'GET'
    });
    
    if (testResponse.status === 200 || testResponse.status === 405) {
      console.log('✅ Server endpoint is accessible');
    } else {
      console.log(`❌ Server endpoint returned status: ${testResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Server endpoint test failed:', error.message);
  }
  
  console.log('');
  console.log('ACTION REQUIRED:');
  console.log('Add the most likely redirect URI candidates to your QuickBooks');
  console.log('app dashboard and test the OAuth connection again.');
  
  return variations;
};

testRedirectVariations();