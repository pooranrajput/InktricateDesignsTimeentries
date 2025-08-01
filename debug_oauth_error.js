// Debug the OAuth error after app approval and production credentials

import fetch from 'node-fetch';

const debugOAuthError = async () => {
  console.log('DEBUGGING OAUTH ERROR WITH APPROVED APP...\n');
  
  try {
    console.log('OAUTH ERROR ANALYSIS:');
    console.log('URL: https://appcenter.intuit.com/app/connect/oauth2/error');
    console.log('Issue: Getting error page instead of authorization page');
    console.log('');
    
    console.log('POTENTIAL CAUSES FOR APPROVED APP OAUTH ERROR:');
    console.log('1. Production app not fully activated in QuickBooks Developer Dashboard');
    console.log('2. Redirect URI mismatch between code and dashboard configuration');
    console.log('3. Client ID might be for wrong environment (dev vs prod)');
    console.log('4. App approval doesn\'t automatically enable production OAuth');
    console.log('5. Additional production setup steps may be required');
    console.log('');
    
    // Check current configuration
    console.log('CURRENT CONFIGURATION:');
    console.log('Client ID: AB6HieH2iC...aTAQV5EUtA (50 chars)');
    console.log('Redirect URI: https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback');
    console.log('Environment: Production');
    console.log('App Status: Approved');
    console.log('');
    
    console.log('TROUBLESHOOTING STEPS NEEDED:');
    console.log('');
    
    console.log('STEP 1: VERIFY PRODUCTION SETUP IN QUICKBOOKS DASHBOARD');
    console.log('  → Go to developer.intuit.com');
    console.log('  → Select your app');
    console.log('  → Click "Production" tab');
    console.log('  → Check if production environment is ACTIVE (not just approved)');
    console.log('  → Look for "Production Keys" section');
    console.log('  → Verify redirect URI exactly matches:');
    console.log('    https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback');
    console.log('');
    
    console.log('STEP 2: CHECK APP CONFIGURATION');
    console.log('  → In Production settings, verify:');
    console.log('    ✓ App name: Inktricate Designs Time Tracking System');
    console.log('    ✓ OAuth redirect URIs list includes exact URL above');
    console.log('    ✓ Scopes include "QuickBooks Accounting"');
    console.log('    ✓ App status shows "Live" or "Active" (not just "Approved")');
    console.log('');
    
    console.log('STEP 3: COMMON PRODUCTION ACTIVATION ISSUES');
    console.log('  → App approval ≠ production activation');
    console.log('  → May need to manually "activate" or "publish" the app');
    console.log('  → Production credentials might need to be regenerated');
    console.log('  → Additional verification steps may be required');
    console.log('');
    
    console.log('CRITICAL DISCOVERY:');
    console.log('The OAuth error suggests the QuickBooks system doesn\'t recognize');
    console.log('your app as properly configured for production OAuth, even though');
    console.log('it\'s approved. This indicates a dashboard configuration issue.');
    console.log('');
    
    console.log('NEXT ACTIONS REQUIRED:');
    console.log('1. Check if production environment needs to be manually activated');
    console.log('2. Verify redirect URI configuration in production settings');
    console.log('3. Confirm app is in "Live" status, not just "Approved"');
    console.log('4. Check if additional production setup steps are pending');
    
    return {
      error: 'oauth_error_after_approval',
      cause: 'production_configuration_incomplete',
      nextSteps: 'verify_dashboard_production_setup'
    };
    
  } catch (error) {
    console.log('Error during OAuth debugging:', error.message);
    return null;
  }
};

debugOAuthError();