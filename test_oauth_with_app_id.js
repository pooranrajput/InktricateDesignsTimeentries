// Create test endpoint to verify App ID vs Client ID
const express = require('express');

// Test OAuth with App ID as Client ID
const appId = '7ccd23c7-a525-4cb8-8c30-df60652e4603';
const clientSecret = 'ezxQeCSAH2uQ3SpXAFKG0pezNOsNgFI26cIKEnDU';
const redirectUri = 'https://inkticate-time-tracker-pooranrajput.replit.app/api/quickbooks/callback';

console.log('🧪 OAUTH TEST - APP ID AS CLIENT ID');
console.log('='.repeat(50));

// Generate authorization URL with App ID
const baseUrl = 'https://appcenter.intuit.com/connect/oauth2';
const params = new URLSearchParams({
  client_id: appId,  // Using App ID as Client ID
  scope: 'com.intuit.quickbooks.accounting',
  redirect_uri: redirectUri,
  response_type: 'code',
  state: 'app-id-test'
});

const authUrlWithAppId = `${baseUrl}?${params.toString()}`;

console.log('\n📋 TEST CONFIGURATION:');
console.log('Using App ID as Client ID:', appId);
console.log('Client Secret:', clientSecret.substring(0, 10) + '...');
console.log('Redirect URI:', redirectUri);

console.log('\n🔗 TEST AUTHORIZATION URL:');
console.log(authUrlWithAppId);

console.log('\n🎯 TESTING HYPOTHESIS:');
console.log('If QuickBooks OAuth error was caused by wrong credential type,');
console.log('this App ID-based URL should work correctly.');
console.log('If this still fails, the issue is app configuration in Developer Dashboard.');

console.log('\n📝 NEXT VERIFICATION:');
console.log('1. Click the URL above');
console.log('2. Check if OAuth proceeds without error page');
console.log('3. If successful, update all code to use App ID as Client ID');
console.log('4. If still fails, focus on Developer Dashboard configuration');