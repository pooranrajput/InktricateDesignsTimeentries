// Debug why "undefined didn't connect" persists after app approval

import fetch from 'node-fetch';

const debugApprovedAppError = async () => {
  console.log('DEBUGGING "undefined didn\'t connect" ERROR AFTER APP APPROVAL...\n');
  
  try {
    // Check if we're actually using production credentials
    console.log('1. VERIFYING PRODUCTION CREDENTIAL STATUS:');
    console.log('   - App Status: APPROVED by QuickBooks');
    console.log('   - Environment: Production');
    console.log('   - Sandbox Mode: DISABLED');
    console.log('');
    
    console.log('2. POTENTIAL ISSUES AFTER APP APPROVAL:');
    console.log('   A. Production keys may not be the same as approval notification');
    console.log('   B. Redirect URI mismatch in QuickBooks developer dashboard');
    console.log('   C. App approval doesn\'t automatically activate production keys');
    console.log('   D. May need to manually retrieve NEW production keys from dashboard');
    console.log('');
    
    console.log('3. REQUIRED VERIFICATION STEPS:');
    console.log('   ✓ Log into QuickBooks Developer Dashboard');
    console.log('   ✓ Go to Production Settings → Keys & credentials');
    console.log('   ✓ Verify production Client ID and Secret are visible');
    console.log('   ✓ Confirm redirect URI is exactly:');
    console.log('     https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback');
    console.log('   ✓ Check if new production keys were generated after approval');
    console.log('');
    
    console.log('4. COMMON POST-APPROVAL ISSUES:');
    console.log('   - App approval ≠ automatic production key activation');
    console.log('   - Production keys might be different from what you have');
    console.log('   - Redirect URI configuration might not be complete');
    console.log('   - Additional app configuration steps may be required');
    console.log('');
    
    // Generate a test URL with current credentials
    const response = await fetch('http://localhost:5000/api/quickbooks/auth?debug=post-approval');
    const data = await response.json();
    
    console.log('5. CURRENT CONFIGURATION TEST:');
    console.log('='.repeat(80));
    console.log(data.authUrl);
    console.log('='.repeat(80));
    console.log('');
    
    console.log('6. NEXT TROUBLESHOOTING STEPS:');
    console.log('   1. Access your QuickBooks Developer Dashboard');
    console.log('   2. Navigate to Production Settings');
    console.log('   3. Verify production keys are displayed and active');
    console.log('   4. Copy the EXACT production Client ID and Secret');
    console.log('   5. Update environment variables if keys have changed');
    console.log('   6. Ensure redirect URI is configured correctly');
    console.log('');
    
    console.log('❗ CRITICAL: App approval notification doesn\'t guarantee');
    console.log('   production keys are automatically active. Manual verification required.');
    
    return data.authUrl;
    
  } catch (error) {
    console.log('Error during debugging:', error.message);
    return null;
  }
};

debugApprovedAppError();